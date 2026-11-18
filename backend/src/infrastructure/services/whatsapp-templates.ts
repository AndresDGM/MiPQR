const TIPO_LABEL: Record<string, string> = {
  Peticion: 'Petición',
  Queja: 'Queja',
  Reclamo: 'Reclamo',
  Sugerencia: 'Sugerencia',
};

function formatTipo(tipo: string): string {
  return TIPO_LABEL[tipo] ?? tipo;
}

function formatFecha(fecha?: Date | null): string {
  if (!fecha) return 'Por definir';
  return new Date(fecha).toLocaleDateString('es-CO', {
    dateStyle: 'medium',
    timeZone: 'America/Bogota',
  });
}

export class WhatsAppTemplates {
  static buildRegistro(data: {
    nombreSolicitante: string;
    codigoSeguimiento: string;
    tipoPqr: string;
    categoria?: string | null;
    fechaLimite?: Date | null;
    appUrl: string;
  }): string {
    const baseUrl = data.appUrl.replace(/\/$/, '');
    const consultaUrl = `${baseUrl}/consulta?codigo=${encodeURIComponent(data.codigoSeguimiento)}`;

    return [
      '🏥 *MiPQR — Clínica Dolormed*',
      '',
      `Hola *${data.nombreSolicitante}*, tu *${formatTipo(data.tipoPqr)}* ha sido radicada exitosamente.`,
      '',
      `📌 *Código:* \`${data.codigoSeguimiento}\``,
      `📂 *Categoría:* ${data.categoria || 'General'}`,
      '📊 *Estado actual:* Recibida',
      `📅 *Plazo estimado de respuesta:* ${formatFecha(data.fechaLimite)}`,
      '',
      '🔎 *Consulta el avance y la respuesta oficial aquí:*',
      consultaUrl,
      '',
      '_Conserva este código para hacer seguimiento a tu solicitud._',
    ].join('\n');
  }

  static buildAsignacion(data: {
    nombreResponsable: string;
    codigoSeguimiento: string;
    tipoPqr: string;
    categoria?: string | null;
    fechaLimite?: Date | null;
    idPqr: number;
    appUrl: string;
  }): string {
    const baseUrl = data.appUrl.replace(/\/$/, '');
    const detalleUrl = `${baseUrl}/detalle/${data.idPqr}`;

    return [
      '📋 *MiPQR — Nueva Solicitud Asignada*',
      '',
      `Hola *${data.nombreResponsable}*, se te ha asignado la gestión de una nueva PQR:`,
      '',
      `📌 *Código:* \`${data.codigoSeguimiento}\``,
      `🏷️ *Tipo:* ${formatTipo(data.tipoPqr)}`,
      `📂 *Categoría:* ${data.categoria || 'General'}`,
      `⏰ *Fecha límite:* ${formatFecha(data.fechaLimite)}`,
      '',
      '🔐 *Accede al detalle y documentos en el portal:*',
      detalleUrl,
    ].join('\n');
  }

  static buildRespuesta(data: {
    nombreSolicitante: string;
    codigoSeguimiento: string;
    tipoPqr: string;
    appUrl: string;
  }): string {
    const baseUrl = data.appUrl.replace(/\/$/, '');
    const consultaUrl = `${baseUrl}/consulta?codigo=${encodeURIComponent(data.codigoSeguimiento)}`;

    return [
      '✅ *MiPQR — Respuesta Oficial Disponible*',
      '',
      `Hola *${data.nombreSolicitante}*, el equipo de *Clínica Dolormed* ha emitido la respuesta formal a tu *${formatTipo(data.tipoPqr)}*.`,
      '',
      `📌 *Código:* \`${data.codigoSeguimiento}\``,
      '📊 *Estado actual:* Respondida',
      '',
      '🔎 *Lee la respuesta completa en nuestro portal:*',
      consultaUrl,
    ].join('\n');
  }

  static buildAlertaVencimiento(data: {
    nombreDestinatario: string;
    codigoSeguimiento: string;
    tipoPqr: string;
    estadoActual: string;
    horasRestantes: number;
    fechaLimite?: Date | null;
    idPqr: number;
    appUrl: string;
  }): string {
    const baseUrl = data.appUrl.replace(/\/$/, '');
    const detalleUrl = `${baseUrl}/detalle/${data.idPqr}`;
    const estadoPlazo =
      data.horasRestantes <= 0
        ? '⚠️ *PLAZO VENCIDO*'
        : `⏳ *Vence en ~${Math.ceil(data.horasRestantes)} horas*`;

    return [
      '🚨 *MiPQR — Alerta de Vencimiento (SLA)*',
      '',
      `Hola *${data.nombreDestinatario}*, la siguiente solicitud requiere atención prioritaria:`,
      '',
      `📌 *Código:* \`${data.codigoSeguimiento}\``,
      `🏷️ *Tipo:* ${formatTipo(data.tipoPqr)}`,
      `📊 *Estado:* ${data.estadoActual}`,
      `${estadoPlazo} (${formatFecha(data.fechaLimite)})`,
      '',
      '👉 *Gestionar caso ahora:*',
      detalleUrl,
    ].join('\n');
  }
}
