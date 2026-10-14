import rateLimit from 'express-rate-limit';

const VENTANA_MINUTOS = 15;

const configuracionBase = {
  windowMs: VENTANA_MINUTOS * 60 * 1000,
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  message: {
    codigo: 'DEMASIADAS_SOLICITUDES',
    mensaje: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde',
  },
};

export const limiteLogin = rateLimit({
  ...configuracionBase,
  limit: 10,
});

export const limiteConfiguracionInicial = rateLimit({
  ...configuracionBase,
  limit: 30,
});
