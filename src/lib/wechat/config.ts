import type { WechatConfig } from "./types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isValidEncodingAesKey(key?: string): boolean {
  const trimmed = key?.trim();
  // 微信 EncodingAESKey 固定 43 位
  return Boolean(trimmed && trimmed.length === 43);
}

export function getWechatConfig(): WechatConfig {
  return {
    token: requireEnv("WECHAT_TOKEN"),
    appId: requireEnv("WECHAT_APP_ID"),
    appSecret: requireEnv("WECHAT_APP_SECRET"),
    encodingAesKey: process.env.WECHAT_ENCODING_AES_KEY,
  };
}

export function isEncryptionEnabled(config: WechatConfig): boolean {
  return isValidEncodingAesKey(config.encodingAesKey);
}
