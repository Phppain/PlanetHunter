"use client";
import { useState } from "react";
import Xai from "./xai";

export default function ResultList({ results = [] }) {
    const [selected, setSelected] = useState(null);

    const data = results?.data || [];
    const total = data.length;
    const total_objects = results?.total_objects || 0;
    const detected = results?.detected_planets || data.length;          

    const handleRowClick = (result) => {
        console.log("Клик по:", result);
        setSelected(result);
      };
    console.log(data);
    return (
        <div className="flex flex-col gap-4 text-white">
            <h1 className="text-2xl font-bold">Результаты</h1>
            <h1>Всего экзопланет найдено: {total > 0 && <span className="text-gray-400 text-lg">({total})</span>} из {<span className="text-gray-400 text-lg">({total_objects})</span>}</h1>
            <div className="overflow-x-auto">
                <div className="flex flex-row gap-50">
                    <table className="w-[500px] border-collapse border border-gray-600">
                        <thead>
                            <tr className="bg-gray-700">
                                <th className="border border-gray-600 px-4 py-2 text-left">ID</th>
                                <th className="border border-gray-600 px-4 py-2">KepID</th>
                                <th className="border border-gray-600 px-4 py-2 text-left">Вероятность</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((result, index) => (
                                <tr key={index} className="hover:bg-gray-600" onClick={() => handleRowClick(result)}>
                                    <td className="border border-gray-600 px-4 py-2">{result.id}</td>
                                    <td className="border border-gray-600 px-4 py-2">{result.kepid}</td>
                                    <td className="border border-gray-600 px-4 py-2">{(result.procent * 100).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {selected && (
                        <div className="mt-6">
                        <Xai result={selected} onClose={() => setSelected(null)} />
                        </div>
                    )}
                </div>
                    
                </div>
            
            {data.length > 0 ? (
                <div></div>
            ) : (
                <p className="text-gray-400">Нет данных для отображения</p>
                
            )}
        </div>
    )
}