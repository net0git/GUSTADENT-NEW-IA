export class AppError extends Error {
  public readonly statusCode: number;
  public readonly codigo: string;

  constructor(statusCode: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.codigo = codigo;
  }
}
