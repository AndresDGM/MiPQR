export interface SolicitanteRegistroEmailData {
  nombreSolicitante: string;
  codigoSeguimiento: string;
  tipoPqr: string;
  asunto?: string;
  descripcion?: string;
  fechaRegistro: Date | string;
  estadoInicial: string;
  appUrl: string;
}

export interface ResponsableAsignadoEmailData {
  nombreResponsable: string;
  codigoSeguimiento: string;
  tipoPqr: string;
  asunto?: string;
  descripcion?: string;
  nombreSolicitante?: string | null;
  fechaRegistro: Date | string;
  fechaAsignacion: Date | string;
  estadoActual: string;
  idPqr: number;
  appUrl: string;
}

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Plantillas HTML profesionales para notificaciones por correo electrónico de MiPQR.
 * Diseñadas con tablas compatibles para clientes de correo (Outlook, Gmail, Apple Mail).
 * Sin emojis, con la paleta de identidad visual oficial de MiPQR.
 */
export class EmailTemplates {
  /**
   * Genera el correo de confirmación de radicación dirigido al solicitante.
   */
  static buildSolicitanteRegistro(data: SolicitanteRegistroEmailData): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = `MiPQR - Confirmación de registro de tu solicitud [${data.codigoSeguimiento}]`;
    const formattedFecha = formatDate(data.fechaRegistro);
    const consultaUrl = `${data.appUrl.replace(/\/$/, '')}/consulta-pqr?codigo=${encodeURIComponent(
      data.codigoSeguimiento
    )}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F2F4F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #283447;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F2F4F7; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(40, 52, 71, 0.08);">
          
          <!-- Encabezado Institucional -->
          <tr>
            <td style="background-color: #673E93; padding: 28px 32px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">MiPQR</span>
                    <span style="color: #279BAF; font-size: 16px; font-weight: 600; margin-left: 8px;">| Clinica Dolormed</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 6px;">
                    <p style="margin: 0; color: #F2F4F7; font-size: 14px;">Sistema Institucional de Atencion al Usuario (SIAU)</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; color: #673E93; font-size: 20px; font-weight: 600;">Confirmacion de Radicacion</h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #283447;">
                Estimado(a) <strong>${escapeHtml(data.nombreSolicitante)}</strong>:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4A5568;">
                Le informamos que su solicitud ha sido registrada formalmente en el sistema de gestion de Clinica Dolormed. A continuacion encuentra el resumen de los datos radicados:
              </p>

              <!-- Tarjeta de Codigo de Seguimiento -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; border-left: 4px solid #279BAF; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #718096; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Codigo Unico de Seguimiento</span>
                    <span style="font-size: 22px; font-weight: 700; color: #673E93; letter-spacing: 1px;">${escapeHtml(
                      data.codigoSeguimiento
                    )}</span>
                  </td>
                </tr>
              </table>

              <!-- Detalle de la Solicitud (Información Mínima por Privacidad) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #718096; width: 35%;">Tipo de Solicitud:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; font-weight: 600; color: #283447;">${escapeHtml(
                    data.tipoPqr
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #718096;">Fecha de Registro:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; color: #283447;">${formattedFecha}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #718096;">Estado Inicial:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; color: #279BAF; font-weight: 600;">${escapeHtml(
                    data.estadoInicial
                  )}</td>
                </tr>
              </table>

              <!-- Aviso de Privacidad y Proteccion de Datos Medicos Sensibles -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; border-left: 4px solid #673E93; border-radius: 4px; padding: 14px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <span style="font-size: 12px; font-weight: 700; color: #673E93; text-transform: uppercase; display: block; margin-bottom: 4px;">Aviso de Privacidad y Confidencialidad Medica</span>
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #283447;">
                      Por motivos de seguridad, reserva legal y proteccion de datos sensibles de salud (Habeas Data), el asunto y la descripcion detallada de su caso no se envian por correo electronico. Puede consultar los detalles completos de su solicitud de forma segura a traves de nuestro portal.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Seccion de Instrucciones -->
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #4A5568;">
                Conserve su codigo de seguimiento para verificar el estado de atencion, las observaciones y la respuesta oficial emitida por el equipo de profesionales.
              </p>

              <!-- Boton de Accion Principal -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${consultaUrl}" target="_blank" style="background-color: #279BAF; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 4px; display: inline-block;">
                      Consultar Estado de la Solicitud
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Informacion Institucional -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; border-radius: 4px; padding: 16px; margin-top: 10px;">
                <tr>
                  <td>
                    <span style="font-size: 13px; font-weight: 600; color: #283447; display: block; margin-bottom: 6px;">Canales de Atencion al Usuario (SIAU)</span>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #718096;">PBX: (602) 555-0199 | Linea Nacional: 01 8000 910 200</p>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #718096;">Correo: siau@dolormed.com.co</p>
                    <p style="margin: 0; font-size: 12px; color: #718096;">Horario: Lunes a Viernes de 7:00 a.m. a 5:00 p.m.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pie de Pagina -->
          <tr>
            <td style="background-color: #283447; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #A0AEC0; font-size: 12px;">
                Clinica Dolormed S.A.S. - Compromiso y excelencia en el cuidado de su salud.
              </p>
              <p style="margin: 0; color: #718096; font-size: 11px; line-height: 1.4;">
                Este es un mensaje automatico generado por el sistema MiPQR. Por favor no responda a este remitente.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
MiPQR | Clinica Dolormed
Confirmacion de Radicacion de Solicitud

Estimado(a) ${data.nombreSolicitante}:
Le informamos que su solicitud ha sido radicada formalmente en nuestro sistema.

Codigo Unico de Seguimiento: ${data.codigoSeguimiento}
Tipo de Solicitud: ${data.tipoPqr}
Fecha de Registro: ${formattedFecha}
Estado Inicial: ${data.estadoInicial}

Aviso de Privacidad y Confidencialidad:
Por motivos de seguridad y proteccion de datos sensibles de salud, el asunto y la descripcion detallada de su caso no se envian por correo electronico. Puede consultar la informacion completa de su solicitud ingresando a nuestro portal institucional:
${consultaUrl}

Atencion al Usuario (SIAU) Clinica Dolormed:
PBX: (602) 555-0199 | Correo: siau@dolormed.com.co
    `.trim();

