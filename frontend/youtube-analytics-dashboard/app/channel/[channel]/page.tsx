// "use client";

// import { useParams } from "next/navigation";
// import { useEffect, useState } from "react";
// import {
//     LineChart,
//     Line,
//     XAxis,
//     YAxis,
//     Tooltip,
//     CartesianGrid,
//     ResponsiveContainer,
//     Legend,
// } from "recharts";

// export default function ChannelPage() {
//     const params = useParams<{ channel: string }>();
//     const { channel } = params;

//     const [history, setHistory] = useState(null);
//     const [forecast, setForecast] = useState(null);
//     const [combined, setCombined] = useState([]);
//     const [isForecastGenerating, setIsForecastGenerating] = useState(true);

//     const encoded = encodeURIComponent(channel);

//     // ---------------------------
//     // Fetch HISTORY immediately
//     // ---------------------------
//     useEffect(() => {
//         fetch(`http://localhost:8000/history/${encoded}`)
//             .then((r) => r.json())
//             .then((data) => {
//                 setHistory(data);
//             })
//             .catch(() => setHistory([]));
//     }, [channel]);

//     // ---------------------------
//     // Fetch FORECAST gradually
//     // Retry every 2 seconds if missing
//     // ---------------------------
//     useEffect(() => {
//         let interval = null;

//         async function tryLoadForecast() {
//             const res = await fetch(
//                 `http://localhost:8000/forecast/${encoded}`
//             );

//             if (res.status === 404) {
//                 // Forecast not generated yet
//                 setIsForecastGenerating(true);
//                 return;
//             }

//             const data = await res.json();
//             setForecast(data);
//             setIsForecastGenerating(false);
//         }

//         // Try immediately
//         tryLoadForecast();

//         // Then retry
//         interval = setInterval(tryLoadForecast, 2000);

//         return () => clearInterval(interval);
//     }, [channel]);

//     // ---------------------------
//     // Combine history + forecast
//     // ---------------------------
//     useEffect(() => {
//         if (!history) return;

//         const formattedHistory = history.map((d) => ({
//             date: d.date,
//             actual: d.daily_views,
//             predicted: null,
//         }));

//         const formattedForecast = forecast
//             ? forecast.map((d) => ({
//                   date: d.date,
//                   actual: null,
//                   predicted: d.predicted_views,
//               }))
//             : [];

//         setCombined([...formattedHistory, ...formattedForecast]);
//     }, [history, forecast]);

//     return (
//         <div className="min-h-screen p-10 text-white bg-gradient-to-br from-black via-[#0d0d0d] to-[#1a0000]">
//             <h1 className="text-4xl font-bold mb-8 text-red-500">
//                 Forecast for {decodeURIComponent(channel)}
//             </h1>

//             {/* ------------- HISTORY SECTION ------------- */}
//             <div className="bg-[#1a1a1a] p-6 rounded-xl border border-red-700/30 shadow-lg mb-10">
//                 <h2 className="text-2xl mb-4">Historical Views</h2>

//                 {history === null ? (
//                     <div className="animate-pulse text-gray-400">
//                         Loading history...
//                     </div>
//                 ) : (
//                     <div className="w-full h-[350px]">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <LineChart data={history}>
//                                 <CartesianGrid stroke="#333" />
//                                 <XAxis dataKey="date" tick={{ fill: "#bbb" }} />
//                                 <YAxis tick={{ fill: "#bbb" }} />
//                                 <Tooltip
//                                     contentStyle={{
//                                         background: "#1a1a1a",
//                                         border: "1px solid #444",
//                                     }}
//                                     labelStyle={{ color: "#fff" }}
//                                 />
//                                 <Legend />
//                                 <Line
//                                     type="monotone"
//                                     dataKey="daily_views"
//                                     name="Actual Views"
//                                     stroke="#ff4444"
//                                     strokeWidth={3}
//                                     dot={false}
//                                 />
//                             </LineChart>
//                         </ResponsiveContainer>
//                     </div>
//                 )}
//             </div>

