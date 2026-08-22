# Baches SCZ — Guía completa de instalación y puesta en marcha

Guía para instalar, configurar y ejecutar el backend de **Baches SCZ** en Windows 11 sin utilizar Docker.

---

## 1. Requisitos

Antes de comenzar, tener instalado:

* Windows 11
* Node.js
* npm
* PostgreSQL 18
* PostGIS
* Git (opcional, si el proyecto se obtiene mediante Git)

> **Importante:** No es necesario instalar PostgreSQL si ya se tiene instalado correctamente.
>
> Esta guía asume que se proporcionará el instalador de PostgreSQL 18 utilizado para el proyecto.

---

# 2. Instalar PostgreSQL 18

Ejecutar el instalador de PostgreSQL 18 como administrador.

Durante la instalación aparecerán varias pantallas.

## 2.1 Directorio de instalación

Se puede dejar el valor predeterminado:

```text
C:\Program Files\PostgreSQL\18
```

Presionar **Next**.

---

## 2.2 Componentes

Dejar seleccionados:

* PostgreSQL Server
* pgAdmin 4
* Stack Builder
* Command Line Tools

Presionar **Next**.

---

## 2.3 Directorio de datos

Dejar el valor predeterminado:

```text
C:\Program Files\PostgreSQL\18\data
```

Presionar **Next**.

---

# 3. Crear la contraseña de PostgreSQL

Durante la instalación aparecerá:

```text
Password for database superuser postgres
```

Aquí cada integrante debe crear **SU PROPIA CONTRASEÑA**.

Por ejemplo:

```text
MiClavePostgres123
```

No es necesario utilizar la misma contraseña que los demás integrantes.

### IMPORTANTE

La contraseña utilizada durante la instalación será necesaria posteriormente para:

* Conectarse mediante `psql`
* Configurar el archivo `.env`
* Administrar la base de datos desde pgAdmin

**No compartir la contraseña con otras personas.**

---

# 4. Configurar el puerto

Cuando aparezca:

```text
Port
```

dejar:

```text
5432
```

Este es el puerto estándar utilizado por PostgreSQL.

Presionar **Next**.

---

# 5. Configurar Locale

Dejar:

```text
Default locale
```

Presionar **Next** y continuar con la instalación.

---

# 6. Finalizar la instalación

Esperar a que termine la instalación de PostgreSQL.

Al finalizar puede aparecer **Stack Builder**.

Stack Builder se utilizará para instalar PostGIS.

---

# 7. Instalar PostGIS

En Stack Builder seleccionar la instalación correspondiente a:

```text
PostgreSQL 18
```

y continuar.

Buscar la categoría:

```text
Spatial Extensions
```

Seleccionar **PostGIS** compatible con PostgreSQL 18.

> **IMPORTANTE:** La versión de PostGIS debe ser compatible con PostgreSQL 18.

Continuar con la instalación utilizando las opciones predeterminadas.

Cuando finalice, cerrar Stack Builder.

---

# 8. Comprobar que PostgreSQL está instalado

Abrir una nueva ventana de PowerShell.

Ejecutar:

```powershell
psql --version
```

Debe aparecer algo parecido a:

```text
psql (PostgreSQL) 18.6
```

Si aparece:

```text
psql no se reconoce como un comando interno o externo
```

significa que PostgreSQL no está agregado al PATH de Windows.

---

# 9. Agregar PostgreSQL al PATH

Si `psql --version` no funciona, agregar manualmente PostgreSQL al PATH.

Abrir:

```text
Windows + S
```

Buscar:

```text
Variables de entorno
```

Seleccionar:

```text
Editar las variables de entorno del sistema
```

Después:

```text
Variables de entorno...
```

En **Variables del sistema** buscar:

```text
Path
```

Seleccionar:

```text
Editar
```

Después:

```text
Nuevo
```

Agregar:

```text
C:\Program Files\PostgreSQL\18\bin
```

Aceptar todas las ventanas.

Cerrar la PowerShell actual y abrir una nueva.

Comprobar nuevamente:

```powershell
psql --version
```

Debe mostrar:

```text
psql (PostgreSQL) 18.x
```

---

# 10. Crear la base de datos

Abrir PowerShell.

Ejecutar:

```powershell
psql -U postgres
```

Aparecerá:

```text
Password for user postgres:
```

Introducir la contraseña que se creó durante la instalación.

> Al escribir la contraseña no se mostrarán caracteres. Esto es normal.

Si la conexión es correcta aparecerá:

```text
postgres=#
```

---

# 11. Crear la base de datos Baches SCZ

Dentro de:

```text
postgres=#
```

ejecutar:

```sql
CREATE DATABASE baches_scz;
```

