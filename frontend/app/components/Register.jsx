"use client";
import { useState } from "react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({detail:"Ошибка"}));
        alert(err.detail || "Ошибка регистрации");
      } else {
        alert("Успешно! Теперь войдите.");
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="bg-gray-900 p-6 rounded-xl shadow-lg w-[360px]">
      <h2 className="text-2xl mb-4 font-semibold text-white">Регистрация</h2>
      <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Имя пользователя" className="w-full p-2 mb-3 rounded bg-gray-800 text-white"/>
      <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Пароль" type="password" className="w-full p-2 mb-4 rounded bg-gray-800 text-white"/>
      <button type="submit" disabled={loading} className="w-full py-2 rounded bg-green-600 hover:bg-green-700 text-white">
        {loading ? "Регистрирую..." : "Зарегистрироваться"}
      </button>
    </form>
  );
}