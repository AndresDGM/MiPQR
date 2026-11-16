# Servicio de Notificaciones por Correo Electrónico en MiPQR

## 1. Visión General

El módulo de correos de MiPQR implementa el despacho automático, profesional y desacoplado de notificaciones por correo electrónico ante eventos clave del ciclo de vida de las PQR:

1. **Radicación de Solicitud PQR:** Confirmación inmediata al solicitante con su código único de seguimiento, resumen de la solicitud y canales oficiales SIAU.
2. **Asignación a Responsable:** Notificación formal al analista o profesional asignado, con enlace autenticado a la solicitud en el panel administrativo SIAU y advertencia de confidencialidad legal.

---

## 2. Configuración y Variables de Entorno

El servicio utiliza el adaptador `NodemailerEmailService` que implementa el contrato de dominio `EmailService`.
Se configura mediante las siguientes variables de entorno en el backend:

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `SMTP_HOST` | Servidor de correo saliente SMTP | *(Vacío: activa modo simulado)* |
| `SMTP_PORT` | Puerto de conexión SMTP | `587` |
| `SMTP_USER` | Usuario o cuenta de autenticación SMTP | *(Vacío)* |
| `SMTP_PASS` | Contraseña o API Token de la cuenta SMTP | *(Vacío)* |
| `SMTP_FROM` | Remitente visible en los correos | `MiPQR Clinica Dolormed <notificaciones@mipqr.com>` |
| `SMTP_SECURE` | Habilitar TLS/SSL estricto (puerto 465) | `false` |
| `APP_URL` | URL base del frontend para generación de enlaces | `http://localhost:4200` |

### Modo Simulado / Desarrollo
Si las variables `SMTP_HOST`, `SMTP_USER` o `SMTP_PASS` no están configuradas, el servicio **no falla ni detiene la aplicación**: genera un identificador simulado (`<simulated-TIMESTAMP@mipqr.local>`), imprime un registro en la consola del servidor y almacena la auditoría en la tabla `registro_correo`.

---

## 3. Resiliencia y Protección de Datos

- **Desacoplamiento transaccional:** Los errores de conectividad o autenticación con el proveedor SMTP son capturados y registrados como `FALLIDO` en la base de datos sin abortar la creación de la PQR ni su asignación.
- **Privacidad y confidencialidad:** Cumpliendo con la Ley 1581 de 2012 e historia clínica, no se transmiten adjuntos binarios ni datos médicos sensibles en el cuerpo del correo. Se proveen enlaces autenticados directos al portal SIAU.
- **Auditoría:** Cada intento de envío se registra en la tabla `registro_correo` con fecha, destinatario, asunto, estado (`ENVIADO`, `PENDIENTE` o `FALLIDO`) y mensaje de error en caso de fallo.

---

## 4. Identidad Visual y Plantillas

Las plantillas HTML cumplen con los estándares de diseño de MiPQR:
- Paleta institucional: Morado `#673E93`, Turquesa `#279BAF`, Coral `#D54877`, Fondo `#F2F4F7`, Texto `#283447`.
- Maquetación con tablas compatibles para Outlook, Gmail, Apple Mail y clientes móviles.
- Estricta regla de diseño: **sin emojis**, tipografía limpia y estructurada.
