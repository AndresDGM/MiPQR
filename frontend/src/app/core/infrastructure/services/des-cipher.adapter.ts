import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CipherService } from '../../domain/services/cipher.service';
import { fromBase64, toBase64 } from './des/base64';
import { BLOCK_SIZE, DesAlgorithm } from './des/des.algorithm';

/**
 * Adapter que adapta el algoritmo {@link DesAlgorithm} al contrato {@link CipherService}.
 *
 * Formato del mensaje: Base64( IV de 8 bytes || texto cifrado ), con DES en modo CBC
 * y relleno PKCS7. El IV es aleatorio por mensaje, por lo que cifrar dos veces el
 * mismo texto produce resultados distintos. Es el mismo formato que descifra el backend.
 *
 * Nota: DES es un algoritmo obsoleto (clave efectiva de 56 bits) y la clave viaja en el
 * código del cliente. Se usa aquí por requerimiento académico; no debe emplearse para
 * proteger datos reales.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable()
export class DesCipherAdapter extends CipherService {
  private readonly des: DesAlgorithm;
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder('utf-8', { fatal: true });

  constructor() {
    super();
    const key = this.encoder.encode(environment.desKey);
    if (key.length !== BLOCK_SIZE) {
      throw new Error(`La clave DES debe tener exactamente ${BLOCK_SIZE} caracteres`);
    }
    this.des = new DesAlgorithm(key);
  }

  encrypt(plainText: string): string {
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(BLOCK_SIZE));
    const encrypted = this.des.encryptCbc(this.encoder.encode(plainText), iv);

    const message = new Uint8Array(BLOCK_SIZE + encrypted.length);
    message.set(iv);
    message.set(encrypted, BLOCK_SIZE);
    return toBase64(message);
  }

  decrypt(cipherText: string): string {
    const message = fromBase64(cipherText);
    if (message.length < BLOCK_SIZE * 2) {
      throw new Error('Contenido cifrado inválido');
    }

    const iv = message.slice(0, BLOCK_SIZE);
    const decrypted = this.des.decryptCbc(message.slice(BLOCK_SIZE), iv);
    return this.decoder.decode(decrypted);
  }
}
