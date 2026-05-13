const forge = require('node-forge');

// Generate RSA Key Pair for the server
const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);

// Export Public Key in PEM format for the frontend
const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

/**
 * Decrypts data using Hybrid Encryption (RSA + AES)
 * @param {string} encryptedFileBase64 - The AES-encrypted file (base64)
 * @param {string} encryptedKeyBase64 - The RSA-encrypted AES key (base64)
 * @param {string} ivBase64 - The AES Initialization Vector (base64)
 */
function decryptPayload(encryptedFileBase64, encryptedKeyBase64, ivBase64) {
  try {
    // 1. Decrypt the AES Key using RSA Private Key
    const encryptedKey = forge.util.decode64(encryptedKeyBase64);
    const aesKeyBytes = privateKey.decrypt(encryptedKey, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    }); 

    // 2. Decrypt the File using the AES Key
    const encryptedFile = forge.util.decode64(encryptedFileBase64);
    const iv = forge.util.decode64(ivBase64);
    
    const decipher = forge.cipher.createDecipher('AES-GCM', aesKeyBytes);
    decipher.start({
      iv: iv,
      tagLength: 128,
      tag: forge.util.decode64(encryptedFileBase64.slice(-24)) // GCM tag is usually appended or sent separately. 
      // For simplicity in this MVP, we'll assume the tag is handled. 
      // Actually, let's refine this to match WebCrypto's output structure.
    });
    
    // We'll use a slightly more robust approach to match WebCrypto's AES-GCM output
    return decryptAesGcm(encryptedFileBase64, aesKeyBytes, ivBase64);
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('Could not decrypt payload');
  }
}

// Refined AES-GCM decryption to match standard WebCrypto output
function decryptAesGcm(dataBase64, keyBytes, ivBase64) {
  const data = forge.util.decode64(dataBase64);
  const iv = forge.util.decode64(ivBase64);
  
  // WebCrypto AES-GCM: ciphertext + 16-byte tag
  const ciphertext = data.slice(0, -16);
  const tag = data.slice(-16);
  
  const decipher = forge.cipher.createDecipher('AES-GCM', keyBytes);
  decipher.start({ iv, tag });
  decipher.update(forge.util.createBuffer(ciphertext));
  const pass = decipher.finish();
  
  if (!pass) {
    throw new Error('AES-GCM decryption failed (integrity check failed)');
  }
  
  // Return as Buffer for AdmZip
  return Buffer.from(decipher.output.getBytes(), 'binary');
}

module.exports = {
  publicKeyPem,
  decryptPayload
};
