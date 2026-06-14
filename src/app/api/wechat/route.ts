import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getWechatConfig, isEncryptionEnabled } from "@/lib/wechat/config";
import {
  decryptMessage,
  encryptMessage,
  signEncryptedReply,
  verifyMsgSignature,
  verifySignature,
} from "@/lib/wechat/crypto";
import { handleMessage } from "@/lib/wechat/handler";
import {
  buildEncryptedResponseXml,
  buildReplyXml,
  extractEncryptField,
  parseIncomingXml,
} from "@/lib/wechat/xml";

export const runtime = "nodejs";

function getQueryParams(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  return {
    signature: searchParams.get("signature") ?? "",
    timestamp: searchParams.get("timestamp") ?? "",
    nonce: searchParams.get("nonce") ?? "",
    echostr: searchParams.get("echostr") ?? "",
    msgSignature: searchParams.get("msg_signature") ?? "",
  };
}

function xmlResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

function textResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * 微信服务器配置验证（GET）
 * 在公众号后台填写服务器 URL 后，微信会发送 GET 请求验证
 */
export async function GET(request: NextRequest) {
  try {
    const config = getWechatConfig();
    const { signature, timestamp, nonce, echostr, msgSignature } =
      getQueryParams(request);
    const encrypted = isEncryptionEnabled(config);

    if (encrypted && config.encodingAesKey) {
      if (
        !verifyMsgSignature(
          config.token,
          timestamp,
          nonce,
          echostr,
          msgSignature,
        )
      ) {
        return textResponse("Invalid signature", 403);
      }
      const plain = decryptMessage(
        config.encodingAesKey,
        config.appId,
        echostr,
      );
      return textResponse(plain);
    }

    if (!verifySignature(config.token, timestamp, nonce, signature)) {
      return textResponse("Invalid signature", 403);
    }

    return textResponse(echostr);
  } catch (error) {
    console.error("[wechat GET]", error);
    return textResponse("Server error", 500);
  }
}

/**
 * 接收用户消息并被动回复（POST）
 * 微信要求 5 秒内返回，否则不会展示回复
 */
export async function POST(request: NextRequest) {
  try {
    const config = getWechatConfig();
    const { signature, timestamp, nonce, msgSignature } =
      getQueryParams(request);
    const encrypted = isEncryptionEnabled(config);
    const rawBody = await request.text();

    let messageXml = rawBody;

    if (encrypted && config.encodingAesKey) {
      const encryptField = extractEncryptField(rawBody);
      if (!encryptField) {
        return textResponse("Missing Encrypt field", 400);
      }

      if (
        !verifyMsgSignature(
          config.token,
          timestamp,
          nonce,
          encryptField,
          msgSignature,
        )
      ) {
        return textResponse("Invalid signature", 403);
      }

      messageXml = decryptMessage(
        config.encodingAesKey,
        config.appId,
        encryptField,
      );
    } else if (!verifySignature(config.token, timestamp, nonce, signature)) {
      return textResponse("Invalid signature", 403);
    }

    const message = parseIncomingXml(messageXml);
    const reply = await handleMessage(message);
    const replyXml = buildReplyXml(message, reply);

    if (!replyXml) {
      return textResponse("success");
    }

    if (encrypted && config.encodingAesKey) {
      const responseNonce = randomBytes(8).toString("hex");
      const responseTimestamp = Math.floor(Date.now() / 1000).toString();
      const encryptedReply = encryptMessage(
        config.encodingAesKey,
        config.appId,
        replyXml,
      );
      const msgSig = signEncryptedReply(
        config.token,
        responseTimestamp,
        responseNonce,
        encryptedReply,
      );

      return xmlResponse(
        buildEncryptedResponseXml(
          encryptedReply,
          msgSig,
          responseTimestamp,
          responseNonce,
        ),
      );
    }

    return xmlResponse(replyXml);
  } catch (error) {
    console.error("[wechat POST]", error);
    return textResponse("success");
  }
}