    return { subject, html, text };
  }

  /**
   * Genera el correo de notificación de asignación dirigido al responsable del caso.
   */
  static buildResponsableAsignado(data: ResponsableAsignadoEmailData): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = `MiPQR - Nueva solicitud asignada [${data.codigoSeguimiento}]`;
    const formattedFechaReg = formatDate(data.fechaRegistro);
    const formattedFechaAsig = formatDate(data.fechaAsignacion);
    const detalleUrl = `${data.appUrl.replace(/\/$/, '')}/siau/detalle/${data.idPqr}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F2F4F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #283447;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F2F4F7; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(40, 52, 71, 0.08);">
          
          <!-- Encabezado Institucional -->
          <tr>
            <td style="background-color: #673E93; padding: 28px 32px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">MiPQR</span>
                    <span style="color: #279BAF; font-size: 16px; font-weight: 600; margin-left: 8px;">| Gestion Interna SIAU</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 6px;">
                    <p style="margin: 0; color: #F2F4F7; font-size: 14px;">Notificacion de Asignacion de Caso</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; color: #673E93; font-size: 20px; font-weight: 600;">Nueva Solicitud Pendiente de Atencion</h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #283447;">
                Apreciado(a) profesional <strong>${escapeHtml(data.nombreResponsable)}</strong>:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4A5568;">
                Se le ha delegado formalmente la gestion y atencion de la siguiente solicitud PQR. Por favor revise los antecedentes y proceda con el analisis correspondiente:
              </p>

              <!-- Tarjeta de Identificacion de la PQR -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; border-left: 4px solid #673E93; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #718096; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Codigo de Solicitud</span>
                    <span style="font-size: 22px; font-weight: 700; color: #673E93; letter-spacing: 1px;">${escapeHtml(
                      data.codigoSeguimiento
                    )}</span>
                  </td>
                </tr>
              </table>

              <!-- Detalle de la Solicitud (Información Mínima por Privacidad) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #718096; width: 35%;">Tipo de Solicitud:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; font-weight: 600; color: #283447;">${escapeHtml(
                    data.tipoPqr
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #718096;">Solicitante:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; color: #283447;">${escapeHtml(
                    data.nombreSolicitante || 'Usuario Registrado'
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #718096;">Fecha de Registro:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; color: #283447;">${formattedFechaReg}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #718096;">Fecha de Asignacion:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; color: #283447;">${formattedFechaAsig}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #718096;">Estado Actual:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; color: #673E93; font-weight: 600;">${escapeHtml(
                    data.estadoActual
                  )}</td>
                </tr>
              </table>

              <!-- Aviso de Privacidad y Acceso Autenticado -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF5F7; border-left: 4px solid #D54877; border-radius: 4px; padding: 14px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <span style="font-size: 12px; font-weight: 700; color: #D54877; text-transform: uppercase; display: block; margin-bottom: 4px;">Aviso de Privacidad y Confidencialidad</span>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #283447;">
                      Por motivos de seguridad y proteccion de datos sensibles (Ley 1581 de 2012 e historia clinica), los documentos de soporte y la informacion medica completa solo se encuentran disponibles en el portal autenticado.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Boton de Accion Principal -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                <tr>
                  <td align="center">
                    <a href="${detalleUrl}" target="_blank" style="background-color: #673E93; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 4px; display: inline-block;">
                      Acceder al Caso en Panel SIAU
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pie de Pagina -->
          <tr>
            <td style="background-color: #283447; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #A0AEC0; font-size: 12px;">
                MiPQR - Sistema Integrado de Atencion al Usuario | Clinica Dolormed
              </p>
              <p style="margin: 0; color: #718096; font-size: 11px; line-height: 1.4;">
                Notificacion interna dirigida exclusivamente al profesional asignado. Acceso restringido.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
MiPQR | Clinica Dolormed
Nueva Solicitud Asignada

Apreciado(a) ${data.nombreResponsable}:
Se le ha delegado formalmente la gestion de la siguiente PQR:

Codigo: ${data.codigoSeguimiento}
Tipo: ${data.tipoPqr}
Solicitante: ${data.nombreSolicitante || 'Usuario Registrado'}
Fecha de Registro: ${formattedFechaReg}
Fecha de Asignacion: ${formattedFechaAsig}
Estado Actual: ${data.estadoActual}

Aviso de Privacidad y Confidencialidad:
Por motivos de seguridad y proteccion de datos sensibles (historia clinica y Ley 1581 de 2012), el detalle clinico y los documentos de soporte solo se encuentran disponibles en el portal autenticado.

Acceda al panel SIAU mediante el siguiente enlace autenticado:
${detalleUrl}
    `.trim();

    return { subject, html, text };
  }

  static buildRespuestaEmitida(data: {
    nombreSolicitante: string;
    codigoSeguimiento: string;
    tipoPqr: string;
    fechaRespuesta: Date;
    appUrl: string;
  }): { subject: string; html: string; text: string } {
    const baseUrl = data.appUrl.replace(/\/$/, '');
    const consultaUrl = `${baseUrl}/consulta?codigo=${encodeURIComponent(data.codigoSeguimiento)}`;
    const formattedFecha = new Date(data.fechaRespuesta).toLocaleString('es-CO', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    });

    const subject = `Respuesta oficial disponible - ${data.codigoSeguimiento} | MiPQR Clinica Dolormed`;
    const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: Arial, sans-serif; background-color: #F2F4F7; padding: 24px; color: #283447;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; padding: 28px; border-top: 4px solid #673E93;">
    <h2 style="margin-top: 0; color: #673E93;">Su solicitud ha sido respondida</h2>
    <p>Apreciado(a) <strong>${escapeHtml(data.nombreSolicitante)}</strong>,</p>
    <p>El equipo de <strong>Clínica Dolormed</strong> ha emitido la respuesta oficial a su ${escapeHtml(data.tipoPqr)} con código <strong>${escapeHtml(data.codigoSeguimiento)}</strong> (${formattedFecha}).</p>
    <p style="font-size: 13px; color: #4A5568;">Por confidencialidad y protección de datos (Ley 1581 de 2012), el contenido completo de la respuesta se consulta en nuestro portal.</p>
    <p style="margin: 24px 0;">
      <a href="${consultaUrl}" target="_blank" style="background-color: #279BAF; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 600;">Ver Respuesta Oficial</a>
    </p>
  </div>
