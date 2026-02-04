export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";

  await fetch(`${process.env.ODOO_BASE_URL}/web/session/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ jsonrpc: "2.0", params: {} }),
  });

  return Response.json({ success: true });
}
