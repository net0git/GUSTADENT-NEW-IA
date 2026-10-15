-- Las condiciones son del paciente, no de la atencion. Si una atencion se
-- borra, la condicion se conserva: solo se limpia el vinculo.
--
-- La migracion 008 creo la llave sin esta clausula, lo que hacia imposible
-- borrar una atencion que tuviera condiciones vinculadas.

ALTER TABLE condiciones_paciente
  DROP CONSTRAINT IF EXISTS condiciones_paciente_id_atencion_alta_fkey;

ALTER TABLE condiciones_paciente
  ADD CONSTRAINT condiciones_paciente_id_atencion_alta_fkey
  FOREIGN KEY (id_atencion_alta) REFERENCES tickets(id_ticket) ON DELETE SET NULL;