</body>
</html>`.trim();

    const text = [
      'MiPQR | Clinica Dolormed',
      `Su solicitud ${data.codigoSeguimiento} ha sido respondida (${formattedFecha}).`,
      `Consulte la respuesta oficial en: ${consultaUrl}`,
    ].join('\n');

    return { subject, html, text };
  }

  static buildAlertaVencimiento(data: {
    nombreDestinatario: string;
    codigoSeguimiento: string;
    tipoPqr: string;
    estadoActual: string;
    fechaLimite: Date;
    horasRestantes: number;
    idPqr: number;
    appUrl: string;
  }): { subject: string; html: string; text: string } {
    const baseUrl = data.appUrl.replace(/\/$/, '');
    const detalleUrl = `${baseUrl}/detalle/${data.idPqr}`;
    const formattedLimite = new Date(data.fechaLimite).toLocaleString('es-CO', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    });
    const vencida = data.horasRestantes <= 0;
    const urgencia = vencida
      ? 'Plazo vencido'
      : `Vence en aproximadamente ${Math.ceil(data.horasRestantes)} horas`;

    const subject = `[ALERTA SLA] ${data.codigoSeguimiento} - ${urgencia} | MiPQR`;
    const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: Arial, sans-serif; background-color: #F2F4F7; padding: 24px; color: #283447;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; padding: 28px; border-top: 4px solid #D54877;">
    <h2 style="margin-top: 0; color: #D54877;">Alerta de vencimiento de PQR (${urgencia})</h2>
    <p>Apreciado(a) <strong>${escapeHtml(data.nombreDestinatario)}</strong>,</p>
    <p>La solicitud <strong>${escapeHtml(data.codigoSeguimiento)}</strong> (${escapeHtml(data.tipoPqr)}) en estado <strong>${escapeHtml(data.estadoActual)}</strong> tiene fecha límite <strong>${formattedLimite}</strong>.</p>
    <p style="margin: 24px 0;">
      <a href="${detalleUrl}" target="_blank" style="background-color: #673E93; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 600;">Gestionar Caso Ahora</a>
    </p>
  </div>
</body>
</html>`.trim();

    const text = [
      `MiPQR | Alerta SLA (${urgencia})`,
      `Caso: ${data.codigoSeguimiento} (${data.tipoPqr}) - Estado: ${data.estadoActual}`,
      `Fecha límite: ${formattedLimite}`,
      `Gestionar en: ${detalleUrl}`,
    ].join('\n');

    return { subject, html, text };
  }
}
