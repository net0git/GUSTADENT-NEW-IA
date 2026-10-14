# Endpoints del backend GUSTADENT

Prefijo: `/api`. Formato: JSON. Todas las rutas requieren token JWT, salvo `POST /api/auth/login` y `GET /api/health`.

Errores: `{ "codigo": "...", "mensaje": "..." }`.

## 1. Sistema y autenticación

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor |
| POST | `/api/auth/login` | Inicia sesión y devuelve el token |
| GET | `/api/auth/me` | Datos del usuario autenticado |
| PUT | `/api/auth/password` | Cambia la contraseña propia |

## 2. Usuarios (médicos y personal)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/usuarios` | Lista, con filtros por perfil y estado |
| GET | `/api/usuarios/:id` | Detalle |
| POST | `/api/usuarios` | Registra médico o personal |
| PUT | `/api/usuarios/:id` | Actualiza datos |
| PATCH | `/api/usuarios/:id/estado` | Activa o desactiva |
| PUT | `/api/usuarios/:id/sucursales` | Define las sucursales que atiende |

## 3. Pacientes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/pacientes?buscar=` | Búsqueda por DNI o apellidos |
| GET | `/api/pacientes/:id` | Detalle |
| POST | `/api/pacientes` | Registra paciente |
| PUT | `/api/pacientes/:id` | Actualiza datos |
| GET | `/api/pacientes/:id/historial` | Atenciones y observaciones previas |

## 4. Sucursales y procedencias (catálogos)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/sucursales` | Lista |
| POST | `/api/sucursales` | Crea (administrador) |
| PUT | `/api/sucursales/:id` | Actualiza (administrador) |
| PATCH | `/api/sucursales/:id/estado` | Activa o desactiva (administrador) |
| GET | `/api/procedencias` | Lista, con filtro por estado |
| POST | `/api/procedencias` | Crea (administrador) |
| PUT | `/api/procedencias/:id` | Actualiza (administrador) |
| PATCH | `/api/procedencias/:id/estado` | Activa o desactiva (administrador) |

Las procedencias no se eliminan; solo se desactivan (campo `activo`, migración `002`).

## 5. Atenciones (tickets)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/atenciones?fecha=&sucursal=&medico=&estado=` | Listado con filtros |
| POST | `/api/atenciones` | Crea una atención en estado borrador |
| GET | `/api/atenciones/:id` | Detalle con paciente, sesiones y resumen de cuenta |
| PUT | `/api/atenciones/:id` | Guarda borrador: descripción, costo, descuento |
| POST | `/api/atenciones/:id/finalizar` | Finaliza la atención |
| POST | `/api/atenciones/:id/anular` | Anula la atención (administrador) |

## 6. Sesiones (cronograma)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/sesiones?desde=&hasta=` | Sesiones en un rango de fechas (calendario) |
| POST | `/api/atenciones/:id/sesiones` | Crea una nueva sesión |
| PUT | `/api/sesiones/:id` | Edita fecha, hora, monto u observaciones |
| POST | `/api/sesiones/:id/atender` | Registra observaciones y marca como atendida |
| POST | `/api/sesiones/:id/cancelar` | Cancela una sesión |
| DELETE | `/api/sesiones/:id` | Elimina una sesión, incluso si ya fue atendida |

## 7. Pagos y cuenta

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/atenciones/:id/pagos` | Historial de pagos de la atención |
| POST | `/api/atenciones/:id/pagos` | Registra un abono |
| GET | `/api/atenciones/:id/resumen` | Monto total, descuento, pagado y deuda |

## 8. Empresa (configuración)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/empresa` | Datos de la clínica |
| PUT | `/api/empresa` | Actualiza (administrador) |

## Permisos

| Acción | Administrador | Odontólogo | Recepción |
|---|---|---|---|
| Gestionar usuarios, sucursales, procedencias y empresa | Sí | No | No |
| Registrar y buscar pacientes | Sí | Sí | Sí |
| Ver citas y atenciones de todas las sucursales | Sí | Sí | Sí |
| Crear atenciones y citas | Sí | Sí | Sí |
| Atender sesiones y escribir observaciones | Sí | Sí | Sí |
| Crear, editar, cancelar y eliminar sesiones | Sí | Sí | Sí |
| Ver reportes de ingresos y deudas | Sí | No | No |
| Registrar pagos (módulo pendiente) | Sí | No | Sí |
| Anular atenciones | Sí | No | No |

## Pendientes

## Decisiones confirmadas

- Las sesiones se pueden modificar y eliminar aunque estén atendidas.
- Se incluye `POST /api/auth/logout`. Ver la nota de autenticación abajo.
- `bcrypt` aprobado para el hash de contraseñas.

