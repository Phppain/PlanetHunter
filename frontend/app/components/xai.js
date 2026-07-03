"use client";
import { useEffect, useState, useTransition } from "react";

export default function Xai({ result, onClose }) {
    const [isPending, startTransition] = useTransition();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (!result) return null;

    const featureNames = {
        koi_kepmag: "Kepler-band [mag]",
        koi_teq: "Equilibrium Temperature [K]",
        koi_prad: "Planetary Radius [Earth radii]",
        koi_insol: "Insolation Flux [Earth flux]",
        koi_period: "Orbital Period [days]",
        koi_duration: "Transit Duration [hrs]",
        koi_steff: "Stellar Effective Temperature [K]",
        koi_slogg: "Stellar Surface Gravity [log10(cm/s**2)]",
        koi_srad: "Stellar Radius [Solar radii]",
        koi_fpflag_nt: "Not Transit-Like False Positive Flag",
        koi_fpflag_ss: "Stellar Eclipse False Positive Flag",
        koi_fpflag_co: "Centroid Offset False Positive Flag",
        koi_fpflag_ec:
            "Ephemeris Match Indicates Contamination False Positive Flag",
    };

    const earthValues = {
        koi_teq: 288, // Средняя температура Земли (К)
        koi_insol: 1, // Земля получает 1 "Earth flux"
        koi_prad: 1, // 1 радиус Земли
        koi_period: 365.25, // Орбитальный период, дней
        koi_duration: 13, // Примерная продолжительность транзита (ч)
        koi_steff: 5778, // Температура Солнца, K
        koi_srad: 1, // Радиус Солнца = 1
        koi_slogg: 4.44, // Средняя поверхностная гравитация Солнца
    };

    const planetInfo = result.planet_info || {};
    const fmt = (num) =>
        num !== undefined && !isNaN(num) ? num.toFixed(2) : "-";

    const calcDiff = (planetVal, earthVal) => {
        if (isNaN(planetVal) || isNaN(earthVal) || earthVal === 0) return "-";
        const diff = ((planetVal - earthVal) / earthVal) * 100;
        return `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;
    };

    if (!result) return null;

    // если данные еще "в пути"
    if (isPending)
        return (
            <div className="text-gray-400 p-4">
                ⏳ Загрузка XAI данных для KepID {result.kepid}...
            </div>
        );

    const xaiArray = Array.isArray(result.xai)
        ? result.xai
        : typeof result.xai === "string"
          ? result.xai.split(",").map((f) => ({ feature: f.trim(), value: "" }))
          : [];

    return (
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">
                        XAI для KepID: {result.kepid}
                    </h3>
                    <h2 className="text-gray-400 text-sm leading-relaxed font-semibold">
                        Explainable AI (XAI) — это подход, который делает
                        решения модели понятными для человека. Ниже показаны
                        признаки, которые больше всего повлияли на то, что
                        искусственный интеллект классифицировал объект как
                        возможную экзопланету. Вторая таблица сравнивает
                        физические параметры найденной планеты с параметрами
                        Земли, чтобы оценить её потенциальную схожесть с нашей
                        планетой.
                    </h2>
                </div>

                <button
                    onClick={() => {
                        startTransition(() => onClose());
                    }}
                    className="text-red-400 hover:text-red-300 transition"
                >
                    ✕ Закрыть
                </button>
            </div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-800 text-gray-300">
                        <th className="border px-2 py-1">Признак</th>
                        <th className="border px-2 py-1">Значение</th>
                    </tr>
                </thead>
                <tbody>
                    {xaiArray.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-800">
                            <td className="border px-2 py-1">
                                {featureNames[item.feature] || item.feature}
                            </td>
                            {/* <td className="border px-2 py-1">{item.feature}</td> */}
                            <td className="border px-2 py-1">{item.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-10">
                <h4 className="text-md mb-2 font-semibold text-gray-300">
                    Сравнение с Землёй
                </h4>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-800 text-gray-300">
                            <th className="border px-2 py-1">Характеристика</th>
                            <th className="border px-2 py-1">Планета</th>
                            <th className="border px-2 py-1">Земля</th>
                            <th className="border px-2 py-1">Разница</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(planetInfo).map((key) => (
                            <tr key={key} className="hover:bg-gray-800">
                                <td className="border px-2 py-1">
                                    {featureNames[key] || key}
                                </td>
                                <td className="border px-2 py-1">
                                    {fmt(planetInfo[key])}
                                </td>
                                <td className="border px-2 py-1">
                                    {fmt(earthValues[key])}
                                </td>
                                <td className="border px-2 py-1">
                                    {calcDiff(
                                        planetInfo[key],
                                        earthValues[key],
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
