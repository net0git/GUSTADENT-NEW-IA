-- El monto pagado de una atencion es la suma de los montos de sus sesiones.
-- Antes se tomaba de la tabla pagos, que todavia no se usa.

DROP VIEW IF EXISTS v_resumen_ticket;

CREATE VIEW v_resumen_ticket AS
SELECT
  t.id_ticket,
  t.id_paciente,
  t.costo,
  t.descuento,
  COALESCE(s.total_sesiones, 0) AS pagado,
  t.costo - t.descuento - COALESCE(s.total_sesiones, 0) AS deuda
FROM tickets t
LEFT JOIN (
  SELECT id_ticket, SUM(monto) AS total_sesiones
    FROM sesiones
   GROUP BY id_ticket
) s ON s.id_ticket = t.id_ticket;