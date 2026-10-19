-- =============================================================
-- GUSTADENT - Datos de prueba (solo desarrollo)
-- No modifica la configuracion inicial: empresa, sucursal y el
-- administrador creado por el asistente quedan intactos.
--
-- Uso:
--   psql -h localhost -U neto -d GUSTADENT -v ON_ERROR_STOP=1 -f backend/seeds/datos-prueba.sql
--
-- Todos los usuarios de prueba usan la contrasena: Gusta2026
-- =============================================================

BEGIN;

-- El script solo corre sobre una base sin pacientes: evita duplicar la siembra.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pacientes) THEN
    RAISE EXCEPTION 'Ya existen pacientes: no se vuelven a cargar los datos de prueba';
  END IF;
END $$;

-- Catalogos -----------------------------------------------------

INSERT INTO procedencias (nombre) VALUES
  ('Recomendacion'),
  ('Redes sociales'),
  ('Paciente recurrente'),
  ('Feria de salud'),
  ('Convenio empresarial'),
  ('Pasacalle');

-- Personal (el administrador de la configuracion inicial no se toca)

INSERT INTO usuarios (dni, nombre_completo, especialidad, telefono, username, password_hash, perfil) VALUES
  ('28456713', 'ROSA MILAGROS TORRES VARGAS', 'Ortodoncia', '984111222', 'RTORRES',
   '$2b$12$0J5lfWaB/9kw.hg4w.xevOvnm5xMudwy2593xtv7JdAnIZOXzPuam', 'odontologo'),
  ('31654782', 'JUAN CARLOS MENDOZA PEREZ', 'Cirugia oral', '984333444', 'JMENDOZA',
   '$2b$12$0J5lfWaB/9kw.hg4w.xevOvnm5xMudwy2593xtv7JdAnIZOXzPuam', 'odontologo'),
  ('47283615', 'LUCIA FERNANDA APAZA CONDO', 'Odontopediatria', '984555666', 'LAPAZA',
   '$2b$12$0J5lfWaB/9kw.hg4w.xevOvnm5xMudwy2593xtv7JdAnIZOXzPuam', 'odontologo'),
  ('52846137', 'KARINA SOLEDAD HUAMAN CHAVEZ', 'Recepcion', '984777888', 'KHUAMAN',
   '$2b$12$0J5lfWaB/9kw.hg4w.xevOvnm5xMudwy2593xtv7JdAnIZOXzPuam', 'recepcion'),
  ('63917482', 'PEDRO MIGUEL ZAMALLOA ROJAS', 'Recepcion', '984999000', 'PZAMALLOA',
   '$2b$12$0J5lfWaB/9kw.hg4w.xevOvnm5xMudwy2593xtv7JdAnIZOXzPuam', 'recepcion');

INSERT INTO usuario_sucursales (id_usuario, id_sucursal)
SELECT u.id_usuario, s.id_sucursal
  FROM usuarios u
 CROSS JOIN sucursales s
 WHERE u.username IN ('RTORRES', 'JMENDOZA', 'LAPAZA', 'KHUAMAN', 'PZAMALLOA')
ON CONFLICT DO NOTHING;

-- Pacientes -----------------------------------------------------

