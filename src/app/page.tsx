import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "微信公众号后台 | wx-chat",
  description: "基于 Next.js 的微信公众号消息接收与自动回复服务",
};

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-50 px-6 py-16 font-sans text-zinc-900">
      <main className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">微信公众号后台</h1>
        <p className="mt-3 text-lg leading-8 text-zinc-600">
          基于 Next.js，部署在 Vercel 上，接收用户消息并自动回复。
        </p>

        <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">服务器地址</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            在微信公众号后台填写以下 URL（将域名替换为你的 Vercel 部署地址）：
          </p>
          <code className="mt-4 block overflow-x-auto rounded-lg bg-zinc-100 px-4 py-3 text-sm">
            https://your-domain.vercel.app/api/wechat
          </code>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">环境变量</h2>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-zinc-600">
            <li>
              <code className="rounded bg-zinc-100 px-1">WECHAT_TOKEN</code> — 服务器配置 Token
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1">WECHAT_APP_ID</code> — 公众号 AppID
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1">WECHAT_APP_SECRET</code> — 公众号 AppSecret
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1">WECHAT_ENCODING_AES_KEY</code> — 安全/兼容模式密钥（可选）
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">自定义回复逻辑</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            编辑{" "}
            <code className="rounded bg-zinc-100 px-1">src/lib/wechat/handler.ts</code>{" "}
            中的 <code className="rounded bg-zinc-100 px-1">handleMessage</code>{" "}
            函数即可修改自动回复内容。
          </p>
        </section>
      </main>
    </div>
  );
}
