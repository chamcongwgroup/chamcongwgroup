import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { login, password } = await req.json();

  const res = await fetch(
    `${process.env.ODOO_BASE_URL}/web/session/authenticate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        params: {
          db: process.env.ODOO_DB,
          login,
          password,
        },
      }),
    }
  );

  const data = await res.json();
  const cookie = res.headers.get("set-cookie");

  if (!data.result?.uid) {
    return NextResponse.json({ error: "Login failed" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  if (cookie) response.headers.set("Set-Cookie", cookie);

  return response;
}
