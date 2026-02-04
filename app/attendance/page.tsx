"use client";

export default function AttendancePage() {
  const punch = (type: "checkin" | "checkout") => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        console.log("GPS:", pos.coords.latitude, pos.coords.longitude);

        const res = await fetch("/api/attendance", {
          method: "POST",
          credentials: "include", // ⭐ BẮT BUỘC
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        });

        console.log("ATTENDANCE STATUS:", res.status);

        if (res.ok) {
          alert(type === "checkin" ? "Check-in thành công" : "Check-out thành công");
        } else {
          const txt = await res.text();
          alert("Lỗi chấm công: " + txt);
        }
      },
      (err) => {
        alert("Không lấy được GPS: " + err.message);
      }
    );
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Chấm công</h1>

      <button onClick={() => punch("checkin")}>
        ✅ Check In
      </button>

      <br /><br />

      <button onClick={() => punch("checkout")}>
        ⛔ Check Out
      </button>
    </main>
  );
}
