"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: "ping" }),
        });

        if (res.status === 401) {
          window.location.href = "/login";
        } else {
          window.location.href = "/attendance";
        }
      } catch (err) {
        window.location.href = "/login";
      }
    };

    checkSession();
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <p>Đang kiểm tra đăng nhập...</p>
    </main>
  );
}
