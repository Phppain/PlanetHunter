"use client";
import { useState } from "react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Input from "./components/Input";
import ResultList from "./components/resultlist";

function AppInner() {
  const { token, logout } = useAuth();
  const [results, setResults] = useState(null);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-8 p-6 bg-gradient-to-b from-gray-900 to-gray-800">
        <Login />
        <Register />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Exoplanet Detector</h1>
        <div>
          <button onClick={logout} className="bg-red-600 px-3 py-1 rounded">Выйти</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="p-6 bg-gray-800 rounded-xl shadow">
          <Input onResultsUpdate={setResults} />
        </div>

        <div className="p-6 bg-gray-800 rounded-xl shadow">
          <ResultList results={results} />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}