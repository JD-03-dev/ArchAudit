/**
 * Helper to convert PEM string to ArrayBuffer for RSA
 */
function pemToArrayBuffer(pem: string) {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  const byteStr = atob(b64);
  const buffer = new ArrayBuffer(byteStr.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < byteStr.length; i++) {
    view[i] = byteStr.charCodeAt(i);
  }
  return buffer;
}

/**
 * Encrypts a File using Hybrid Encryption (RSA + AES-GCM)
 */
export async function encryptFile(file: File, publicKeyPem: string) {
  // 1. Generate a random AES key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  // 2. Export the AES key to encrypt it with RSA
  const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

  // 3. Import the Server's RSA Public Key
  const rsaPublicKey = await window.crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  // 4. Encrypt the AES key with RSA
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaPublicKey,
    exportedAesKey
  );

  // 5. Encrypt the File with AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const fileBuffer = await file.arrayBuffer();
  const encryptedFileBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    fileBuffer
  );

  // 6. Convert everything to Base64 for transport
  return {
    encryptedFile: arrayBufferToBase64(encryptedFileBuffer),
    encryptedKey: arrayBufferToBase64(encryptedAesKey),
    iv: arrayBufferToBase64(iv)
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