Debe aparecer:

```text
CREATE DATABASE
```

---

# 12. Conectarse a la base de datos

Ejecutar:

```sql
\c baches_scz
```

Debe aparecer un mensaje indicando que ahora se está conectado a:

```text
baches_scz
```

y el prompt cambiará a:

```text
baches_scz=#
```

---

# 13. Activar PostGIS

Ejecutar:

```sql
CREATE EXTENSION postgis;
```

Debe aparecer:

```text
CREATE EXTENSION
```

Comprobar la versión:

```sql
SELECT PostGIS_Version();
```

Debe devolver una versión de PostGIS, por ejemplo:

```text
3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
```

Si aparece una versión, PostGIS está funcionando correctamente.

---

# 14. Salir de PostgreSQL

Ejecutar:

```sql
\q
```

Se volverá a PowerShell.

---

# 15. Obtener el proyecto Baches SCZ

Colocar el proyecto en una ubicación conveniente.

Ejemplo:

```text
C:\cambabachea\Backend
```

La estructura debe ser similar a:

```text
Backend/
│
├── db/
│   └── schema.sql
│
├── src/
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── schemas/
│   └── services/
│
├── frontend/
│
├── uploads/
│
├── package.json
└── .env.example
```

---

# 16. Abrir PowerShell en el Backend

Ejecutar:

```powershell
cd C:\cambabachea\Backend
```

Comprobar que estamos en el proyecto:

```powershell
dir
```

Debe aparecer `package.json`, entre otros archivos.

---

# 17. Crear la base de datos usando schema.sql

Si todavía no se ejecutó el esquema del proyecto, ejecutar:

```powershell
psql -U postgres -d baches_scz -f db\schema.sql
```

Introducir la contraseña de PostgreSQL cuando la solicite.

El archivo:

```text
db/schema.sql
```

creará las tablas, índices, funciones, triggers y datos iniciales necesarios para Baches SCZ.

Es normal ver mensajes como:

```text
CREATE TABLE
CREATE INDEX
CREATE FUNCTION
CREATE TRIGGER
INSERT 0 2
```

o:

```text
CREATE EXTENSION
```

---

## 17.1 Si aparece este mensaje

```text
NOTICE: la extensión «postgis» ya existe, omitiendo
```

**NO es un error.**

Significa que PostGIS ya había sido instalado previamente.

El esquema puede continuar normalmente.

---

# 18. Crear el archivo `.env`

El proyecto incluye:

```text
.env.example
```

Este archivo sirve como plantilla.

Crear una copia llamada:

```text
.env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

---

# 19. Configurar el `.env`

Abrir el archivo:

```powershell
notepad .env
```

El contenido debe ser similar a:

```env
PORT=4000
NODE_ENV=development

# PostgreSQL + PostGIS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=baches_scz
DB_USER=postgres
DB_PASSWORD=TU_CONTRASEÑA_DE_POSTGRES

# JWT
JWT_SECRET=TU_SECRETO_ALEATORIO
JWT_EXPIRES_IN=2h