## Autenticación implementada

- `jsonwebtoken` aprobado. Los tokens duran 8 horas.
- Logout: columna `token_version` en `usuarios` (migración `003`). Al cerrar sesión o cambiar la contraseña se incrementa, y los tokens con la versión anterior dejan de ser válidos.
- Para crear el primer administrador: `npm run crear-admin` con las variables `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_DNI` y `ADMIN_NOMBRE`.

## Configuración inicial (asistente)

Sin autenticación, pero protegida con `SETUP_TOKEN` (encabezado `X-Setup-Token`) en los pasos que escriben datos. Cada paso se puede registrar una sola vez.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/setup/estado` | Indica qué pasos están completos y si el sistema está `configurado` |
| POST | `/api/setup/empresa` | Paso 1: datos de la clínica (una sola fila) |
| POST | `/api/setup/sucursal` | Paso 2: sucursal inicial |
| POST | `/api/setup/administrador` | Paso 3: cuenta de administrador |

Si un paso ya está completo responde `409 PASO_YA_CONFIGURADO`. El script `npm run crear-admin` fue eliminado.

## Módulos implementados

### Usuarios (solo administrador)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/usuarios` | Lista con filtros `perfil` y `activo` |
| GET | `/api/usuarios/:id` | Detalle |
| POST | `/api/usuarios` | Registra médico o personal, con sucursales y contraseña |
| PUT | `/api/usuarios/:id` | Actualiza datos |
| PATCH | `/api/usuarios/:id/estado` | Activa o desactiva |
| POST | `/api/usuarios/:id/resetear-password` | Genera una contraseña temporal y cierra las sesiones activas |
| PUT | `/api/usuarios/:id/sucursales` | Reemplaza las sucursales asignadas |

Reglas: un usuario no puede desactivarse a sí mismo ni quitarse su propio perfil de administrador. Al desactivar, sus sesiones activas se invalidan.

### Sucursales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/sucursales` | Lista. Por defecto solo las activas; `?soloActivas=false` incluye todas |

### Pacientes (todos los perfiles autenticados)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/pacientes?buscar=` | Lista. Sin término devuelve los recientes; con término busca por DNI exacto o por nombre y apellidos |
| GET | `/api/pacientes/:id` | Detalle |
| POST | `/api/pacientes` | Registra paciente |
| PUT | `/api/pacientes/:id` | Actualiza datos |

### Catálogos (lectura para todos, escritura solo administrador)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/sucursales` | Lista. Por defecto solo activas; `?soloActivas=false` incluye todas |
| GET | `/api/sucursales/:id` | Detalle |
| POST | `/api/sucursales` | Crea |
| PUT | `/api/sucursales/:id` | Actualiza |
| PATCH | `/api/sucursales/:id/estado` | Activa o desactiva |
| GET | `/api/procedencias` | Misma estructura que sucursales |

Reglas de catálogo: nombres únicos sin distinguir mayúsculas, no se desactiva la última entrada activa y una sucursal con atenciones pendientes no se puede desactivar. No hay eliminación.

### Atenciones y sesiones (todos los autenticados; anular solo administrador)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/atenciones?fecha=&sucursal=&medico=&paciente=&estado=` | Listado con filtros |
| POST | `/api/atenciones` | Crea la atención en estado `borrador` y su primera sesión |
| — | — | La atención incluye `fecha` y `hora` de la cita, ambas con horario de 7:00 AM a 8:00 PM (migración `005`) |
| GET | `/api/sesiones?fecha=&desde=&hasta=` | Lista las citas (sesiones) con paciente, atención, médico y sucursal |
| GET | `/api/sesiones/calendario?desde=&hasta=` | Días del rango con citas pendientes, para marcar el calendario |
| GET | `/api/atenciones/:id` | Detalle con paciente, sesiones y resumen de cuenta |
| PUT | `/api/atenciones/:id` | Guardar borrador: descripción, costo, descuento |
| POST | `/api/atenciones/:id/activar` | Pasa a `activo` |
| POST | `/api/atenciones/:id/finalizar` | Cierra la atención |
| POST | `/api/atenciones/:id/anular` | Anula la atención (administrador) |
| POST | `/api/atenciones/:id/sesiones` | Crea una sesión; el número y el tipo los calcula el sistema |
| PUT | `/api/sesiones/:id` | Edita fecha, hora, monto y observaciones |
| POST | `/api/sesiones/:id/atender` | Registra observaciones, corrige el monto y marca como atendida |
| POST | `/api/sesiones/:id/cancelar` | Cancela una sesión programada |
| DELETE | `/api/sesiones/:id` | Elimina la sesión |
| GET | `/api/usuarios/odontologos` | Odontólogos activos, para asignar el responsable |

