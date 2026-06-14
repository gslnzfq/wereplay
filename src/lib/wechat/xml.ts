import { XMLBuilder, XMLParser } from "fast-xml-parser";
import type { WechatIncomingMessage, WechatReply } from "./types";

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  parseTagValue: false,
  isArray: () => false,
});

const builder = new XMLBuilder({
  ignoreAttributes: true,
  cdataPropName: "__cdata",
  format: false,
});

function cdata(value: string) {
  return { __cdata: value };
}

export function parseIncomingXml(xml: string): WechatIncomingMessage {
  const parsed = parser.parse(xml) as { xml: Record<string, string> };
  const msg = parsed.xml;

  return {
    ToUserName: msg.ToUserName,
    FromUserName: msg.FromUserName,
    CreateTime: Number(msg.CreateTime),
    MsgType: msg.MsgType as WechatIncomingMessage["MsgType"],
    MsgId: msg.MsgId ? Number(msg.MsgId) : undefined,
    Content: msg.Content,
    PicUrl: msg.PicUrl,
    MediaId: msg.MediaId,
    Format: msg.Format,
    Recognition: msg.Recognition,
    Event: msg.Event,
    EventKey: msg.EventKey,
    Ticket: msg.Ticket,
    Latitude: msg.Latitude ? Number(msg.Latitude) : undefined,
    Longitude: msg.Longitude ? Number(msg.Longitude) : undefined,
    Label: msg.Label,
    Title: msg.Title,
    Description: msg.Description,
    Url: msg.Url,
  };
}

export function extractEncryptField(xml: string): string | null {
  const parsed = parser.parse(xml) as { xml?: { Encrypt?: string } };
  return parsed.xml?.Encrypt ?? null;
}

export function buildTextReply(
  toUser: string,
  fromUser: string,
  content: string,
): string {
  return builder.build({
    xml: {
      ToUserName: cdata(toUser),
      FromUserName: cdata(fromUser),
      CreateTime: Math.floor(Date.now() / 1000),
      MsgType: cdata("text"),
      Content: cdata(content),
    },
  });
}

export function buildImageReply(
  toUser: string,
  fromUser: string,
  mediaId: string,
): string {
  return builder.build({
    xml: {
      ToUserName: cdata(toUser),
      FromUserName: cdata(fromUser),
      CreateTime: Math.floor(Date.now() / 1000),
      MsgType: cdata("image"),
      Image: {
        MediaId: cdata(mediaId),
      },
    },
  });
}

export function buildReplyXml(
  message: WechatIncomingMessage,
  reply: WechatReply,
): string | null {
  if (!reply) return null;

  const toUser = message.FromUserName;
  const fromUser = message.ToUserName;

  if (reply.type === "text") {
    return buildTextReply(toUser, fromUser, reply.content);
  }

  return buildImageReply(toUser, fromUser, reply.mediaId);
}

export function buildEncryptedResponseXml(
  encrypt: string,
  msgSignature: string,
  timestamp: string,
  nonce: string,
): string {
  return builder.build({
    xml: {
      Encrypt: cdata(encrypt),
      MsgSignature: cdata(msgSignature),
      TimeStamp: timestamp,
      Nonce: cdata(nonce),
    },
  });
}
