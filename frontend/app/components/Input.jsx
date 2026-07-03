"use client";

import { useState } from "react";


export default function Input({ onResultsUpdate }) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            setSelectedFile(file);
        } else {
            alert('Пожалуйста, выберите файл формата .csv');
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            alert('Пожалуйста, выберите файл');
            return;
        }
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('http://localhost:8000/analyze/', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const results = await response.json();
                onResultsUpdate(results);
            } else {
                const err = await response.json().catch(()=>({detail:"Ошибка"}));
                alert(err.detail || 'Ошибка при загрузке файла');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при загрузке файла');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 items-center">
            <label className="text-xl font-bold mb-3 text-white" htmlFor="file">Вставьте файл формата .csv</label>
            <input 
                className="bg-gray-800 p-3 rounded-md text-center text-white border border-gray-700" 
                type="file" 
                name="file" 
                id="file"
                accept=".csv"
                onChange={handleFileChange}
            />
            {selectedFile && (
                <p className="text-sm text-gray-300">Выбран файл: {selectedFile.name}</p>
            )}
            <button
                onClick={handleSubmit}
                disabled={!selectedFile || isLoading}
                className={`px-6 py-2 rounded-md font-medium ${
                    !selectedFile || isLoading
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                } text-white`}
            >
                {isLoading ? 'Загрузка...' : 'Отправить файл'}
            </button>
        </div>
    )
}