# Límites de archivos
MAX_PHOTO_SIZE_MB=5
```

---

# 20. IMPORTANTE: DB_PASSWORD

Cada integrante debe colocar **la contraseña que eligió durante la instalación de PostgreSQL**.

Por ejemplo, si durante la instalación eligió:

```text
MiClavePostgres123
```

entonces:

```env
DB_PASSWORD=MiClavePostgres123
```

### NO utilizar literalmente:

```env
DB_PASSWORD=postgres
```

a menos que esa haya sido la contraseña elegida durante la instalación.

Cada computadora puede tener una contraseña diferente.

---

# 21. Configurar JWT_SECRET

El proyecto utiliza JWT para la autenticación.

No se recomienda dejar:

```env
JWT_SECRET=cambia_este_valor_por_un_secreto_largo_y_aleatorio
```

Se puede generar un secreto aleatorio utilizando Node.js.

Ejecutar:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Esto generará una cadena aleatoria.

Ejemplo:

```text
8f3a91c2d8...
```

Copiar el resultado al `.env`:

```env
JWT_SECRET=8f3a91c2d8...
```

Cada integrante puede utilizar su propio secreto.

---

# 22. Instalar dependencias de Node.js

Desde:

```text
C:\cambabachea\Backend
```

ejecutar:

```powershell
npm install
```

Esperar a que termine.

Si npm muestra paquetes buscando financiación, no es un error.

---

# 23. Crear carpeta uploads

El backend utiliza esta carpeta para almacenar fotografías de los reportes.

Comprobar si existe:

```powershell
Test-Path uploads
```

Si devuelve:

```text
True
```

ya está creada.

Si devuelve:

```text
False
```

crear la carpeta:

```powershell
New-Item -ItemType Directory uploads
```

---

# 24. Levantar el backend

Ejecutar:

```powershell
npm start
```

Si todo está correctamente configurado debería aparecer:

```text
API de Baches SCZ escuchando en el puerto 4000
```

No cerrar esta ventana mientras se esté utilizando el servidor.

---

# 25. Comprobar que la API funciona

Abrir una **segunda PowerShell**.

Ejecutar:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

La respuesta esperada es:

```text
status
------
ok
```

Esto confirma que:

* Node.js está funcionando.
* Express está funcionando.
* El servidor está escuchando en el puerto 4000.
* La API está respondiendo correctamente.

---

# 26. Abrir Baches SCZ

Abrir el navegador y entrar a:

```text
http://localhost:4000
```

El servidor sirve tanto la API como el frontend.

Por lo tanto, no es necesario levantar un segundo servidor para el frontend.

---

# 27. Crear usuario administrador

El registro normal permite crear usuarios.

Primero iniciar el servidor:

```powershell
npm start
```

Luego entrar desde la web y registrarse normalmente.

Después, desde otra PowerShell:

```powershell
cd C:\cambabachea\Backend
```

Ejecutar:

```powershell
npm run crear-admin -- tu-correo@ejemplo.com
```

Ejemplo:

```powershell
npm run crear-admin -- admin@gmail.com
```

Esto convierte al usuario indicado en administrador.

> El correo debe corresponder al usuario que ya fue registrado.

---

# 28. Endpoints principales

La API utiliza los siguientes endpoints:

| Método | Endpoint                     | Acceso        |
| ------ | ---------------------------- | ------------- |
| POST   | `/api/register`              | Público       |
| POST   | `/api/login`                 | Público       |
| GET    | `/api/reportes`              | Público       |
| GET    | `/api/reportes/:id`          | Público       |
| POST   | `/api/reportes`              | Autenticado   |
| PUT    | `/api/reportes/:id`          | Administrador |
| DELETE | `/api/reportes/:id`          | Administrador |
| GET    | `/api/reportes/mapa`         | Público       |
| GET    | `/api/reportes/zona`         | Público       |
| GET    | `/api/reportes/mios`         | Autenticado   |
| GET    | `/api/reportes/estadisticas` | Administrador |
| GET    | `/api/usuarios`              | Administrador |
| PUT    | `/api/usuarios/:id`          | Administrador |
| POST   | `/api/grafo/bfs`             | Administrador |
| POST   | `/api/grafo/dfs`             | Administrador |
| POST   | `/api/grafo/ruta-optima`     | Administrador |

---

# 29. Ejecutar las pruebas automatizadas

Las pruebas de algoritmos no necesitan PostgreSQL.

Desde el Backend ejecutar:

```powershell
npm test
```

El resultado esperado es:

```text
25 pruebas
25 pasan
```

Las pruebas cubren:

* Haversine
* Construcción del grafo
* BFS
* DFS
* Dijkstra
* A*
* Heurística TSP
* Vecino más cercano
* 2-opt

---

# 30. Probar el servidor rápidamente

### Comprobar estado

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

Respuesta:

```text
status
------
ok
```

### Comprobar desde el navegador

Abrir:

```text
http://localhost:4000
```

---

# 31. Flujo normal para trabajar cada día

Una vez que PostgreSQL y el proyecto están instalados, **NO es necesario repetir toda la instalación**.

Cada vez que se quiera trabajar:

### Paso 1 — PostgreSQL

PostgreSQL normalmente queda instalado como servicio de Windows y se inicia automáticamente.

No es necesario abrir pgAdmin.

### Paso 2 — Abrir PowerShell

```powershell
cd C:\cambabachea\Backend
```

### Paso 3 — Levantar el backend

```powershell
npm start
```

### Paso 4 — Abrir la aplicación

```text
http://localhost:4000
```

Eso es todo.

---

# 32. Para detener el servidor

En la PowerShell donde está ejecutándose:

```text
API de Baches SCZ escuchando en el puerto 4000
```

presionar:

```text
Ctrl + C
```

Esto detiene Node.js.

**No elimina la base de datos.**

---

# 33. No ejecutar `schema.sql` cada vez

El siguiente comando:

```powershell
psql -U postgres -d baches_scz -f db\schema.sql
```

se utiliza para **crear/configurar la base de datos inicialmente**.

No se debe ejecutar cada vez que se inicia el backend.

Normalmente se ejecuta:

* La primera vez que se configura el proyecto.
* Cuando se necesita reconstruir la base de datos.
* Cuando el equipo realiza cambios específicos en el esquema.

---

# 34. Estructura final del entorno

Después de completar la instalación, cada computadora debería tener aproximadamente:

```text
Windows 11
│
├── PostgreSQL 18.6
│   ├── PostgreSQL Server
│   ├── pgAdmin 4
│   └── PostGIS 3.6
│
└── Baches SCZ
    │
    └── Backend
        ├── db/
        │   └── schema.sql
        ├── src/
        ├── frontend/
        ├── uploads/
        ├── .env
        ├── .env.example
        ├── package.json
        └── ...