Reglas: cada atención nace con su Sesión 1 (tipo `primera`) en la misma fecha y hora de la cita; las
sesiones siguientes se numeran solas; no se finaliza con sesiones programadas pendientes; una atención
anulada o finalizada no admite cambios; una sesión atendida no se puede cancelar pero sí editar o
eliminar. Al atender una sesión se puede corregir su monto, que es cuando queda fijado lo cobrado; si
no se envía `monto`, se conserva el que ya tenía.

## Deuda no negativa

La deuda es `costo - descuento - pagado` y `pagado` es la suma de los montos de
las sesiones. Para que nunca sea negativa, **el total de las sesiones no puede
superar `costo - descuento`**. La regla se aplica en dos capas:

- En la aplicación, al crear o editar una sesión, al atender una con monto y
  al guardar el borrador (bajar el costo o subir el descuento).
- En la base, con los triggers `trg_sesiones_monto` y `trg_tickets_monto`
  (migración `007`), que bloquean cualquier otra vía de escritura.

Cuando se rechaza, responde `409 MONTO_EXCEDE_TOTAL` con el detalle:

```
El total de las sesiones (S/ 101.00) supera el monto indicado de la atención (S/ 100.00)
```

El límite es inclusivo: una atención cuyo total de sesiones es igual a
`costo - descuento` queda con deuda 0 y es válida.

En la pantalla el aviso sale en línea, bajo el campo, como el resto de
validaciones del formulario: la ventana de sesión muestra el error bajo el monto
y la de atender lo muestra dentro del propio diálogo. No se lanza ninguna
petición cuando el monto ya supera el límite.

## Calendario lateral

El mini-calendario del menú marca con un punto, en la esquina superior derecha
del día, los que tienen **sesiones programadas**: las atendidas y las
canceladas no se marcan, porque ya no son una cita por atender. La respuesta de
cada mes se guarda aparte, así que al volver a un mes ya visto los puntos
reaparecen al instante; cuando una sesión se crea, se edita, se atiende, se
cancela o se elimina, se vuelve a pedir el mes visible.

## Resumen de cuenta

`pagado` es la suma de los montos de todas las sesiones de la atención y
`deuda = costo - descuento - pagado`. Se calcula en la vista
`v_resumen_ticket`, actualizada por la migración `006`.

## Reportes (solo administrador)

Pantalla `/reportes` en el frontend, con pestañas. Filtros comunes: rango de
fechas, sucursal y odontólogo. El rango por defecto es el mes en curso y no
puede pasar de 24 meses.

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/api/reportes/atenciones` | Conteos por estado, pacientes distintos y totales de costo, descuento, pagado y deuda |
| GET | `/api/reportes/ingresos-sesiones` | Conteos por estado y tipo, montos programados y atendidos, y una serie por día |
| GET | `/api/reportes/productividad` | Una fila por odontólogo con sesiones, pacientes, monto atendido y promedio |
| GET | `/api/reportes/cuentas-por-cobrar` | Pacientes con deuda, de mayor a menor, con el detalle de sus atenciones |
| GET | `/api/reportes/atenciones-por-mes` | Una fila por mes con atenciones, finalizadas, sesiones, costo, ingresado y deuda |

Reglas:

- Las atenciones se cuentan por su fecha de creación y las sesiones por la
  fecha en que ocurren. Los días y meses de las sesiones se cuentan en la zona
  `ZONA_HORARIA` (por defecto `America/Lima`).
- Las atenciones anuladas no suman costo, pagado ni deuda; sí aparecen en el
  conteo por estado.
- `cuentas-por-cobrar` es una foto del estado actual: no admite rango de
  fechas. Solo seaccumulan las atenciones vigentes con deuda mayor que cero, y
  se listan los 100 pacientes con mayor deuda.
- La sesión se atribuye al odontólogo responsable de la atención, que es el
  mismo médico que muestra el resto del sistema.
- En la gráfica diaria, un rango de más de 45 días se agrupa por semana en el
  frontend; la API siempre devuelve el detalle por día.

## Pendientes

- Pagos en efectivo por parte del paciente (tabla `pagos`), que hoy no se usa:
  el importe cobrado se toma del monto de cada sesión.
- Historial del paciente: se construye sobre atenciones y sesiones ya disponibles.
- `GET /api/empresa` y su actualización.
- Limite de frecuencia en módulos de escritura (solo login y configuración inicial por ahora).
- `npm audit` reporta vulnerabilidades en el backend por la cadena de compilación de `bcrypt`. Conviene revisarlas antes de desplegar.
