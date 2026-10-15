-- Condiciones del paciente: una lista de texto libre que describe sus
-- antecedentes clinicos (alergias, enfermedades cronicas, medicamentos,
-- reacciones a la anestesia y todo lo que el odontologo deba saber).
--
-- Se cargan al crear el paciente y se pueden agregar, corregir o quitar
-- durante cualquier atencion. Quitar no borra: la condicion queda desactivada
-- para conservar el registro de lo que se sabia del paciente en su momento.

CREATE TABLE condiciones_paciente (
  id_condicion   SERIAL PRIMARY KEY,
  id_paciente    INTEGER     NOT NULL REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
  descripcion    TEXT        NOT NULL CHECK (length(btrim(descripcion)) > 0),
  activo         BOOLEAN     NOT NULL DEFAULT TRUE,
  -- La condicion es del paciente: si la atencion se borra, se conserva y solo
  -- se limpia el vinculo.
  id_atencion_alta INTEGER   REFERENCES tickets(id_ticket) ON DELETE SET NULL,
  id_usuario     INTEGER     REFERENCES usuarios(id_usuario),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_condiciones_paciente ON condiciones_paciente (id_paciente);

CREATE TRIGGER trg_condiciones_updated_at
  BEFORE UPDATE ON condiciones_paciente
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();