"use client";
import { useState } from "react";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ login, password }),
    });

    if (res.ok) location.href = "/attendance";
    else alert("Sai tài khoản hoặc mật khẩu");
  };

  return (
    <div>
      <h2>Đăng nhập</h2>
      <input placeholder="Username" onChange={e => setLogin(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={submit}>Đăng nhập</button>
    </div>
  );
}
