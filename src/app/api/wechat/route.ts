import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getWechatConfig, isValidEncodingAesKey } from "@/lib/wechat/config";
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
    // 根据微信实际请求判断：有 msg_signature 才走加密模式
    const useEncryption =
      Boolean(msgSignature) &&
      isValidEncodingAesKey(config.encodingAesKey);

    if (useEncryption && config.encodingAesKey) {
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
    const rawBody = await request.text();
    const encryptField = extractEncryptField(rawBody);
    const useEncryption =
      Boolean(msgSignature && encryptField) &&
      isValidEncodingAesKey(config.encodingAesKey);

    console.info("[wechat POST] received", {
      hasEncrypt: Boolean(encryptField),
      useEncryption,
      bodyLength: rawBody.length,
    });

    if (encryptField && !useEncryption) {
      console.error(
        "[wechat POST] encrypted body but WECHAT_ENCODING_AES_KEY missing or invalid (must be 43 chars)",
      );
      return textResponse("encryption not configured", 403);
    }

    let messageXml = rawBody;

    if (useEncryption && config.encodingAesKey) {
      if (
        !verifyMsgSignature(
          config.token,
          timestamp,
          nonce,
          encryptField!,
          msgSignature,
        )
      ) {
        return textResponse("Invalid signature", 403);
      }

      messageXml = decryptMessage(
        config.encodingAesKey,
        config.appId,
        encryptField!,
      );
    } else if (!verifySignature(config.token, timestamp, nonce, signature)) {
      return textResponse("Invalid signature", 403);
    }

    const message = parseIncomingXml(messageXml);
    console.info("[wechat POST] message", {
      msgType: message.MsgType,
      event: message.Event,
      fromUser: message.FromUserName?.slice(0, 8),
    });

    const reply = await handleMessage(message);
    const replyXml = buildReplyXml(message, reply);

    if (!replyXml) {
      return textResponse("success");
    }

    if (useEncryption && config.encodingAesKey) {
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
