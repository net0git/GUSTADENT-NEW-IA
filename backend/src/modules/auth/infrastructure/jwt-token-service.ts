import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { TokenPayload, TokenService } from '../application/ports/token-service.port';

const DURACION_TOKEN = '8h';

export class JwtTokenService implements TokenService {
  generar(payload: TokenPayload): string {
    return jwt.sign(payload, env.jwtSecret, { expiresIn: DURACION_TOKEN });
  }

  verificar(token: string): TokenPayload {
    const decodificado = jwt.verify(token, env.jwtSecret);

    if (
      typeof decodificado !== 'object' ||
      typeof decodificado.sub !== 'number' ||
      typeof decodificado.version !== 'number' ||
      typeof decodificado.perfil !== 'string'
    ) {
      throw new Error('Token con formato inválido');
    }

    return {
      sub: decodificado.sub,
      perfil: decodificado.perfil as TokenPayload['perfil'],
      version: decodificado.version,
    };
  }
}
