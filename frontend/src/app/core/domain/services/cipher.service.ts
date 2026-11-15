/**
 * Contrato de cifrado simétrico de textos.
 *
 * @description
 * La capa de infraestructura y de aplicación dependen de este contrato; el
 * algoritmo concreto lo aporta un adapter enlazado desde el adapter de la aplicación.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export abstract class CipherService {
  /** Cifra un texto plano y devuelve el resultado en Base64. */
  abstract encrypt(plainText: string): string;

  /** Descifra un texto en Base64. Lanza un Error si el contenido no es válido. */
  abstract decrypt(cipherText: string): string;
}
