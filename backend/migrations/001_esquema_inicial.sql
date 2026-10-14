-- =============================================================
-- GUSTADENT - Esquema inicial
-- La transacción la controla el migrador (src/database/migrator.ts).
-- =============================================================

-- Catálogos

CREATE TABLE empresa (
  id_empresa      SERIAL PRIMARY KEY,
  nombre_empresa  VARCHAR(50)  NOT NULL,
  ruc             CHAR(11)     NOT NULL UNIQUE CHECK (ruc ~ '^[0-9]{11}$'),
  direccion       VARCHAR(80),
  telefono        VARCHAR(16)
);

COMMENT ON TABLE empresa IS 'Datos de la clínica. Debe contener una sola fila.';

CREATE TABLE sucursales (
  id_sucursal  SERIAL PRIMARY KEY,
  nombre       VARCHAR(20)  NOT NULL UNIQUE,
  direccion    VARCHAR(80),
  activo       BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE procedencias (
  id_procedencia  SERIAL PRIMARY KEY,
  nombre          VARCHAR(30) NOT NULL UNIQUE
);

-- Usuarios (personal de la clínica)

CREATE TABLE usuarios (
  id_usuario       SERIAL PRIMARY KEY,
  dni              CHAR(8)      NOT NULL UNIQUE CHECK (dni ~ '^[0-9]{8}$'),
  nombre_completo  VARCHAR(80)  NOT NULL,
  especialidad     VARCHAR(25),
  telefono         VARCHAR(16),
  username         VARCHAR(20)  NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  perfil           VARCHAR(20)  NOT NULL
                   CHECK (perfil IN ('administrador', 'odontologo', 'recepcion')),
  activo           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN usuarios.password_hash IS 'Hash bcrypt/argon2. Nunca texto plano.';

CREATE TABLE usuario_sucursales (
  id_usuario   INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_sucursal  INTEGER NOT NULL REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
  PRIMARY KEY (id_usuario, id_sucursal)
);

CREATE INDEX idx_usuario_sucursales_sucursal ON usuario_sucursales (id_sucursal);

-- Pacientes

CREATE TABLE pacientes (
  id_paciente       SERIAL PRIMARY KEY,
  dni               CHAR(8)     NOT NULL UNIQUE CHECK (dni ~ '^[0-9]{8}$'),
  nombres           VARCHAR(40) NOT NULL,
  ap_paterno        VARCHAR(20) NOT NULL,
  ap_materno        VARCHAR(20),
  fecha_nacimiento  DATE        CHECK (fecha_nacimiento <= CURRENT_DATE),
  sexo              CHAR(1)     CHECK (sexo IN ('M', 'F')),
  telefono          VARCHAR(16),
  id_procedencia    INTEGER REFERENCES procedencias(id_procedencia),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pacientes_apellidos ON pacientes (ap_paterno, ap_materno);

-- Atenciones (tickets) y sesiones

CREATE TABLE tickets (
  id_ticket    SERIAL PRIMARY KEY,
  id_paciente  INTEGER       NOT NULL REFERENCES pacientes(id_paciente),
  id_sucursal  INTEGER       NOT NULL REFERENCES sucursales(id_sucursal),
  id_usuario   INTEGER       NOT NULL REFERENCES usuarios(id_usuario),
  fecha        DATE          NOT NULL DEFAULT CURRENT_DATE,
  descripcion  TEXT,
  costo        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (costo >= 0),
  descuento    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
  estado       VARCHAR(12)   NOT NULL DEFAULT 'borrador'
               CHECK (estado IN ('borrador', 'activo', 'finalizado', 'anulado')),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CHECK (descuento <= costo)
);

CREATE INDEX idx_tickets_paciente ON tickets (id_paciente);
CREATE INDEX idx_tickets_fecha    ON tickets (fecha);
CREATE INDEX idx_tickets_sucursal ON tickets (id_sucursal);
CREATE INDEX idx_tickets_usuario  ON tickets (id_usuario);

CREATE TABLE sesiones (
  id_sesion     SERIAL PRIMARY KEY,
  id_ticket     INTEGER       NOT NULL REFERENCES tickets(id_ticket) ON DELETE CASCADE,
  numero        SMALLINT      NOT NULL CHECK (numero > 0),
  tipo          VARCHAR(10)   NOT NULL DEFAULT 'sesion'
                CHECK (tipo IN ('primera', 'sesion')),
  fecha_hora    TIMESTAMPTZ   NOT NULL,
  observaciones TEXT,
  monto         NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (monto >= 0),
  estado        VARCHAR(12)   NOT NULL DEFAULT 'programado'
                CHECK (estado IN ('programado', 'atendido', 'cancelado')),
  id_usuario    INTEGER REFERENCES usuarios(id_usuario),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (id_ticket, numero)
);

CREATE INDEX idx_sesiones_fecha_hora ON sesiones (fecha_hora);
CREATE INDEX idx_sesiones_usuario    ON sesiones (id_usuario);

-- Pagos (abonos parciales)

CREATE TABLE pagos (
  id_pago     SERIAL PRIMARY KEY,
  id_ticket   INTEGER       NOT NULL REFERENCES tickets(id_ticket),
  monto       NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  forma_pago  VARCHAR(15)   NOT NULL
              CHECK (forma_pago IN ('efectivo', 'tarjeta', 'yape', 'plin', 'transferencia')),
  fecha_pago  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  id_usuario  INTEGER       NOT NULL REFERENCES usuarios(id_usuario)
);

CREATE INDEX idx_pagos_ticket ON pagos (id_ticket);

-- Funciones y triggers

CREATE OR REPLACE FUNCTION fn_actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE TRIGGER trg_sesiones_updated_at
  BEFORE UPDATE ON sesiones
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE TRIGGER trg_pacientes_updated_at
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE OR REPLACE FUNCTION fn_validar_pago()
RETURNS TRIGGER AS $$
DECLARE
  v_a_pagar  NUMERIC(10,2);
  v_pagado   NUMERIC(10,2);
BEGIN
  SELECT costo - descuento
    INTO v_a_pagar
    FROM tickets
   WHERE id_ticket = NEW.id_ticket
     FOR UPDATE;

  SELECT COALESCE(SUM(monto), 0)
    INTO v_pagado
    FROM pagos
   WHERE id_ticket = NEW.id_ticket;

  IF v_pagado + NEW.monto > v_a_pagar THEN
    RAISE EXCEPTION 'El pago supera la deuda del ticket %', NEW.id_ticket
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pagos_validar
  BEFORE INSERT ON pagos
  FOR EACH ROW EXECUTE FUNCTION fn_validar_pago();

-- Vista de resumen de cuenta (calculada, no almacenada)

CREATE VIEW v_resumen_ticket AS
SELECT
  t.id_ticket,
  t.id_paciente,
  t.costo,
  t.descuento,
  COALESCE(p.total_pagado, 0)                         AS pagado,
  t.costo - t.descuento - COALESCE(p.total_pagado, 0) AS deuda
FROM tickets t
LEFT JOIN (
  SELECT id_ticket, SUM(monto) AS total_pagado
    FROM pagos
   GROUP BY id_ticket
) p ON p.id_ticket = t.id_ticket;
