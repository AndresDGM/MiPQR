# MiPQR

**Plataforma web para la gestión y el seguimiento de peticiones, quejas
y reclamos (PQR).**

MiPQR busca centralizar el registro, la clasificación, la asignación y
la atención de las PQR, facilitando la trazabilidad de cada caso y la
consulta de su estado mediante un código único de seguimiento.

## Tabla de contenido

-   [Descripción del proyecto](#descripción-del-proyecto)
-   [Contexto y propuesta de valor](#contexto-y-propuesta-de-valor)
-   [Roles de usuario](#roles-de-usuario)
-   [Flujo de atención](#flujo-de-atención)
-   [Identidad visual](#identidad-visual)
-   [Tecnologías utilizadas](#tecnologías-utilizadas)
-   [Arquitectura y estructura del
    proyecto](#arquitectura-y-estructura-del-proyecto)
-   [Modelo de datos](#modelo-de-datos)
-   [Requisitos previos](#requisitos-previos)
-   [Instalación y ejecución](#instalación-y-ejecución)
-   [Estado del proyecto](#estado-del-proyecto)
-   [Equipo de desarrollo](#equipo-de-desarrollo)

## Descripción del proyecto

MiPQR es una propuesta de plataforma web responsive orientada a
digitalizar el proceso de gestión de peticiones, quejas y reclamos. La
solución contempla el registro de solicitudes, la asignación de
responsables, la actualización de estados, la emisión de respuestas y el
seguimiento del historial de atención.

El proyecto se desarrolla en el contexto de la asignatura **Gerencia de
Proyectos Informáticos** de la Unidad Central del Valle del Cauca
(UCEVA), tomando como caso piloto la gestión de PQR en la Clínica
Dolormed.

## Contexto y propuesta de valor

### Contexto del problema

En el escenario planteado para el proyecto, las solicitudes se gestionan
mediante formatos físicos y transcripción manual a hojas de cálculo.
Este proceso puede ocasionar demoras, dispersión de la información, poca
visibilidad para los solicitantes y dependencia de procedimientos
manuales.

La propuesta inicial identifica un tiempo promedio de respuesta de ocho
días. Este dato corresponde al contexto descrito en la propuesta del
proyecto y debe validarse con información institucional si se utiliza
como indicador formal.

### Propuesta de valor

MiPQR propone digitalizar y estandarizar el flujo de atención mediante
las siguientes capacidades:

1.  Registrar solicitudes y generar un código único para consultar su
    seguimiento.
2.  Centralizar la gestión administrativa de las PQR.
3.  Clasificar las solicitudes y asignarlas a responsables.
4.  Actualizar el estado de cada caso y registrar las acciones
    realizadas.
5.  Emitir respuestas y conservar un historial de atención.

## Roles de usuario

  -----------------------------------------------------------------------
  Rol                     Necesidad principal     Aporte esperado de
                                                  MiPQR
  ----------------------- ----------------------- -----------------------
  Paciente o solicitante  Presentar una PQR y     Registro digital,
                          consultar su estado.    código de seguimiento y
                                                  consulta de la
                                                  respuesta.

  Analista SIAU           Centralizar solicitudes Bandeja de gestión,
                          y reducir el trabajo    clasificación,
                          manual.                 asignación y control de
                                                  tiempos.

  Responsable de proceso  Gestionar los casos     Registro de acciones,
                          asignados e informar    seguimiento y
                          avances.                preparación de
                                                  respuestas.

  Dirección o             Consultar el            Historial consolidado e
  coordinación            comportamiento general  indicadores de gestión.
                          del proceso.            
  -----------------------------------------------------------------------

## Flujo de atención

El flujo propuesto para una PQR comprende el registro, la clasificación,
la asignación, la gestión, la respuesta y el cierre.

``` text
Registro de PQR
      |
      v
Generación del código de seguimiento
      |
      v
Clasificación y asignación
      |
      v
Revisión y gestión
      |
      v
Emisión de respuesta
      |
      v
Cierre y archivo
```

### Estados de una solicitud

Los estados descritos en el modelo inicial son:

1.  **Recibida:** la solicitud se registra en el sistema.
2.  **En revisión:** el equipo encargado realiza una evaluación inicial.
3.  **Asignada:** el caso se delega a un área o responsable.
4.  **En gestión:** se adelantan las acciones necesarias para atender la
    solicitud.
5.  **Respondida:** se emite una respuesta formal al solicitante.
6.  **Cerrada:** finaliza el proceso y se conserva el registro
    histórico.

Las reglas que permiten cambiar de un estado a otro deben definirse e
implementarse en el sistema. La lista anterior documenta el flujo
propuesto, no confirma por sí sola que todas las transiciones estén
implementadas.

## Identidad visual

La línea gráfica propuesta utiliza la siguiente paleta:

  -----------------------------------------------------------------------
  Color                   Código hexadecimal      Aplicación propuesta
  ----------------------- ----------------------- -----------------------
  Morado                  `#673E93`               Marca, títulos y estado
                                                  «En revisión».

  Turquesa                `#279BAF`               Acciones principales y
                                                  estado «Recibida».

  Coral                   `#D54877`               Énfasis, alertas y
                                                  llamados de atención.

  Gris oscuro             `#283447`               Tipografía principal y
                                                  elementos
                                                  estructurales.

  Blanco                  `#FFFFFF`               Fondos de contenido.

  Gris claro              `#F2F4F7`               Tarjetas, paneles y
                                                  áreas secundarias.
  -----------------------------------------------------------------------

## Tecnologías utilizadas

Las versiones indicadas a continuación corresponden a las descritas en
la documentación del proyecto. Deben contrastarse con los archivos de
dependencias y la configuración efectiva antes de realizar una
instalación nueva.

### Frontend

-   **Framework:** [Angular](https://angular.dev/), versión indicada en
    la propuesta: 22.1.
-   **Componentes:** componentes standalone.
-   **Estado y reactividad:** Signals.
-   **Plantillas:** control flow moderno de Angular, como `@if` y
    `@for`.
-   **Estilos:** SCSS modularizado.
-   **Enrutamiento:** Angular Router.
-   **HTTP y asincronía:** `HttpClient` y RxJS.
-   **Arquitectura propuesta:** capas de dominio, aplicación,
    infraestructura y presentación.

### Backend

-   **Entorno de ejecución:** [Node.js](https://nodejs.org/), versión
    indicada en la propuesta: 26.
-   **Framework web:** [Express](https://expressjs.com/), versión
    indicada: 5.
-   **Lenguaje:** TypeScript con compilación estricta.
-   **Herramientas y dependencias mencionadas:** `tsx`, `cors`, `dotenv`
    y `env-var`.
-   **Arquitectura propuesta:** capas desacopladas con inversión de
    dependencias.

> **Compatibilidad:** la documentación original también indica Node.js
> 20 o superior como requisito. Antes de instalar, se debe comprobar qué
> versión de Node.js es compatible con las dependencias actuales y
> unificar esa información con `package.json`, el archivo de bloqueo y
> la configuración de TypeScript. No se debe asumir que todas las
> versiones indicadas son intercambiables.

## Arquitectura y estructura del proyecto

El repositorio separa el cliente web del servidor y organiza el código
por responsabilidades. La siguiente estructura refleja la organización
documentada para el proyecto; algunos directorios pueden estar
preparados para desarrollo progresivo.

``` text
MiPQR/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── config/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── repositories/
│   │   │   ├── dtos/
│   │   │   └── errors/
│   │   ├── application/
│   │   │   └── usecases/
│   │   ├── infrastructure/
│   │   │   ├── datasources/
│   │   │   └── repositories/
│   │   └── presentation/
│   │       ├── controllers/
│   │       ├── routes/
│   │       └── middlewares/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── environments/
│   │   └── app/
│   │       ├── app.config.ts
│   │       ├── app.routes.ts
│   │       ├── app.ts
│   │       ├── app.html
│   │       ├── app.scss
│   │       ├── mocks/
│   │       ├── core/
│   │       │   ├── domain/
│   │       │   │   ├── models/
│   │       │   │   └── repositories/
│   │       │   ├── application/
│   │       │   │   └── usecases/
│   │       │   └── infrastructure/
│   │       │       ├── services/
│   │       │       └── repositories/
│   │       │           ├── local-implementation/
│   │       │           └── node-implementation/
│   │       └── presentation/
│   │           ├── components/
│   │           ├── pages/
│   │           └── interfaces/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

### Responsabilidades principales

-   **Domain:** entidades, contratos y reglas centrales del negocio.
-   **Application:** casos de uso que coordinan las operaciones de la
    aplicación.
-   **Infrastructure:** adaptadores para servicios externos, fuentes de
    datos y repositorios.
-   **Presentation:** componentes de interfaz en el frontend y
    controladores, rutas y middlewares HTTP en el backend.

La presencia de estas carpetas describe la organización prevista, pero
no implica que cada capa o adaptador esté terminado. La implementación
debe verificarse en el código fuente.

## Modelo de datos

El siguiente diagrama representa el modelo entidad-relación descrito en
la propuesta. Se incluyen las entidades `ROL`, `USUARIO`, `CATEGORIA`,
`ESTADO`, `PQR`, `RESPUESTA` e `HISTORIAL_PQR`.

``` mermaid
erDiagram
    ROL ||--o{ USUARIO : define
    USUARIO ||--o{ PQR : presenta
    USUARIO ||--o{ PQR : tiene_asignadas
    USUARIO ||--o{ RESPUESTA : redacta
    USUARIO ||--o{ HISTORIAL_PQR : ejecuta
    CATEGORIA ||--o{ PQR : clasifica
    ESTADO ||--o{ PQR : identifica
    ESTADO ||--o{ HISTORIAL_PQR : registra_cambio
    PQR ||--o{ RESPUESTA : recibe
    PQR ||--o{ HISTORIAL_PQR : registra

    ROL {
        int id_rol PK
        string nombre
        string descripcion
    }

    USUARIO {
        int id_usuario PK
        int id_rol FK
        string nombre
        string correo
        string identificacion
        string password_hash
        boolean activo
    }

    CATEGORIA {
        int id_categoria PK
        string nombre
        string descripcion
        boolean activa
    }

    ESTADO {
        int id_estado PK
        string nombre
        string descripcion
    }

    PQR {
        int id_pqr PK
        string codigo_seguimiento UK
        int id_solicitante FK
        int id_categoria FK
        int id_estado FK
        int id_responsable FK
        string tipo_pqr
        string asunto
        string descripcion
        datetime fecha_registro
        datetime fecha_cierre
    }

    RESPUESTA {
        int id_respuesta PK
        int id_pqr FK
        int id_usuario FK
        string contenido
        datetime fecha_respuesta
    }

    HISTORIAL_PQR {
        int id_historial PK
        int id_pqr FK
        int id_usuario FK
        int id_estado FK
        string accion
        string observacion
        datetime fecha
    }
```

### Consideraciones del modelo

-   `id_solicitante` y `id_responsable` representan dos funciones
    distintas de un usuario en una PQR.
-   El código de seguimiento se plantea como un identificador único
    (`UK`).
-   Las respuestas y los registros históricos se relacionan con la PQR
    correspondiente.
-   El historial permite documentar acciones y cambios de estado.

El diagrama es una representación conceptual del modelo descrito. Antes
de utilizarlo como especificación definitiva de base de datos, se deben
comprobar las claves foráneas, la nulabilidad de los responsables, las
reglas de borrado y la cardinalidad de cada relación en la
implementación real.

## Requisitos previos

Para trabajar con el proyecto se necesita:

-   [Node.js](https://nodejs.org/) en una versión compatible con las
    dependencias.
-   npm, incluido con Node.js.
-   Git, para clonar el repositorio.
-   Acceso a una terminal.

Angular CLI puede instalarse globalmente si el flujo de trabajo del
proyecto lo requiere. Si los comandos ya están definidos en
`package.json`, normalmente se pueden ejecutar mediante npm sin instalar
la CLI globalmente.

## Instalación y ejecución

Los siguientes pasos utilizan los scripts descritos en la documentación
original. Antes de ejecutarlos, comprueba que los comandos estén
definidos en los archivos `package.json` de cada aplicación.

### 1. Obtener el código

``` bash
git clone <URL_DEL_REPOSITORIO>
cd MiPQR
```

Reemplaza `<URL_DEL_REPOSITORIO>` por la dirección real del repositorio.

### 2. Configurar y ejecutar el backend

``` bash
cd backend
npm install
```

Si el proyecto requiere variables de entorno, revisa `.env.example` y
crea el archivo `.env` con los valores correspondientes. No publiques
contraseñas, tokens ni otras credenciales.

Para iniciar el servidor en modo desarrollo:

``` bash
npm run dev
```

Otros comandos documentados para el backend:

``` bash
npm run build
npm start
```

Según la configuración descrita, el servidor utiliza
`http://localhost:3000` y expone un endpoint de salud en
`http://localhost:3000/api/health`. Estas direcciones deben confirmarse
en la configuración efectiva del servidor.

### 3. Configurar y ejecutar el frontend

Abre otra terminal desde la raíz del repositorio:

``` bash
cd frontend
npm install
```

Inicia el servidor de desarrollo:

``` bash
npm start
```

Para compilar la aplicación y ejecutar las pruebas, si los scripts están
disponibles:

``` bash
npm run build
npm test
```

La dirección documentada para la aplicación Angular es
`http://localhost:4200`.

### 4. Verificación básica

1.  Comprueba que el backend inicie sin errores.
2.  Accede al endpoint de salud configurado, si está implementado.
3.  Comprueba que el frontend cargue en el navegador.
4.  Verifica que la URL de la API utilizada por el frontend coincida con
    la configuración del backend.
5.  Si una operación falla, revisa la salida de ambas terminales y las
    variables de entorno.

**Nota:** estas instrucciones no presuponen que exista una base de datos
persistente ni que todas las funcionalidades estén conectadas. La
configuración de almacenamiento y la integración entre frontend y
backend deben confirmarse en el código actual.

## Estado del proyecto

MiPQR se plantea como una plataforma para digitalizar la gestión de PQR.
El alcance documentado incluye el registro y seguimiento de solicitudes,
la clasificación y asignación de casos, las respuestas y el historial de
atención.

Para mantener este README preciso, el equipo debe actualizar esta
sección según el avance real:

-   **Implementado:** funcionalidades terminadas y verificadas.
-   **En desarrollo:** funcionalidades parcialmente implementadas.
-   **Pendiente:** funcionalidades definidas en la propuesta que aún no
    se han construido.

No se asignan estados específicos a las funcionalidades porque la
información disponible para esta documentación no permite verificar el
avance del código.

## Equipo de desarrollo

Proyecto académico de la asignatura **Gerencia de Proyectos
Informáticos** de la **Unidad Central del Valle del Cauca (UCEVA)**.

-   Andres David Guevara Martinez
-   Nicolas Gutierrez Escudero
-   Javier Eduardo Moran Jurado
