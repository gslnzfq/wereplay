# 微信公众号后台 (wx-chat)

基于 [Next.js](https://nextjs.org) 实现的微信公众号服务器，支持接收用户消息并自动回复，可一键部署到 [Vercel](https://vercel.com)。

## 功能

- 微信服务器 URL 验证（GET）
- 接收文本、图片、语音、事件等消息（POST）
- 被动回复（同步返回 XML，5 秒内生效）
- 支持明文 / 兼容 / 安全三种消息加解密模式
- 预留客服消息 API（主动推送，48 小时内有效）

## 快速开始

### 1. 克隆并安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
cp .env.example .env.local
```

| 变量 | 说明 |
|------|------|
| `WECHAT_TOKEN` | 公众号后台「服务器配置」中自定义的 Token |
| `WECHAT_APP_ID` | 公众号 AppID |
| `WECHAT_APP_SECRET` | 公众号 AppSecret |
| `WECHAT_ENCODING_AES_KEY` | 43 位 EncodingAESKey（安全/兼容模式必填） |

### 3. 本地开发

```bash
npm run dev
```

本地调试需使用 [ngrok](https://ngrok.com) 等工具将 `http://localhost:3000/api/wechat` 暴露为 HTTPS 公网地址，微信只接受 HTTPS。

### 4. 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com/new) 导入项目
3. 在 Vercel 项目 Settings → Environment Variables 中添加上述环境变量
4. 部署完成后，服务器 URL 填写：`https://wereplay.vercel.app/api/wechat`

### 5. 微信公众号后台配置

路径：**设置与开发 → 基本配置 → 服务器配置**

| 配置项 | 值 |
|--------|-----|
| URL | `https://wereplay.vercel.app/api/wechat` |
| Token | 与 `WECHAT_TOKEN` 一致 |
| EncodingAESKey | 与 `WECHAT_ENCODING_AES_KEY` 一致（安全模式） |
| 消息加解密方式 | 推荐「安全模式」 |

> 配置前需先将公众号从「开发模式」切换并完成服务器验证。

## 自定义回复

编辑 `src/lib/wechat/handler.ts` 中的 `handleMessage` 函数：

```typescript
export async function handleMessage(message: WechatIncomingMessage): Promise<WechatReply> {
  if (message.MsgType === "text" && message.Content) {
    return { type: "text", content: `你说：${message.Content}` };
  }
  return null;
}
```

## 项目结构

```
src/
├── app/
│   ├── api/wechat/route.ts   # 微信服务器入口
│   └── page.tsx              # 说明页
└── lib/wechat/
    ├── access-token.ts       # access_token 与客服消息
    ├── config.ts             # 环境变量
    ├── crypto.ts             # 签名与加解密
    ├── handler.ts            # 消息处理逻辑（可自定义）
    ├── types.ts              # 类型定义
    └── xml.ts                # XML 解析与构建
```

## 注意事项

- 被动回复必须在 **5 秒** 内返回，否则用户收不到回复
- 如需耗时操作，先用被动回复返回「处理中」，再通过客服消息 API 异步推送
- Vercel Serverless 无持久内存，`access_token` 缓存仅在单次实例内有效；高流量场景建议使用 Vercel KV 或 Redis

## License

MIT
