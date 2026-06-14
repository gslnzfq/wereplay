/**
 * 获取微信 access_token，用于客服消息等主动推送接口。
 * Vercel Serverless 无持久内存，此处做简单内存缓存；
 * 生产环境建议使用 Redis / Vercel KV 等外部存储。
 */

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const url = new URL("https://api.weixin.qq.com/cgi-bin/token");
  url.searchParams.set("grant_type", "client_credential");
  url.searchParams.set("appid", appId);
  url.searchParams.set("secret", appSecret);

  const res = await fetch(url);
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    errcode?: number;
    errmsg?: string;
  };

  if (!data.access_token) {
    throw new Error(
      `Failed to get access_token: ${data.errcode ?? "unknown"} ${data.errmsg ?? ""}`,
    );
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 7200) * 1000,
  };

  return data.access_token;
}

export async function sendCustomerServiceText(
  appId: string,
  appSecret: string,
  openId: string,
  content: string,
): Promise<void> {
  const accessToken = await getAccessToken(appId, appSecret);
  const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      touser: openId,
      msgtype: "text",
      text: { content },
    }),
  });

  const data = (await res.json()) as { errcode?: number; errmsg?: string };
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`Customer service send failed: ${data.errcode} ${data.errmsg}`);
  }
}
