import * as Crypto from 'expo-crypto';

function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generateCodeVerifier(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return base64URLEncode(bytes.buffer as ArrayBuffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
  return base64URLEncode(digest);
}