//             {/* ------------- FORECAST SECTION ------------- */}
//             <div className="bg-[#1a1a1a] p-6 rounded-xl border border-red-700/30 shadow-lg mb-10">
//                 <h2 className="text-2xl mb-4">Forecast (Predicted Views)</h2>

//                 {isForecastGenerating ? (
//                     <div className="animate-pulse text-gray-400">
//                         Generating forecast using Spark MLlib...
//                     </div>
//                 ) : (
//                     <div className="w-full h-[350px]">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <LineChart data={forecast}>
//                                 <CartesianGrid stroke="#333" />
//                                 <XAxis dataKey="date" tick={{ fill: "#bbb" }} />
//                                 <YAxis tick={{ fill: "#bbb" }} />
//                                 <Tooltip
//                                     contentStyle={{
//                                         background: "#1a1a1a",
//                                         border: "1px solid #444",
//                                     }}
//                                     labelStyle={{ color: "#fff" }}
//                                 />
//                                 <Legend />
//                                 <Line
//                                     type="monotone"
//                                     dataKey="predicted_views"
//                                     name="Predicted Views"
//                                     stroke="#00c3ff"
//                                     strokeWidth={3}
//                                     strokeDasharray="5 5"
//                                     dot={false}
//                                 />
//                             </LineChart>
//                         </ResponsiveContainer>
//                     </div>
//                 )}
//             </div>

//             {/* ------------- COMBINED CHART ------------- */}
//             {forecast && (
//                 <div className="bg-[#1a1a1a] p-6 rounded-xl border border-red-700/30 shadow-lg">
//                     <h2 className="text-2xl mb-4">
//                         Combined (Actual + Predicted)
//                     </h2>
//                     <div className="w-full h-[400px]">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <LineChart data={combined}>
//                                 <CartesianGrid stroke="#333" />
//                                 <XAxis dataKey="date" tick={{ fill: "#bbb" }} />
//                                 <YAxis tick={{ fill: "#bbb" }} />
//                                 <Tooltip
//                                     contentStyle={{
//                                         background: "#1a1a1a",
//                                         border: "1px solid #444",
//                                     }}
//                                     labelStyle={{ color: "#fff" }}
//                                 />
//                                 <Legend />

//                                 <Line
//                                     type="monotone"
//                                     dataKey="actual"
//                                     name="Actual Views"
//                                     stroke="#ff4444"
//                                     strokeWidth={3}
//                                     dot={false}
//                                 />

//                                 <Line
//                                     type="monotone"
//                                     dataKey="predicted"
//                                     name="Predicted Views"
//                                     stroke="#00c3ff"
//                                     strokeWidth={3}
//                                     strokeDasharray="5 5"
//                                     dot={false}
//                                 />
//                             </LineChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
} from "recharts";

// ----------------------
// Type definitions
// ----------------------

interface HistoryPoint {
    date: string;
    daily_views: number;
}

interface ForecastPoint {
    date: string;
    predicted_views: number;
}

interface CombinedPoint {
    date: string;
    actual: number | null;
    predicted: number | null;
}

// ----------------------
// Component
// ----------------------

