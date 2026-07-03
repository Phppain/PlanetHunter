"use client";
import { useState } from "react";
import Input from "./components/Input";
import ResultList from "./components/resultlist";

function AppInner() {
  const [results, setResults] = useState(null);


  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Exoplanet Detector</h1>
        <div>
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
      <AppInner />
  );
}