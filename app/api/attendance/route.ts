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
  const empRes = await fetch(
  `${process.env.ODOO_BASE_URL}/web/dataset/call_kw`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      params: {
        model: "hr.employee",
        method: "search_read",
        args: [[
          ["user_id", "=", uid],
          ["active", "=", true],
        ]],
        kwargs: {
          fields: ["id", "name", "company_id"],
          limit: 1,
        },
      },
    }),
  }
);

const empData = await empRes.json();
const employee = empData.result?.[0];

if (!employee) {
  return new Response("No employee", { status: 400 });
}

const employeeId = employee.id;

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
