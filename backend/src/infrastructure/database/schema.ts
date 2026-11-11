export const schemaSql = `
CREATE TABLE IF NOT EXISTS rol (
  id_rol      INTEGER PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario     SERIAL PRIMARY KEY,
  id_rol         INTEGER NOT NULL REFERENCES rol (id_rol),
  nombre         VARCHAR(120) NOT NULL,
  correo         VARCHAR(160) NOT NULL UNIQUE,
  identificacion VARCHAR(20) NOT NULL UNIQUE,
  -- Valor cifrado con RSA (formato "rsa1:<base64>"); nunca texto plano
  password       TEXT NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT TRUE
);

-- Bases creadas antes del cifrado tenian la contrasena como VARCHAR(255)
ALTER TABLE usuario ALTER COLUMN password TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_usuario_id_rol ON usuario (id_rol);

-- Tabla principal de PQR
CREATE TABLE IF NOT EXISTS pqr (
  id_pqr                     SERIAL PRIMARY KEY,
  codigo_seguimiento         VARCHAR(50) NOT NULL UNIQUE,
  id_solicitante             INTEGER REFERENCES usuario (id_usuario) ON DELETE SET NULL,
  nombre_solicitante         VARCHAR(120),
  correo_solicitante         VARCHAR(160),
  identificacion_solicitante VARCHAR(20),
  id_categoria               INTEGER NOT NULL DEFAULT 1,
  categoria                  VARCHAR(100) NOT NULL DEFAULT 'General',
  id_estado                  INTEGER NOT NULL DEFAULT 1,
  estado                     VARCHAR(50) NOT NULL DEFAULT 'Recibida',
  id_responsable             INTEGER REFERENCES usuario (id_usuario) ON DELETE SET NULL,
  tipo_pqr                   VARCHAR(50) NOT NULL,
  asunto                     VARCHAR(200) NOT NULL,
  descripcion                TEXT NOT NULL,
  fecha_registro             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fecha_cierre               TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_pqr_codigo ON pqr (codigo_seguimiento);
CREATE INDEX IF NOT EXISTS idx_pqr_id_solicitante ON pqr (id_solicitante);
CREATE INDEX IF NOT EXISTS idx_pqr_id_responsable ON pqr (id_responsable);

-- Tabla de Documentos Adjuntos y de Soporte: PQR (1) ---- (N) DOCUMENTO_ADJUNTO
CREATE TABLE IF NOT EXISTS documento_adjunto (
  id_adjunto       SERIAL PRIMARY KEY,
  id_pqr           INTEGER NOT NULL REFERENCES pqr (id_pqr) ON DELETE CASCADE,
  nombre_original  VARCHAR(255) NOT NULL,
  nombre_interno   VARCHAR(255) NOT NULL UNIQUE,
  extension        VARCHAR(20) NOT NULL,
  mime_type        VARCHAR(100) NOT NULL,
  tamano_bytes     BIGINT NOT NULL,
  ruta_archivo     TEXT NOT NULL,
  id_usuario       INTEGER REFERENCES usuario (id_usuario) ON DELETE SET NULL,
  fecha_carga      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documento_adjunto_id_pqr ON documento_adjunto (id_pqr);
CREATE INDEX IF NOT EXISTS idx_documento_adjunto_id_usuario ON documento_adjunto (id_usuario);
`;

export const seedSql = `
INSERT INTO rol (id_rol, nombre, descripcion) VALUES
  (1, 'Solicitante', 'Paciente o usuario externo que radica y consulta sus PQR.'),
  (2, 'Analista SIAU', 'Funcionario de atencion al usuario que clasifica y asigna.'),
  (3, 'Responsable', 'Profesional o jefe de area que gestiona y responde el caso.'),
  (4, 'Directivo', 'Coordinacion y direccion, con acceso de consulta.')
ON CONFLICT (id_rol) DO NOTHING;

INSERT INTO pqr (id_pqr, codigo_seguimiento, id_solicitante, nombre_solicitante, correo_solicitante, identificacion_solicitante, id_categoria, categoria, id_estado, estado, id_responsable, tipo_pqr, asunto, descripcion, fecha_registro) VALUES
  (1, 'PQR-2026-0001', 5, 'Carlos Restrepo', 'carlos.restrepo@gmail.com', '1010101005', 1, 'Atención Médica', 1, 'Recibida', NULL, 'Peticion', 'Solicitud de copia de historia clínica completa', 'Requiero copia completa de mi historia clínica para trámite con especialista.', NOW() - INTERVAL '3 days'),
  (2, 'PQR-2026-0002', 5, 'Carlos Restrepo', 'carlos.restrepo@gmail.com', '1010101005', 2, 'Facturación', 2, 'En revision', 2, 'Reclamo', 'Inconformidad con cobro de cuota moderadora', 'Se realizó cobro de cuota cuando el servicio estaba exento.', NOW() - INTERVAL '2 days'),
  (3, 'PQR-2026-0003', NULL, 'Mariana Gomez', 'mariana.gomez@gmail.com', '1010101007', 3, 'Farmacia', 4, 'En gestion', 3, 'Queja', 'Demora en entrega de medicamentos autorizados', 'Llevo 5 días esperando la entrega del medicamento en farmacia.', NOW() - INTERVAL '1 day')
ON CONFLICT (id_pqr) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('pqr', 'id_pqr'),
  GREATEST((SELECT COALESCE(MAX(id_pqr), 1) FROM pqr), 1)
);
`;
