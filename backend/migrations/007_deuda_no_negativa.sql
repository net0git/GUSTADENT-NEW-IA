-- La deuda de una atencion no puede ser negativa.
--
-- La deuda es `costo - descuento - SUM(sesiones.monto)`, asi que el total de los
-- montos de las sesiones no puede superar lo que se indico. La aplicacion ya lo
-- valida antes de escribir; estos triggers son la ultima linea de defensa para
-- cualquier otra via de entrada.

CREATE OR REPLACE FUNCTION fn_validar_monto_sesion()
RETURNS TRIGGER AS $$
DECLARE
  v_limite     NUMERIC(10,2);
  v_acumulado  NUMERIC(10,2);
BEGIN
  SELECT t.costo - t.descuento
    INTO v_limite
    FROM tickets t
   WHERE t.id_ticket = NEW.id_ticket;

  -- Se excluye la propia fila para que en un UPDATE no se sume dos veces.
  SELECT COALESCE(SUM(s.monto), 0)
    INTO v_acumulado
    FROM sesiones s
   WHERE s.id_ticket = NEW.id_ticket
     AND s.id_sesion <> NEW.id_sesion;

  IF v_acumulado + NEW.monto > v_limite THEN
    RAISE EXCEPTION
      'El total de las sesiones (S/ % ) supera el monto indicado de la atención (S/ %) - DEUDA_NEGATIVA',
      v_acumulado + NEW.monto, v_limite
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sesiones_monto
  BEFORE INSERT OR UPDATE OF monto ON sesiones
  FOR EACH ROW EXECUTE FUNCTION fn_validar_monto_sesion();

-- El total tampoco puede quedar por debajo de lo ya cobrado en las sesiones.
CREATE OR REPLACE FUNCTION fn_validar_total_atencion()
RETURNS TRIGGER AS $$
DECLARE
  v_sesiones NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(s.monto), 0)
    INTO v_sesiones
    FROM sesiones s
   WHERE s.id_ticket = NEW.id_ticket;

  IF v_sesiones > NEW.costo - NEW.descuento THEN
    RAISE EXCEPTION
      'El total de las sesiones (S/ % ) supera el monto indicado de la atención (S/ %) - DEUDA_NEGATIVA',
      v_sesiones, NEW.costo - NEW.descuento
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_monto
  BEFORE INSERT OR UPDATE OF costo, descuento ON tickets
  FOR EACH ROW EXECUTE FUNCTION fn_validar_total_atencion();