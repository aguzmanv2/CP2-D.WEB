# Medical System

Sistema web full stack para gestion de citas medicas, turnos, reportes y comunicacion en tiempo real.

Componentes:
- `medical-system-client`: React + Vite + Tailwind CSS
- `medical-system-server`: Node.js + Express + MongoDB + Socket.IO

## Requisitos

- Node.js 18 o superior
- MongoDB local o Atlas
- Git

## Instalacion

Backend:

```bash
cd medical-system-server
npm install
```

Frontend:

```bash
cd ../medical-system-client
npm install
```

## Variables de entorno

### Server

Copia `medical-system-server/.env.example` a `medical-system-server/.env` y completa:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
MONGODB_URI=tu_mongodb_uri
JWT_SECRET=tu_jwt_secret
JWT_EXPIRES_IN=1d
```

### Client

Copia `medical-system-client/.env.example` a `medical-system-client/.env` y completa:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

## Ejecutar

Abrir dos terminales.

Backend:

```bash
cd medical-system-server
npm run dev
```

Frontend:

```bash
cd medical-system-client
npm run dev
```

## Roles

- Administrador
- Recepcionista
- Medico
- Paciente

## API REST

Base URL:

```text
http://localhost:4000/api
```

Todas las rutas protegidas requieren:

```http
Authorization: Bearer <token>
```

Las rutas publicas son:
- `POST /auth/register`
- `POST /auth/login`

### Autenticacion

| Metodo | Ruta | Roles | Body |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Publico | `{ "cedula": "string", "nombre": "string", "apellido": "string", "correo": "string", "password": "string", "rol": "Paciente" }` |
| `POST` | `/auth/login` | Publico | `{ "identificador": "string", "password": "string" }` |
| `POST` | `/auth/logout` | Autenticado | `-` |
| `GET` | `/auth/profile` | Autenticado | `-` |

Notas:
- `identificador` acepta `cedula` o `correo`.
- `rol` en registro es opcional.
- La cedula es obligatoria y unica.

### Usuarios

| Metodo | Ruta | Roles | Query / Body |
| --- | --- | --- | --- |
| `GET` | `/users/lookup` | Administrador, Recepcionista | `?cedula=1234567890` |
| `GET` | `/users` | Administrador | `?page=1&limit=10&search=&rol=&estado=` |
| `PATCH` | `/users/:id/role` | Administrador | `{ "rol": "Medico" }` |

### Pacientes

| Metodo | Ruta | Roles | Query / Body |
| --- | --- | --- | --- |
| `GET` | `/patients` | Administrador, Recepcionista, Medico | `?page=1&limit=10&search=&estado=` |
| `GET` | `/patients/:id` | Administrador, Recepcionista, Medico | `-` |
| `POST` | `/patients` | Administrador, Recepcionista | `{ "cedula": "string", "nombre": "string", "apellido": "string", "correo": "string", "telefono": "string", "direccion": "string", "fechaNacimiento": "YYYY-MM-DD", "estado": "Activo" }` |
| `PUT` | `/patients/:id` | Administrador, Recepcionista | Mismos campos anteriores, todos opcionales |
| `DELETE` | `/patients/:id` | Administrador, Recepcionista | `-` |

### Medicos

| Metodo | Ruta | Roles | Query / Body |
| --- | --- | --- | --- |
| `GET` | `/doctors` | Autenticado | `?page=1&limit=10&search=&estado=&especialidad=` |
| `GET` | `/doctors/:id` | Autenticado | `-` |
| `POST` | `/doctors` | Administrador, Recepcionista | `{ "nombre": "string", "apellido": "string", "especialidad": "ObjectId", "consultorio": "string", "tiempoPromedioConsulta": 20, "estado": "Activo" }` |
| `PUT` | `/doctors/:id` | Administrador, Recepcionista | Mismos campos anteriores, todos opcionales |
| `DELETE` | `/doctors/:id` | Administrador, Recepcionista | `-` |

### Especialidades

| Metodo | Ruta | Roles | Query / Body |
| --- | --- | --- | --- |
| `GET` | `/specialties` | Autenticado | `?page=1&limit=10&search=&estado=` |
| `GET` | `/specialties/:id` | Autenticado | `-` |
| `POST` | `/specialties` | Administrador, Recepcionista | `{ "nombre": "string", "descripcion": "string", "estado": "Activo" }` |
| `PUT` | `/specialties/:id` | Administrador, Recepcionista | Mismos campos anteriores, todos opcionales |
| `DELETE` | `/specialties/:id` | Administrador, Recepcionista | `-` |

### Citas

| Metodo | Ruta | Roles | Query / Body |
| --- | --- | --- | --- |
| `GET` | `/appointments` | Administrador, Recepcionista, Medico | `?page=1&limit=10&search=&estado=&fecha=&paciente=&medico=&especialidad=` |
| `GET` | `/appointments/:id` | Administrador, Recepcionista, Medico | `-` |
| `POST` | `/appointments` | Administrador, Recepcionista, Medico | `{ "paciente": "ObjectId", "medico": "ObjectId", "especialidad": "ObjectId", "fecha": "YYYY-MM-DDTHH:mm:ss.sssZ", "hora": "HH:mm", "estado": "Pendiente" }` |
| `PUT` | `/appointments/:id` | Administrador, Recepcionista, Medico | Mismos campos anteriores, todos opcionales |
| `DELETE` | `/appointments/:id` | Administrador, Recepcionista | `-` |

### Turnos

| Metodo | Ruta | Roles | Query / Body |
| --- | --- | --- | --- |
| `POST` | `/turnos/registrar-llegada` | Administrador, Recepcionista | `{ "cita": "ObjectId" }` |
| `GET` | `/turnos/cola` | Administrador, Recepcionista, Medico | `?medico=ObjectId&fecha=YYYY-MM-DD` |
| `GET` | `/turnos/actual` | Administrador, Recepcionista, Medico | `?medico=ObjectId&fecha=YYYY-MM-DD` |
| `GET` | `/turnos/siguiente` | Administrador, Recepcionista, Medico | `?medico=ObjectId&fecha=YYYY-MM-DD` |
| `GET` | `/turnos/paciente` | Administrador, Recepcionista, Medico, Paciente | `?paciente=ObjectId&fecha=YYYY-MM-DD` |
| `GET` | `/turnos/historial` | Administrador, Recepcionista, Medico | `?medico=ObjectId&paciente=ObjectId&estado=Esperando&fecha=YYYY-MM-DD&page=1&limit=10` |
| `POST` | `/turnos/atender` | Administrador, Recepcionista, Medico | `{ "turnoId": "ObjectId" }` |
| `POST` | `/turnos/finalizar` | Administrador, Recepcionista, Medico | `{ "turnoId": "ObjectId" }` |

### Reportes

| Metodo | Ruta | Roles | Query |
| --- | --- | --- | --- |
| `GET` | `/reports/dashboard` | Administrador, Recepcionista | `?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD&especialidad=ObjectId&medico=ObjectId&search=&page=1&limit=10&sortBy=horaLlegada&sortOrder=desc` |
| `GET` | `/reports/table` | Administrador, Recepcionista | Igual que `dashboard` |
| `GET` | `/reports/export/:format` | Administrador, Recepcionista | `:format` = `csv`, `excel` o `pdf` |

## Postman

Colecciones incluidas en `medical-system-server/postman/`:

- `Authentication.postman_collection.json`
- `Medical-System-API.postman_collection.json`

## Estructura

```text
medical-system/
|-- medical-system-client/
|-- medical-system-server/
`-- README.md
```