```

---

# 35. Configuración de puertos

El proyecto utiliza:

```text
PostgreSQL → 5432
Backend    → 4000
```

Por lo tanto:

```text
http://localhost:4000
```

es la dirección de la aplicación.

PostgreSQL se encuentra en:

```text
localhost:5432
```

---

# 36. Problemas comunes

## `psql no se reconoce`

Si aparece:

```text
psql no se reconoce como un comando interno o externo
```

agregar al PATH:

```text
C:\Program Files\PostgreSQL\18\bin
```

Después cerrar la PowerShell y abrir una nueva.

Comprobar:

```powershell
psql --version
```

---

## Error de contraseña

Si aparece:

```text
password authentication failed for user "postgres"
```

comprobar que:

```env
DB_USER=postgres
DB_PASSWORD=...
```

utiliza exactamente la contraseña creada durante la instalación.

---

## Error de conexión a PostgreSQL

Si aparece algo relacionado con:

```text
ECONNREFUSED
```

comprobar que el servicio PostgreSQL esté iniciado.

También se puede comprobar desde:

```text
Servicios de Windows
```

buscando un servicio similar a:

```text
postgresql-x64-18
```

---

## Error con PostGIS

Si aparece:

```text
extension "postgis" is not available
```

PostGIS no está instalado correctamente.

Revisar la instalación mediante Stack Builder y asegurarse de haber instalado una versión compatible con PostgreSQL 18.

---

## Error de puerto 5432

Si PostgreSQL no puede iniciar porque el puerto está ocupado, comprobar qué aplicación está utilizando el puerto:

```powershell
netstat -ano | findstr :5432
```

No cambiar el puerto sin antes revisar la configuración del proyecto.

---

## Error de puerto 4000

Si Node.js indica que el puerto 4000 está ocupado:

```text
EADDRINUSE
```

comprobar qué proceso está utilizando el puerto:

```powershell
netstat -ano | findstr :4000
```

También se puede cambiar temporalmente:

```env
PORT=4001
```

pero el frontend/API deberán utilizar el nuevo puerto.

---

# 37. Seguridad

El archivo:

```text
.env
```

contiene información privada.

**No subir `.env` a GitHub.**

El proyecto debe utilizar:

```text
.env.example
```

como plantilla.

Cada integrante debe crear su propio:

```text
.env
```

y colocar:

* Su contraseña local de PostgreSQL.
* Su propio `JWT_SECRET`.

Nunca colocar contraseñas reales en:

* Git
* GitHub
* capturas de pantalla
* código fuente
* archivos públicos

---

# 38. Resumen rápido

Para una computadora nueva:

```powershell
# 1. Instalar PostgreSQL 18 + PostGIS

# 2. Crear base
psql -U postgres

CREATE DATABASE baches_scz;

\c baches_scz

CREATE EXTENSION postgis;

\q

# 3. Ir al proyecto
cd C:\cambabachea\Backend

# 4. Ejecutar esquema
psql -U postgres -d baches_scz -f db\schema.sql

# 5. Crear .env
Copy-Item .env.example .env

# 6. Configurar .env
notepad .env

# 7. Instalar dependencias
npm install

# 8. Crear uploads si no existe
New-Item -ItemType Directory uploads

# 9. Ejecutar
npm start
```

Luego abrir:

```text
http://localhost:4000
```

Y comprobar:

```text
http://localhost:4000/api/health
```

Respuesta:

```json
{
  "status": "ok"
}
```

---

# 39. Resultado final

Si se completaron todos los pasos correctamente, el sistema queda funcionando de la siguiente manera:

```text
                    BACHES SCZ
                        │
                        ▼
                http://localhost:4000
                        │
                        ▼
                  Node.js + Express
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
          API REST             Frontend
              │
              ▼
       PostgreSQL 18.6
              │
              ▼
          PostGIS 3.6
              │
              ▼
         baches_scz
```

El backend, frontend y API se sirven desde el mismo puerto, por lo que para trabajar localmente basta con iniciar el backend:

```powershell
npm start
```

y acceder a:

```text
http://localhost:4000
```

**Fin de la instalación.**
