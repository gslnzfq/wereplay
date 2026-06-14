import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/wechat") {
    console.info("[wechat middleware]", {
      method: request.method,
      hasSignature: request.nextUrl.searchParams.has("signature"),
      hasMsgSignature: request.nextUrl.searchParams.has("msg_signature"),
      userAgent: request.headers.get("user-agent")?.slice(0, 40),
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/wechat",
};
