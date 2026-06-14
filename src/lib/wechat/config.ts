import type { WechatConfig } from "./types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
  return Boolean(config.encodingAesKey);
}
