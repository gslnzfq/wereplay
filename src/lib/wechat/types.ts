export type WechatMsgType =
  | "text"
  | "image"
  | "voice"
  | "video"
  | "shortvideo"
  | "location"
  | "link"
  | "event";

export interface WechatIncomingMessage {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: WechatMsgType;
  MsgId?: number;
  Content?: string;
  PicUrl?: string;
  MediaId?: string;
  Format?: string;
  Recognition?: string;
  Event?: string;
  EventKey?: string;
  Ticket?: string;
  Latitude?: number;
  Longitude?: number;
  Label?: string;
  Title?: string;
  Description?: string;
  Url?: string;
}

export interface WechatTextReply {
  type: "text";
  content: string;
}

export interface WechatImageReply {
  type: "image";
  mediaId: string;
}

export type WechatReply = WechatTextReply | WechatImageReply | null;

export interface WechatConfig {
  token: string;
  appId: string;
  appSecret: string;
  encodingAesKey?: string;
}
