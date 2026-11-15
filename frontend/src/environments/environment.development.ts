/**
 * Configuración de variables de entorno de la aplicación para desarrollo.
 */
export const environment = {
  production: false,
  baseUrlNode: 'http://localhost:3000',
  // Clave DES compartida con el backend (exactamente 8 caracteres)
  desKey: 'claveDES',
  // Origen de datos por módulo: 'node' consume el backend, 'local' usa la simulación en memoria
  adapter: {
    auth: 'node' as const,
    users: 'node' as const,
    pqrs: 'local' as const,
    categories: 'local' as const,
    attachments: 'local' as const,
  },
};
