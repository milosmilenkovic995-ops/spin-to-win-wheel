import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();
  const password = String(formData.get("password") || "");
  const adminPass = process.env.ADMIN_PASSWORD || "";

  if (!adminPass) {
    return NextResponse.redirect(new URL("/admin?error=no_password", req.url));
  }

  if (password !== adminPass) {
    return NextResponse.redirect(new URL("/admin?error=invalid", req.url));
  }

  const cookieStore = await cookies();
  cookieStore.set("znf_admin", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.redirect(new URL("/admin", req.url));
}
