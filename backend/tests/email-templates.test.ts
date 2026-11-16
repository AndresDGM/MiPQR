import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EmailTemplates } from '../src/infrastructure/services/email-templates.js';

describe('EmailTemplates', () => {
  it('debe generar la plantilla de confirmación de registro para el solicitante con los datos requeridos', () => {
    const template = EmailTemplates.buildSolicitanteRegistro({
      nombreSolicitante: 'Juan Pérez',
      codigoSeguimiento: 'PQR-2026-0042',
      tipoPqr: 'Peticion',
      asunto: 'Copia de historia clínica',
      descripcion: 'Requiero copia de mis exámenes del mes anterior.',
      fechaRegistro: new Date('2026-03-10T10:00:00Z'),
      estadoInicial: 'Recibida',
      appUrl: 'http://localhost:4200',
    });

    // Validar asunto
    assert.equal(template.subject, 'MiPQR - Confirmación de registro de tu solicitud [PQR-2026-0042]');

    // Validar contenido HTML
    assert.ok(template.html.includes('Juan Pérez'));
    assert.ok(template.html.includes('PQR-2026-0042'));
    assert.ok(template.html.includes('Peticion'));
    assert.ok(template.html.includes('Copia de historia clínica'));
    assert.ok(template.html.includes('Recibida'));
    assert.ok(template.html.includes('siau@dolormed.com.co'));
    assert.ok(template.html.includes('http://localhost:4200/consulta-pqr?codigo=PQR-2026-0042'));

    // Validar colores institucionales
    assert.ok(template.html.includes('#673E93'));
    assert.ok(template.html.includes('#279BAF'));

    // Validar ausencia de emojis
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
    assert.ok(!emojiRegex.test(template.html), 'No debe contener emojis en el HTML');
    assert.ok(!emojiRegex.test(template.text), 'No debe contener emojis en el texto');
  });

  it('debe generar la plantilla de asignación para el responsable con enlace autenticado y aviso de confidencialidad', () => {
    const template = EmailTemplates.buildResponsableAsignado({
      nombreResponsable: 'Dra. Claudia Morales',
      codigoSeguimiento: 'PQR-2026-0089',
      tipoPqr: 'Queja',
      asunto: 'Demora en asignación de cita médica',
      descripcion: 'El usuario manifiesta retraso de 20 días en cita de neurología.',
      nombreSolicitante: 'Mariana Gómez',
      fechaRegistro: new Date('2026-03-08T09:00:00Z'),
      fechaAsignacion: new Date('2026-03-10T14:30:00Z'),
      estadoActual: 'Asignada',
      idPqr: 89,
      appUrl: 'http://localhost:4200',
    });

    // Validar asunto
    assert.equal(template.subject, 'MiPQR - Nueva solicitud asignada [PQR-2026-0089]');

    // Validar contenido HTML
    assert.ok(template.html.includes('Dra. Claudia Morales'));
    assert.ok(template.html.includes('PQR-2026-0089'));
    assert.ok(template.html.includes('Queja'));
    assert.ok(template.html.includes('Mariana Gómez'));
    assert.ok(template.html.includes('Asignada'));
    assert.ok(template.html.includes('http://localhost:4200/siau/detalle/89'));
    assert.ok(template.html.includes('Aviso de Privacidad y Confidencialidad'));

    // Validar colores institucionales y ausencia de emojis
    assert.ok(template.html.includes('#673E93'));
    assert.ok(template.html.includes('#D54877'));
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
    assert.ok(!emojiRegex.test(template.html));
  });
});
