import type { WechatIncomingMessage, WechatReply } from "./types";

/**
 * 处理用户消息并生成回复。
 * 在此函数中自定义你的业务逻辑。
 */
export async function handleMessage(
  message: WechatIncomingMessage,
): Promise<WechatReply> {
  const { MsgType, Content, Event, EventKey } = message;

  // 事件消息（关注、取消关注、菜单点击等）
  if (MsgType === "event") {
    if (Event === "subscribe") {
      return {
        type: "text",
        content: "欢迎关注！发送任意文字消息，我会自动回复你。",
      };
    }

    if (Event === "unsubscribe") {
      return null;
    }

    if (Event === "CLICK" && EventKey) {
      return {
        type: "text",
        content: `你点击了菜单：${EventKey}`,
      };
    }

    return null;
  }

  // 文本消息
  if (MsgType === "text" && Content) {
    const trimmed = Content.trim();

    if (trimmed === "帮助" || trimmed.toLowerCase() === "help") {
      return {
        type: "text",
        content: [
          "可用指令：",
          "· 帮助 - 显示此帮助",
          "· 时间 - 获取当前时间",
          "· 其他任意文字 - 我会 echo 你的消息",
        ].join("\n"),
      };
    }

    if (trimmed === "时间") {
      return {
        type: "text",
        content: `当前时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
      };
    }

    return {
      type: "text",
      content: `收到你的消息：${Content}`,
    };
  }

  // 图片消息
  if (MsgType === "image") {
    return {
      type: "text",
      content: "收到图片消息，暂不支持图片识别，请发送文字消息。",
    };
  }

  // 语音消息
  if (MsgType === "voice") {
    const text = message.Recognition ?? "（未识别）";
    return {
      type: "text",
      content: `收到语音消息，识别结果：${text}`,
    };
  }

  return {
    type: "text",
    content: `暂不支持 ${MsgType} 类型消息，请发送文字消息。`,
  };
}
