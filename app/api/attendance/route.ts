import { NextRequest } from "next/server";

/**
 * Helper: gọi Odoo call_kw (LUÔN có kwargs)
 */
async function callKw(
  cookie: string,
  model: string,
  method: string,
  args: any[],
  kwargs: any = {}
) {
  const res = await fetch(
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
          model,
          method,
          args,
          kwargs, // 🔴 BẮT BUỘC
        },
      }),
    }
  );

  const data = await res.json();
  if (data.error) {
    throw data.error;
  }
  return data.result;
}

/**
 * Helper: lấy thời gian theo local timezone (Odoo 15 rất cần)
 */
function getLocalDateTime() {
  const now = new Date();
  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

export async function POST(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const body = await req.json();
    const { type, lat, lng } = body;

    /**
     * 1️⃣ Ping – chỉ check session
     */
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

    /**
     * 2️⃣ Lấy session (uid, company)
     */
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
    const companyId = sessionData.result?.company_id;

    if (!uid) {
      return new Response("Unauthorized", { status: 401 });
    }

    /**
     * 3️⃣ Tìm employee theo user_id (KHÔNG LỖI MULTI-COMPANY)
     */
    const employees = await callKw(
      cookie,
      "hr.employee",
      "search_read",
      [[["user_id", "=", uid], ["active", "=", true]]],
      {
        fields: ["id", "name"],
        limit: 1,
      }
    );

    const employee = employees?.[0];
    if (!employee) {
      return new Response("No employee", { status: 400 });
    }

    const employeeId = employee.id;

    /**
     * 4️⃣ Tìm attendance đang mở (chưa check_out)
     */
    const openAttendances = await callKw(
      cookie,
      "hr.attendance",
      "search_read",
      [[
        ["employee_id", "=", employeeId],
        ["check_out", "=", false],
      ]],
      {
        fields: ["id", "check_in"],
        limit: 1,
      }
    );

    const now = getLocalDateTime();

    /**
     * 5️⃣ CHECK OUT (nếu đang mở)
     */
    if (openAttendances.length) {
      await callKw(
        cookie,
        "hr.attendance",
        "write",
        [[openAttendances[0].id], {
          check_out: now,
        }],
        {}
      );

      return Response.json({
        success: true,
        action: "check_out",
        employee: employee.name,
        time: now,
      });
    }

    /**
     * 6️⃣ CHECK IN (nếu chưa có attendance mở)
     */
    await callKw(
      cookie,
      "hr.attendance",
      "create",
      [{
        employee_id: employeeId,
        check_in: now,
        company_id: companyId, // 🔴 BẮT BUỘC cho Odoo 15 Community
      }],
      {}
    );

    return Response.json({
      success: true,
      action: "check_in",
      employee: employee.name,
      time: now,
    });

  } catch (err: any) {
    console.error("ATTENDANCE ERROR RAW:", err);
    return new Response(
      JSON.stringify(err, null, 2),
      { status: 500 }
    );
  }
}