INSERT INTO pacientes (dni, nombres, ap_paterno, ap_materno, fecha_nacimiento, sexo, telefono, id_procedencia) VALUES
  ('45871236', 'MARIA ELENA', 'QUISPE', 'HUAMAN', '1985-03-12', 'F', '984123567', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Recomendacion')),
  ('72145689', 'JOSE LUIS', 'MAMANI', 'CCOA', '1978-07-25', 'M', '951234876', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Redes sociales')),
  ('60321458', 'VALERIA NICOLE', 'PAREDES', 'RIOS', '2016-11-03', 'F', '934567812', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Paciente recurrente')),
  ('41258963', 'CARLOS ALBERTO', 'SOTO', 'AGUILAR', '1969-01-19', 'M', '918765432', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Feria de salud')),
  ('75369841', 'ANA LUCIA', 'CONDORI', 'MAMANI', '1992-05-08', 'F', '987345612', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Convenio empresarial')),
  ('58412369', 'LUIS FERNANDO', 'CHAVEZ', 'QUISPE', '1988-09-30', 'M', '945678123', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Pasacalle')),
  ('36985214', 'ROSA MERCEDES', 'VARGAS', 'LOAIZA', '1975-12-15', 'F', '912345678', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Recomendacion')),
  ('69852314', 'JORGE ANDRES', 'HUAMAN', 'TORRES', '2001-04-22', 'M', '956781234', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Redes sociales')),
  ('74581236', 'SILVIA KARINA', 'APAZA', 'CRUZ', '1996-08-14', 'F', '978456123', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Paciente recurrente')),
  ('51236984', 'MIGUEL ANGEL', 'ROJAS', 'PEREZ', '1983-02-28', 'M', '923456781', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Feria de salud')),
  ('83692514', 'LUCIA FERNANDA', 'ZAMALLOA', 'VARGAS', '1990-06-17', 'F', '961234587', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Convenio empresarial')),
  ('69258147', 'PEDRO PABLO', 'MAMANI', 'QUISPE', '1962-10-05', 'M', '934512678', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Recomendacion')),
  ('75836925', 'CARMEN ROSA', 'FLORES', 'PUMACAHUA', '1971-03-09', 'F', '986541237', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Pasacalle')),
  ('48125963', 'RICARDO JAVIER', 'MENDOZA', 'APAZA', '1957-07-21', 'M', '915874236', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Paciente recurrente')),
  ('63925814', 'MARIA FERNANDA', 'TORRES', 'CACERES', '2008-01-30', 'F', '947123658', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Redes sociales')),
  ('52741896', 'DANIEL ALEJANDRO', 'SOTO', 'MAMANI', '1999-11-11', 'M', '982365147', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Feria de salud')),
  ('81425963', 'GABRIELA ALEJANDRA', 'PAREDES', 'VARGAS', '2012-09-07', 'F', '936258147', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Recomendacion')),
  ('47581236', 'WALTER HUGO', 'CONDORI', 'ROJAS', '1980-04-04', 'M', '964852137', (SELECT id_procedencia FROM procedencias WHERE nombre = 'Redes sociales'));

-- Atenciones ----------------------------------------------------

CREATE TEMP TABLE seed_sucursal ON COMMIT DROP AS
SELECT id_sucursal FROM sucursales ORDER BY id_sucursal LIMIT 1;

CREATE TEMP TABLE seed_tickets (
  clave      TEXT PRIMARY KEY,
  id_ticket  INTEGER NOT NULL
) ON COMMIT DROP;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '45871236'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'RTORRES'),
         '2026-08-05', '09:00', 'Ortodoncia: instalacion de brackets', 1800, 100, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T01', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '72145689'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'JMENDOZA'),
         '2026-08-12', '10:30', 'Extraccion de tercera molar', 350, 0, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T02', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '60321458'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'LAPAZA'),
         '2026-08-19', '15:00', 'Pulpectomia pieza 75', 300, 0, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T03', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '41258963'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'RTORRES'),
         '2026-08-26', '11:00', 'Limpieza dental y destartraje', 120, 0, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T04', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '75369841'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'JMENDOZA'),
         '2026-09-03', '09:30', 'Endodoncia pieza 36', 600, 50, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T05', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '58412369'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'LAPAZA'),
         '2026-09-10', '16:00', 'Profilaxis y aplicacion de fluor', 90, 0, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T06', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '36985214'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'RTORRES'),
         '2026-09-17', '10:00', 'Corona de porcelana pieza 11', 900, 100, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T07', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '69852314'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'JMENDOZA'),
         '2026-09-24', '12:00', 'Exodoncia simple pieza 38', 150, 0, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T08', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '74581236'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'LAPAZA'),
         '2026-09-29', '09:00', 'Sellado de fosas y fisuras', 100, 0, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T09', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '51236984'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'RTORRES'),
         '2026-10-01', '09:00', 'Control de ortodoncia', 180, 0, 'activo'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T10', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '83692514'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'JMENDOZA'),
         '2026-10-05', '11:30', 'Implante dental pieza 14', 2500, 200, 'activo'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T11', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '69258147'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'LAPAZA'),
         '2026-10-06', '15:30', 'Curacion de caries pieza 85', 110, 0, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T12', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '75836925'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'RTORRES'),
         '2026-10-08', '10:00', 'Blanqueamiento dental', 450, 50, 'activo'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T13', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '48125963'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'JMENDOZA'),
         '2026-10-12', '09:30', 'Protesis parcial removible', 1200, 0, 'activo'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T14', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '63925814'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'LAPAZA'),
         '2026-10-13', '16:30', 'Consulta y evaluacion', 60, 0, 'finalizado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T15', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '45871236'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'RTORRES'),
         '2026-10-19', '09:00', 'Control de ortodoncia', 180, 0, 'activo'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T16', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '52741896'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'JMENDOZA'),
         '2026-10-19', '10:30', 'Resina compuesta pieza 26', 180, 0, 'borrador'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T17', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '81425963'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'LAPAZA'),
         '2026-10-19', '12:00', 'Limpieza dental y destartraje', 120, 0, 'borrador'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T18', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '47581236'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'RTORRES'),
         '2026-10-19', '15:00', 'Consulta y evaluacion', 60, 0, 'borrador'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T19', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '60321458'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'JMENDOZA'),
         '2026-10-20', '09:00', 'Resina compuesta pieza 16', 180, 0, 'borrador'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T20', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '58412369'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'LAPAZA'),
         '2026-10-21', '11:00', 'Control de tratamiento', 90, 0, 'borrador'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T21', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '74581236'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'RTORRES'),
         '2026-10-23', '10:00', 'Endodoncia pieza 46', 650, 0, 'borrador'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T22', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '41258963'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'JMENDOZA'),
         '2026-09-15', '14:00', 'Extraccion de molar pieza 47', 300, 0, 'anulado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T23', id_ticket FROM t;

WITH t AS (
  INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
  SELECT (SELECT id_paciente FROM pacientes WHERE dni = '69258147'),
         (SELECT id_sucursal FROM seed_sucursal),
         (SELECT id_usuario FROM usuarios WHERE username = 'LAPAZA'),
         '2026-10-02', '11:00', 'Blanqueamiento dental', 400, 0, 'anulado'
  RETURNING id_ticket
)
INSERT INTO seed_tickets SELECT 'T24', id_ticket FROM t;

-- Sesiones (citas). El total por atencion nunca supera costo - descuento.

INSERT INTO sesiones (id_ticket, numero, tipo, fecha_hora, monto, estado, id_usuario)
SELECT t.id_ticket, s.numero, s.tipo, s.fecha_hora, s.monto, s.estado,
       (SELECT id_usuario FROM usuarios WHERE username = s.username)
  FROM (VALUES
    ('T01', 1, 'primera', TIMESTAMPTZ '2026-08-05 09:00:00-05', 400.00, 'atendido', 'RTORRES'),
    ('T01', 2, 'sesion',  TIMESTAMPTZ '2026-09-02 09:00:00-05', 600.00, 'atendido', 'RTORRES'),
    ('T01', 3, 'sesion',  TIMESTAMPTZ '2026-10-07 09:00:00-05', 500.00, 'atendido', 'RTORRES'),
    ('T02', 1, 'primera', TIMESTAMPTZ '2026-08-12 10:30:00-05', 350.00, 'atendido', 'JMENDOZA'),
    ('T03', 1, 'primera', TIMESTAMPTZ '2026-08-19 15:00:00-05', 150.00, 'atendido', 'LAPAZA'),
    ('T03', 2, 'sesion',  TIMESTAMPTZ '2026-09-16 15:00:00-05', 150.00, 'atendido', 'LAPAZA'),
    ('T04', 1, 'primera', TIMESTAMPTZ '2026-08-26 11:00:00-05', 120.00, 'atendido', 'RTORRES'),
    ('T05', 1, 'primera', TIMESTAMPTZ '2026-09-03 09:30:00-05', 250.00, 'atendido', 'JMENDOZA'),
    ('T05', 2, 'sesion',  TIMESTAMPTZ '2026-10-01 09:30:00-05', 300.00, 'atendido', 'JMENDOZA'),
    ('T06', 1, 'primera', TIMESTAMPTZ '2026-09-10 16:00:00-05',  90.00, 'atendido', 'LAPAZA'),
    ('T07', 1, 'primera', TIMESTAMPTZ '2026-09-17 10:00:00-05', 400.00, 'atendido', 'RTORRES'),
    ('T07', 2, 'sesion',  TIMESTAMPTZ '2026-10-15 10:00:00-05', 400.00, 'atendido', 'RTORRES'),
    ('T08', 1, 'primera', TIMESTAMPTZ '2026-09-24 12:00:00-05', 150.00, 'atendido', 'JMENDOZA'),
    ('T09', 1, 'primera', TIMESTAMPTZ '2026-09-29 09:00:00-05', 100.00, 'atendido', 'LAPAZA'),
    ('T10', 1, 'primera', TIMESTAMPTZ '2026-10-01 09:00:00-05',  90.00, 'atendido', 'RTORRES'),
    ('T10', 2, 'sesion',  TIMESTAMPTZ '2026-11-05 09:00:00-05',  90.00, 'programado', 'RTORRES'),
    ('T11', 1, 'primera', TIMESTAMPTZ '2026-10-05 11:30:00-05', 800.00, 'atendido', 'JMENDOZA'),
    ('T11', 2, 'sesion',  TIMESTAMPTZ '2026-11-10 11:30:00-05', 800.00, 'programado', 'JMENDOZA'),
    ('T12', 1, 'primera', TIMESTAMPTZ '2026-10-06 15:30:00-05', 110.00, 'atendido', 'LAPAZA'),
    ('T13', 1, 'primera', TIMESTAMPTZ '2026-10-08 10:00:00-05', 200.00, 'atendido', 'RTORRES'),
    ('T13', 2, 'sesion',  TIMESTAMPTZ '2026-10-22 10:00:00-05', 200.00, 'programado', 'RTORRES'),
    ('T14', 1, 'primera', TIMESTAMPTZ '2026-10-12 09:30:00-05', 400.00, 'atendido', 'JMENDOZA'),
    ('T14', 2, 'sesion',  TIMESTAMPTZ '2026-11-16 09:30:00-05', 400.00, 'programado', 'JMENDOZA'),
    ('T15', 1, 'primera', TIMESTAMPTZ '2026-10-13 16:30:00-05',  60.00, 'atendido', 'LAPAZA'),
    ('T16', 1, 'primera', TIMESTAMPTZ '2026-10-19 09:00:00-05',  90.00, 'atendido', 'RTORRES'),
    ('T16', 2, 'sesion',  TIMESTAMPTZ '2026-11-19 09:00:00-05',  90.00, 'programado', 'RTORRES'),
    ('T17', 1, 'primera', TIMESTAMPTZ '2026-10-19 10:30:00-05',   0.00, 'programado', 'JMENDOZA'),
    ('T18', 1, 'primera', TIMESTAMPTZ '2026-10-19 12:00:00-05',   0.00, 'programado', 'LAPAZA'),
    ('T19', 1, 'primera', TIMESTAMPTZ '2026-10-19 15:00:00-05',   0.00, 'programado', 'RTORRES'),
    ('T20', 1, 'primera', TIMESTAMPTZ '2026-10-20 09:00:00-05',   0.00, 'programado', 'JMENDOZA'),
    ('T21', 1, 'primera', TIMESTAMPTZ '2026-10-21 11:00:00-05',   0.00, 'programado', 'LAPAZA'),
    ('T22', 1, 'primera', TIMESTAMPTZ '2026-10-23 10:00:00-05',   0.00, 'programado', 'RTORRES'),
    ('T23', 1, 'primera', TIMESTAMPTZ '2026-09-15 14:00:00-05',   0.00, 'cancelado', 'JMENDOZA'),
    ('T24', 1, 'primera', TIMESTAMPTZ '2026-10-02 11:00:00-05',   0.00, 'cancelado', 'LAPAZA')
  ) AS s(clave, numero, tipo, fecha_hora, monto, estado, username)
  JOIN seed_tickets t ON t.clave = s.clave;

-- Pagos (abonos). Nunca superan el total de la atencion.

INSERT INTO pagos (id_ticket, monto, forma_pago, fecha_pago, id_usuario)
SELECT t.id_ticket, p.monto, p.forma_pago, p.fecha_pago,
       (SELECT id_usuario FROM usuarios WHERE username = p.username)
  FROM (VALUES
    ('T01', 1000.00, 'efectivo',      TIMESTAMPTZ '2026-08-05 10:00:00-05', 'KHUAMAN'),
    ('T01',  300.00, 'yape',          TIMESTAMPTZ '2026-09-02 10:00:00-05', 'KHUAMAN'),
    ('T02',  350.00, 'efectivo',      TIMESTAMPTZ '2026-08-12 11:30:00-05', 'KHUAMAN'),
    ('T04',  120.00, 'plin',          TIMESTAMPTZ '2026-08-26 12:00:00-05', 'PZAMALLOA'),
    ('T05',  550.00, 'transferencia', TIMESTAMPTZ '2026-10-01 10:30:00-05', 'KHUAMAN'),
    ('T07',  500.00, 'tarjeta',       TIMESTAMPTZ '2026-09-17 11:00:00-05', 'KHUAMAN'),
    ('T07',  200.00, 'efectivo',      TIMESTAMPTZ '2026-10-15 11:00:00-05', 'PZAMALLOA'),
    ('T08',  150.00, 'yape',          TIMESTAMPTZ '2026-09-24 13:00:00-05', 'KHUAMAN'),
    ('T10',   90.00, 'yape',          TIMESTAMPTZ '2026-10-01 10:00:00-05', 'KHUAMAN'),
    ('T11',  800.00, 'transferencia', TIMESTAMPTZ '2026-10-05 12:30:00-05', 'KHUAMAN'),
    ('T12',  110.00, 'efectivo',      TIMESTAMPTZ '2026-10-06 16:30:00-05', 'PZAMALLOA'),
    ('T15',   60.00, 'yape',          TIMESTAMPTZ '2026-10-13 17:00:00-05', 'KHUAMAN'),
    ('T16',   90.00, 'efectivo',      TIMESTAMPTZ '2026-10-19 10:00:00-05', 'PZAMALLOA')
  ) AS p(clave, monto, forma_pago, fecha_pago, username)
  JOIN seed_tickets t ON t.clave = p.clave;

-- Condiciones del paciente -------------------------------------

INSERT INTO condiciones_paciente (id_paciente, descripcion, activo, id_atencion_alta, id_usuario)
SELECT (SELECT id_paciente FROM pacientes WHERE dni = c.dni),
       c.descripcion,
       c.activo,
       (SELECT id_ticket FROM seed_tickets WHERE clave = c.clave_ticket),
       (SELECT id_usuario FROM usuarios WHERE username = c.username)
  FROM (VALUES
    ('45871236', 'Hipertension arterial controlada', TRUE,  'T01',  'RTORRES'),
    ('72145689', 'Alergia a la penicilina',          TRUE,  NULL,   'JMENDOZA'),
    ('75369841', 'Diabetes mellitus tipo 2',         TRUE,  'T05',  'JMENDOZA'),
    ('36985214', 'Bruxismo nocturno',                FALSE, NULL,   'RTORRES'),
    ('74581236', 'Asma bronquial',                   TRUE,  NULL,   'LAPAZA'),
    ('83692514', 'Alergia al latex',                 TRUE,  'T11',  'JMENDOZA'),
    ('48125963', 'Tratamiento con anticoagulantes',  TRUE,  'T14',  'JMENDOZA'),
    ('52741896', 'Epilepsia controlada',             TRUE,  NULL,   'LAPAZA')
  ) AS c(dni, descripcion, activo, clave_ticket, username);

COMMIT;
