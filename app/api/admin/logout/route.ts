import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("znf_admin");
  return NextResponse.redirect(new URL("/admin", req.url));
}
