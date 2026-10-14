import { Perfil } from '../../domain/usuario-autenticable';

export interface TokenPayload {
  sub: number;
  perfil: Perfil;
  version: number;
}

export interface TokenService {
  generar(payload: TokenPayload): string;
  verificar(token: string): TokenPayload;
}
