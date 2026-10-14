export interface PasswordHasher {
  generar(passwordPlano: string): Promise<string>;
  comparar(passwordPlano: string, passwordHash: string): Promise<boolean>;
}
