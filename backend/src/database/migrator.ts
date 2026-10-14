import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { PoolClient } from 'pg';
import { pool } from './pool';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function asegurarTablaMigraciones(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre      VARCHAR(255) PRIMARY KEY,
      aplicada_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
}

async function obtenerAplicadas(client: PoolClient): Promise<Set<string>> {
  const resultado = await client.query<{ nombre: string }>(
    'SELECT nombre FROM schema_migrations'
  );
  return new Set(resultado.rows.map((fila) => fila.nombre));
}

async function listarArchivos(): Promise<string[]> {
  const archivos = await readdir(MIGRATIONS_DIR);
  return archivos.filter((archivo) => archivo.endsWith('.sql')).sort();
}

export async function ejecutarMigraciones(): Promise<void> {
  const client = await pool.connect();
  try {
    await asegurarTablaMigraciones(client);
    const aplicadas = await obtenerAplicadas(client);
    const archivos = await listarArchivos();

    for (const archivo of archivos) {
      if (aplicadas.has(archivo)) {
        continue;
      }

      const sql = await readFile(path.join(MIGRATIONS_DIR, archivo), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [archivo]);
        await client.query('COMMIT');
        console.log(`Migración aplicada: ${archivo}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Falló la migración ${archivo}: ${(error as Error).message}`);
      }
    }
  } finally {
    client.release();
  }
}
