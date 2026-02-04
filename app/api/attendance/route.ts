import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const body = await req.json();
    const { type, lat, lng } = body;

    // 1️⃣ Ping: chỉ kiểm tra session
    if (type === "ping") {
      const pingRes = await fetch(
        `${process.env.ODOO_BASE_URL}/web/session/get_session_info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookie,
          },
          body: JSON.stringify({ jsonrpc: "2.0", params: {} }),
        }
      );

      const pingData = await pingRes.json();
      if (!pingData.result?.uid) {
        return new Response("Unauthorized", { status: 401 });
      }

      return Response.json({ alive: true });
    }

    // 2️⃣ Get session (uid)
    const sessionRes = await fetch(
      `${process.env.ODOO_BASE_URL}/web/session/get_session_info`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({ jsonrpc: "2.0", params: {} }),
      }
    );

    const sessionData = await sessionRes.json();
    const uid = sessionData.result?.uid;

    if (!uid) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 3️⃣ Find employee by user_id (CHUẨN – KHÔNG LỖI MULTI-COMPANY)
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
              fields: ["id", "name"],
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

    const actionRes = await fetch(
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
        model: "hr.attendance",          // ✅ ĐÚNG MODEL
        method: "action_change",          // ✅ ĐÚNG METHOD
        args: [],                         // ✅ KHÔNG TRUYỀN employee ở args
        kwargs: {
          context: {
            employee_id: employeeId,     // ✅ TRUYỀN QUA CONTEXT
            login_lati: lat,
            login_longti: lng,
            logout_lati: lat,
            logout_longti: lng,
          },
        },
      },
    }),
  }
);

const actionData = await actionRes.json();

if (actionData.error) {
  console.error("ODOO ERROR:", actionData.error);
  return new Response(
    actionData.error.data?.message || "Odoo attendance error",
    { status: 400 }
  );
}
    // 5️⃣ Thành công thật sự (Odoo đã xử lý xong)
    return Response.json({
      success: true,
      employee: employee.name,
      result: actionData.result,
    });

  } catch (err: any) {
    console.error("ATTENDANCE API ERROR:", err);
    return new Response("Server error", { status: 500 });
  }
}