export default function ChannelPage() {
    const params = useParams<{ channel: string }>();
    const channel = params.channel;

    const [history, setHistory] = useState<HistoryPoint[] | null>(null);
    const [forecast, setForecast] = useState<ForecastPoint[] | null>(null);
    const [combined, setCombined] = useState<CombinedPoint[]>([]);
    const [isForecastGenerating, setIsForecastGenerating] =
        useState<boolean>(true);

    const encoded = encodeURIComponent(channel);

    // ---------------------------
    // 1. Fetch HISTORY immediately
    // ---------------------------
    useEffect(() => {
        async function loadHistory() {
            try {
                const res = await fetch(
                    `http://localhost:8000/history/${encoded}`
                );
                if (!res.ok) {
                    setHistory([]);
                    return;
                }
                const data: HistoryPoint[] = await res.json();
                setHistory(Array.isArray(data) ? data : []);
            } catch {
                setHistory([]);
            }
        }
        loadHistory();
    }, [encoded]);

    // ---------------------------
    // 2. Fetch FORECAST gradually until loaded
    // ---------------------------
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        async function tryLoadForecast() {
            try {
                const res = await fetch(
                    `http://localhost:8000/forecast/${encoded}`
                );

                // 404 = forecast not generated yet
                if (res.status === 404) {
                    setIsForecastGenerating(true);
                    return;
                }

                const data: ForecastPoint[] = await res.json();

                if (Array.isArray(data) && data.length > 0) {
                    setForecast(data);
                    setIsForecastGenerating(false);

                    // STOP polling once data is available
                    if (interval) clearInterval(interval);
                }
            } catch {
                // ignore errors until forecast exists
            }
        }

        // Call once immediately
        tryLoadForecast();

        // Setup retry every 2 seconds
        interval = setInterval(tryLoadForecast, 2000);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [encoded]);

    // ---------------------------
    // 3. Combine history + forecast
    // ---------------------------
    useEffect(() => {
        if (!history) return;

        const formattedHistory: CombinedPoint[] = history.map((d) => ({
            date: d.date,
            actual: d.daily_views,
            predicted: null,
        }));

        const formattedForecast: CombinedPoint[] =
            forecast?.map((d) => ({
                date: d.date,
                actual: null,
                predicted: d.predicted_views,
            })) ?? [];

        setCombined([...formattedHistory, ...formattedForecast]);
    }, [history, forecast]);

    return (
        <div className="min-h-screen p-10 text-white bg-gradient-to-br from-black via-[#0d0d0d] to-[#1a0000]">
            <h1 className="text-4xl font-bold mb-8 text-red-500">
                Forecast for {decodeURIComponent(channel)}
            </h1>

            {/* ---------------------- HISTORY ---------------------- */}
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-red-700/30 shadow-lg mb-10">
                <h2 className="text-2xl mb-4">Historical Views</h2>

                {history === null ? (
                    <div className="animate-pulse text-gray-400">
                        Loading history...
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-gray-400">
                        No historical data found.
                    </div>
                ) : (
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid stroke="#333" />
                                <XAxis dataKey="date" tick={{ fill: "#bbb" }} />
                                <YAxis tick={{ fill: "#bbb" }} />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a1a",
                                        border: "1px solid #444",
                                    }}
                                    labelStyle={{ color: "#fff" }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="daily_views"
                                    name="Actual Views"
                                    stroke="#ff4444"
                                    strokeWidth={3}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* ---------------------- FORECAST ---------------------- */}
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-red-700/30 shadow-lg mb-10">
                <h2 className="text-2xl mb-4">Forecast (Predicted Views)</h2>

                {isForecastGenerating ? (
                    <div className="animate-pulse text-gray-400">
                        Generating forecast using Spark MLlib...
                    </div>
                ) : !forecast ? (
                    <div className="text-gray-400">No forecast generated.</div>
                ) : (
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecast}>
                                <CartesianGrid stroke="#333" />
                                <XAxis dataKey="date" tick={{ fill: "#bbb" }} />
                                <YAxis tick={{ fill: "#bbb" }} />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a1a",
                                        border: "1px solid #444",
                                    }}
                                    labelStyle={{ color: "#fff" }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="predicted_views"
                                    name="Predicted Views"
                                    stroke="#00c3ff"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* ---------------------- COMBINED ---------------------- */}
            {forecast && (
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-red-700/30 shadow-lg">
                    <h2 className="text-2xl mb-4">
                        Combined (Actual + Predicted)
                    </h2>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={combined}>
                                <CartesianGrid stroke="#333" />
                                <XAxis dataKey="date" tick={{ fill: "#bbb" }} />
                                <YAxis tick={{ fill: "#bbb" }} />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a1a",
                                        border: "1px solid #444",
                                    }}
                                    labelStyle={{ color: "#fff" }}
                                />
                                <Legend />

                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    name="Actual Views"
                                    stroke="#ff4444"
                                    strokeWidth={3}
                                    dot={false}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="predicted"
                                    name="Predicted Views"
                                    stroke="#00c3ff"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
