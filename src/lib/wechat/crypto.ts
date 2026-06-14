import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function sha1(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

export function verifySignature(
  token: string,
  timestamp: string,
  nonce: string,
  signature: string,
): boolean {
  const sorted = [token, timestamp, nonce].sort().join("");
  return sha1(sorted) === signature;
}

export function verifyMsgSignature(
  token: string,
  timestamp: string,
  nonce: string,
  encrypt: string,
  msgSignature: string,
): boolean {
  const sorted = [token, timestamp, nonce, encrypt].sort().join("");
  return sha1(sorted) === msgSignature;
}

function getAesKey(encodingAesKey: string): Buffer {
  return Buffer.from(`${encodingAesKey}=`, "base64");
}

function pkcs7Unpad(buffer: Buffer): Buffer {
  const pad = buffer[buffer.length - 1];
  if (pad < 1 || pad > 32) return buffer;
  return buffer.subarray(0, buffer.length - pad);
}

function pkcs7Pad(buffer: Buffer, blockSize = 32): Buffer {
  const pad = blockSize - (buffer.length % blockSize);
  const padding = Buffer.alloc(pad, pad);
  return Buffer.concat([buffer, padding]);
}

export function decryptMessage(
  encodingAesKey: string,
  appId: string,
  encrypted: string,
): string {
  const aesKey = getAesKey(encodingAesKey);
  const iv = aesKey.subarray(0, 16);
  const decipher = createDecipheriv("aes-256-cbc", aesKey, iv);
  decipher.setAutoPadding(false);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);
  const content = pkcs7Unpad(decrypted);

  const msgLen = content.readUInt32BE(16);
  const msg = content.subarray(20, 20 + msgLen).toString("utf8");
  const receivedAppId = content.subarray(20 + msgLen).toString("utf8");

  if (receivedAppId !== appId) {
    throw new Error("AppId mismatch in decrypted message");
  }

  return msg;
}

export function encryptMessage(
  encodingAesKey: string,
  appId: string,
  replyXml: string,
): string {
  const aesKey = getAesKey(encodingAesKey);
  const iv = aesKey.subarray(0, 16);
  const randomStr = randomBytes(16);
  const msgBuffer = Buffer.from(replyXml, "utf8");
  const msgLen = Buffer.alloc(4);
  msgLen.writeUInt32BE(msgBuffer.length, 0);

  const plain = Buffer.concat([
    randomStr,
    msgLen,
    msgBuffer,
    Buffer.from(appId, "utf8"),
  ]);
  const padded = pkcs7Pad(plain);

  const cipher = createCipheriv("aes-256-cbc", aesKey, iv);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  return encrypted.toString("base64");
}

export function signEncryptedReply(
  token: string,
  timestamp: string,
  nonce: string,
  encrypt: string,
): string {
  const sorted = [token, timestamp, nonce, encrypt].sort().join("");
  return sha1(sorted);
}
