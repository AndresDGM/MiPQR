/**
 * Contrato de cifrado simetrico de textos.
 *
 * El dominio y la presentacion dependen de este contrato; la libreria y el
 * algoritmo concretos los aporta un adapter en infraestructura.
 */
export abstract class CipherService {
  /** Cifra un texto plano y devuelve el resultado en Base64. */
  abstract encrypt(plainText: string): string;

  /** Descifra un texto en Base64. Lanza un Error si el contenido no es valido. */
  abstract decrypt(cipherText: string): string;
}
