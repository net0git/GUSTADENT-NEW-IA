# GUSTADENT

Sistema web de gestión para clínica dental: registro de pacientes y médicos,
autenticación y (próximamente) atención de citas, sesiones y control de pagos.

## Stack

| Capa      | Tecnología                                            |
| --------- | ----------------------------------------------------- |
| Frontend  | Angular 19 (standalone) + TypeScript, Bootstrap 5, SweetAlert2 |
| Backend   | Node.js + Express + TypeScript (modo estricto), arquitectura hexagonal |
| Base      | PostgreSQL                                            |

## Estructura

```
GUSTADENT/
├── plan/                  # Documentación del proyecto (no tocar)
│   ├── contexto.txt       # Instrucciones generales
│   ├── bd.txt             # Esquema de BD en DBML
│   └── img.1.jpeg,img.2   # Mockups de la pantalla Atención de Cita
├── backend/
│   ├── migrations/        # SQL: 001_init.sql (esquema) + 002_seed_desarrollo.sql
│   └── src/
│       ├── modules/       # auth, usuarios, pacientes (hexagonal por módulo)
│       ├── shared/        # db, http (errores, middleware), validaciones
│       └── container.ts   # Composition root (cableado de dependencias)
└── frontend/
    └── src/app/
        ├── pages/         # login, layout, control, pacientes, usuarios
        ├── services/      # auth, usuario, paciente, alerta, almacenamiento
        ├── models/        # interfaces de dominio
        ├── guards/        # auth.guard, perfil.guard
        ├── interceptors/  # auth.interceptor (JWT)
        └── interfaces/    # respuestas de API
```

## Cómo ejecutar

### 1. Base de datos (PostgreSQL)

```powershell
$env:PGPASSWORD = "12345"   # credenciales del usuario neto
psql -h localhost -p 5432 -U neto -d GUSTADENT -f backend/migrations/001_init.sql
psql -h localhost -p 5432 -U neto -d GUSTADENT -f backend/migrations/002_seed_desarrollo.sql
```

La migración `001_init.sql` reproduce fielmente `plan/bd.txt`. La semilla
crea usuarios de ejemplo (cambiar contraseñas tras el primer ingreso):

| Usuario   | Contraseña   | Perfil         |
| --------- | ------------ | -------------- |
| `admin`   | `admin123`   | Administrador  |
| `drricardo` | `medico123` | Medico        |

### 2. Backend (http://localhost:3001/api)

```powershell
cd backend
Copy-Item .env.example .env    # y ajusta las variables a tu entorno
npm install
npm run dev
```

Variables clave: `PORT` (3001), `DB_*` (usuario `neto`), `JWT_SECRET`
(cambiar en producción), `CORS_ORIGIN`.

### 3. Frontend (http://localhost:4300)

```powershell
cd frontend
npm install
npx ng serve --port 4300
```

> El puerto 4200 está ocupado por otros proyectos en este equipo, por eso se
> usa 4300. `backend/.env` ya permite ambos orígenes en `CORS_ORIGIN`.
> Si liberas el 4200, usa `ng serve` a secas.

## API disponible

| Método | Ruta                       | Auth | Descripción                          |
| ------ | -------------------------- | ---- | ------------------------------------ |
| GET    | `/api/salud`               | –    | Estado del servicio                  |
| POST   | `/api/auth/login`          | –    | Login; devuelve token JWT + usuario  |
| GET    | `/api/usuarios`            | JWT  | Listar usuarios (sin password)       |
| POST   | `/api/usuarios`            | JWT  | Registrar médico/administrador       |
| GET    | `/api/pacientes`           | JWT  | Listar pacientes (`?busqueda=`)      |
| GET    | `/api/pacientes/:id`       | JWT  | Detalle de paciente                  |
| POST   | `/api/pacientes`           | JWT  | Registrar paciente                   |
| PUT    | `/api/pacientes/:id`       | JWT  | Actualizar paciente (parcial)        |

## Decisiones tomadas y validaciones

- Base de datos fiel a `plan/bd.txt`: sin tablas ni campos inventados.
- Autenticación JWT (8 h) + bcrypt (10 rondas); rutas protegidas por perfil.
- Puerto del backend en **3001** porque el 3000 está ocupado por otro proyecto
  (`D:\PROYECTOS\game\server`).
- Frontend en **4300** porque el 4200 está ocupado.
- Eliminada la base `gustadent` (minúsculas) creada por error: la base oficial
  es `GUSTADENT`.

## Pendientes de definir con el negocio

1. `usuarios.id_sucursal`: ¿un médico pertenece a una sede? Falta la relación
   `empresa → sucursales`.
2. `tickets.id_usuario`: no existe el médico responsable de cada atención.
3. Pagos y deuda: la UI (mockups) muestra "Pagado" y "Estado de deuda", pero no
   hay tabla de pagos. ¿Se calcula con `sesiones.monto`?
4. `pacientes.procedencia`: ¿catálogo (`procedencias`) o texto libre?
5. Dominio de `pacientes.sexo` (char 1) y `usuarios.perfil`: hoy se usan
   `M/F` y `Administrador/Medico` provisionalmente.
