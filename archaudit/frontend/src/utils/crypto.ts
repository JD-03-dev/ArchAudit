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
    ['encrypt', 'decrypt'] // Enable decrypt for response
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
    payload: {
      encryptedFile: arrayBufferToBase64(encryptedFileBuffer),
      encryptedKey: arrayBufferToBase64(encryptedAesKey),
      iv: arrayBufferToBase64(iv)
    },
    aesKey
  };
}

/**
 * Decrypts a server response using the ephemeral AES key
 */
export async function decryptResponse(encryptedResponse: { encryptedData: string, iv: string }, aesKey: CryptoKey) {
  const data = base64ToArrayBuffer(encryptedResponse.encryptedData);
  const iv = base64ToArrayBuffer(encryptedResponse.iv);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    aesKey,
    data
  );
  
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedBuffer));
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
