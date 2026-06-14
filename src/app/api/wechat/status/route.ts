import { NextResponse } from "next/server";
import { getWechatConfig, isValidEncodingAesKey } from "@/lib/wechat/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 诊断用：不暴露密钥，只显示配置是否就绪 */
export async function GET() {
  try {
    const config = getWechatConfig();
    return NextResponse.json({
      ok: true,
      tokenConfigured: config.token.length > 0,
      appIdConfigured: config.appId.length > 0,
      appSecretConfigured: config.appSecret.length > 0,
      encryptionKeyValid: isValidEncodingAesKey(config.encodingAesKey),
      webhookUrl: "https://wereplay.vercel.app/api/wechat",
      hint: "若发消息后 Vercel 日志无 POST /api/wechat，问题在微信开发者平台「消息推送」配置",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
