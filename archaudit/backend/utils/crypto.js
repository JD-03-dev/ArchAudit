const forge = require('node-forge');

// Generate RSA Key Pair for the server
const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);

// Export Public Key in PEM format for the frontend
const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

/**
 * Decrypts data using Hybrid Encryption (RSA + AES)
 * Returns { decryptedData, aesKeyBytes }
 */
function decryptPayload(encryptedFileBase64, encryptedKeyBase64, ivBase64) {
  try {
    // 1. Decrypt the AES Key using RSA Private Key
    const encryptedKey = Buffer.from(encryptedKeyBase64, 'base64').toString('binary');
    const aesKeyBytes = privateKey.decrypt(encryptedKey, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    }); 

    // 2. Decrypt the File using the AES Key (Refined AES-GCM)
    const decryptedData = decryptAesGcm(encryptedFileBase64, aesKeyBytes, ivBase64);
    
    return { decryptedData, aesKeyBytes };
  } catch (err) {
    console.error('Decryption failed details:', {
      message: err.message,
      stack: err.stack,
      encryptedKeyLength: encryptedKeyBase64?.length,
      ivLength: ivBase64?.length,
      fileLength: encryptedFileBase64?.length
    });
    throw new Error('Could not decrypt payload');
  }
}

/**
 * Encrypts a response object using the provided AES key
 * Matches WebCrypto output format (ciphertext + 16-byte tag)
 */
function encryptResponse(dataObj, keyBytes) {
  const dataJson = JSON.stringify(dataObj);
  const iv = forge.random.getBytesSync(12);
  const cipher = forge.cipher.createCipher('AES-GCM', keyBytes);
  
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(dataJson, 'utf8'));
  cipher.finish();
  
  const ciphertext = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();
  
  // Combine ciphertext + tag to match WebCrypto output structure
  const combined = ciphertext + tag;
  
  return {
    encryptedData: Buffer.from(combined, 'binary').toString('base64'),
    iv: Buffer.from(iv, 'binary').toString('base64')
  };
}

// Refined AES-GCM decryption to match standard WebCrypto output
function decryptAesGcm(dataBase64, keyBytes, ivBase64) {
  // Use Buffer for more robust base64 decoding in Node.js
  const data = Buffer.from(dataBase64, 'base64');
  const iv = Buffer.from(ivBase64, 'base64');
  
  // WebCrypto AES-GCM: ciphertext + 16-byte tag
  if (data.length < 16) {
    throw new Error('Invalid encrypted data: too short to contain a tag');
  }
  
  const ciphertext = data.subarray(0, data.length - 16);
  const tag = data.subarray(data.length - 16);
  
  const decipher = forge.cipher.createDecipher('AES-GCM', keyBytes);
  decipher.start({ 
    iv: iv.toString('binary'), 
    tag: tag.toString('binary') 
  });
  
  // Use chunks for better memory handling with large files
  const chunkSize = 1024 * 64; // 64KB
  for (let i = 0; i < ciphertext.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, ciphertext.length);
    const chunk = ciphertext.subarray(i, end);
    decipher.update(forge.util.createBuffer(chunk.toString('binary')));
  }
  
  const pass = decipher.finish();
  
  if (!pass) {
    throw new Error('AES-GCM decryption failed (integrity check failed)');
  }
  
  // Return as Buffer
  return Buffer.from(decipher.output.getBytes(), 'binary');
}

module.exports = {
  publicKeyPem,
  decryptPayload,
  encryptResponse
};
