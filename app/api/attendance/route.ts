export async function POST(req: Request) {
  
  const cookie = req.headers.get("cookie") ?? "";
  const { type, lat, lng } = await req.json();
  console.log("COOKIE FROM BROWSER:", req.headers.get("cookie"));

  // Get session
  const session = await fetch(
    `${process.env.ODOO_BASE_URL}/web/session/get_session_info`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ jsonrpc: "2.0", params: {} }),
    }
  ).then(r => r.json());

  const uid = session.result?.uid;
  if (!uid) return new Response("Unauthorized", { status: 401 });

  // Get employee_id
  const user = await fetch(
    `${process.env.ODOO_BASE_URL}/web/dataset/call_kw`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        jsonrpc: "2.0",
        params: {
          model: "res.users",
          method: "read",
          args: [[uid], ["employee_id"]],
        },
      }),
    }
  ).then(r => r.json());

  const employeeId = user.result?.[0]?.employee_id?.[0];
  if (!employeeId) return new Response("No employee", { status: 400 });

  if (type === "checkin") {
    await fetch(`${process.env.ODOO_BASE_URL}/web/dataset/call_kw`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        jsonrpc: "2.0",
        params: {
          model: "hr.attendance",
          method: "create",
          args: [{ employee_id: employeeId, login_lati: lat, login_longti: lng }],
        },
      }),
    });
  }

  if (type === "checkout") {
    const att = await fetch(
      `${process.env.ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          jsonrpc: "2.0",
          params: {
            model: "hr.attendance",
            method: "search_read",
            args: [[
              ["employee_id", "=", employeeId],
              ["check_out", "=", false],
            ]],
            kwargs: { fields: ["id"], limit: 1 },
          },
        }),
      }
    ).then(r => r.json());

    const attId = att.result?.[0]?.id;
    if (attId) {
      await fetch(`${process.env.ODOO_BASE_URL}/web/dataset/call_kw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          jsonrpc: "2.0",
          params: {
            model: "hr.attendance",
            method: "write",
            args: [[attId], { logout_lati: lat, logout_longti: lng }],
          },
        }),
      });
    }
  }

  return Response.json({ success: true });
}
