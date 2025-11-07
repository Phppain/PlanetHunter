"use client";
import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveToken } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);

      const res = await fetch("http://localhost:8000/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });

      if (!res.ok) {
        const err = await res.json().catch(()=>({detail:"Ошибка"}));
        alert(err.detail || "Ошибка при логине");
        setLoading(false);
        return;
      }
      const data = await res.json();
      saveToken(data.access_token);
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="bg-gray-900 p-6 rounded-xl shadow-lg w-[360px]">
      <h2 className="text-2xl mb-4 font-semibold text-white">Войти</h2>
      <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Имя пользователя" className="w-full p-2 mb-3 rounded bg-gray-800 text-white"/>
      <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Пароль" type="password" className="w-full p-2 mb-4 rounded bg-gray-800 text-white"/>
      <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">
        {loading ? "Вхожу..." : "Войти"}
      </button>
    </form>
  );
}