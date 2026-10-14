import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { Server } from '../../src/app';

let servidor: HttpServer;
let urlBase: string;

before(async () => {
  const app = new Server().app;
  servidor = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolver) => servidor.once('listening', () => resolver()));
  const direccion = servidor.address() as AddressInfo;
  urlBase = `http://127.0.0.1:${direccion.port}`;
});

after(async () => {
  await new Promise<void>((resolver, rechazar) => {
    servidor.close((error) => (error ? rechazar(error) : resolver()));
  });
});

test('GET /api/health responde ok', async () => {
  const respuesta = await fetch(`${urlBase}/api/health`);

  assert.equal(respuesta.status, 200);
  assert.deepEqual(await respuesta.json(), { estado: 'ok' });
});

test('los pasos de configuración inicial rechazan solicitudes sin token', async () => {
  const respuesta = await fetch(`${urlBase}/api/setup/empresa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 401);
  assert.equal(cuerpo.codigo, 'SETUP_TOKEN_INVALIDO');
});

test('el listado de usuarios exige sesión', async () => {
  const respuesta = await fetch(`${urlBase}/api/usuarios`);
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 401);
  assert.equal(cuerpo.codigo, 'NO_AUTENTICADO');
});

test('los catálogos exigen sesión', async () => {
  const catalogos = ['sucursales', 'procedencias'];
  const resultados = await Promise.all(
    catalogos.map(async (catalogo) => {
      const respuesta = await fetch(`${urlBase}/api/${catalogo}`);
      return { catalogo, status: respuesta.status };
    })
  );

  for (const resultado of resultados) {
    assert.equal(resultado.status, 401, `el catálogo ${resultado.catalogo} no exige sesión`);
  }
});

test('el módulo de pacientes exige sesión', async () => {
  const respuesta = await fetch(`${urlBase}/api/pacientes`);
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 401);
  assert.equal(cuerpo.codigo, 'NO_AUTENTICADO');
});

test('una ruta inexistente responde 404 con código de error', async () => {
  const respuesta = await fetch(`${urlBase}/api/noexiste`);
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 404);
  assert.equal(cuerpo.codigo, 'RUTA_NO_ENCONTRADA');
});
