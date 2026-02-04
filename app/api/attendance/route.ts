import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const body = await req.json();
    const { type, lat, lng } = body;

    // 1️⃣ Check session
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

    // 2️⃣ Find employee
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
            args: [[["user_id", "=", uid]]],
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

    // 3️⃣ Find open attendance today
    const openAttRes = await fetch(
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
            model: "hr.attendance",
            method: "search_read",
            args: [[
              ["employee_id", "=", employeeId],
              ["check_out", "=", false],
            ]],
            kwargs: {
              fields: ["id", "check_in"],
              limit: 1,
            },
          },
        }),
      }
    );

    const openAttData = await openAttRes.json();
    const openAttendance = openAttData.result?.[0];

    // 4️⃣ CHECK OUT
    if (openAttendance) {
      const writeRes = await fetch(
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
              model: "hr.attendance",
              method: "write",
              args: [[openAttendance.id], {
                check_out: new Date().toISOString(),
              }],
            },
          }),
        }
      );

      const writeData = await writeRes.json();
      if (writeData.error) throw writeData.error;

      return Response.json({
        success: true,
        action: "check_out",
      });
    }

    // 5️⃣ CHECK IN
    const createRes = await fetch(
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
            model: "hr.attendance",
            method: "create",
            args: [{
              employee_id: employeeId,
              check_in: new Date().toISOString(),
            }],
          },
        }),
      }
    );

    const createData = await createRes.json();
    if (createData.error) throw createData.error;

    return Response.json({
      success: true,
      action: "check_in",
    });

  } catch (err: any) {
    console.error("ATTENDANCE ERROR:", err);
    return new Response("Attendance error", { status: 500 });
  }
}
