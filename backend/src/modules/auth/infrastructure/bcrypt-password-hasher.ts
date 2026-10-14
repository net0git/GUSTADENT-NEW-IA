import bcrypt from 'bcrypt';
import { PasswordHasher } from '../application/ports/password-hasher.port';

const COSTO_HASH = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  generar(passwordPlano: string): Promise<string> {
    return bcrypt.hash(passwordPlano, COSTO_HASH);
  }

  comparar(passwordPlano: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(passwordPlano, passwordHash);
  }
}
