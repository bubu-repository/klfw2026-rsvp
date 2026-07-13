import { NextResponse, type NextRequest } from "next/server";

// Both domains point at this one deployment:
//   klfw.culturedbytodak.com      -> public page (/)
//   klfw-vip.culturedbytodak.com  -> VIP page (/vip), URL stays "/"
// Everything else (ticket, admin, api) is shared and works on either host.
export default function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("klfw-vip.")) {
    return NextResponse.rewrite(new URL("/vip", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
