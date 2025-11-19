"use client";

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";

export default function Home() {
    const [topChannels, setTopChannels] = useState([]);
    const [daily, setDaily] = useState([]);
    const [category, setCategory] = useState([]);

    const formatNumber = (num: any) => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
        if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
        return num;
    };

    // Fetch data with fetch()
    useEffect(() => {
        fetch("http://localhost:8000/top-channels?limit=20")
            .then((res) => res.json())
            .then(setTopChannels);

        fetch("http://localhost:8000/daily-views")
            .then((res) => res.json())
            .then(setDaily);

        fetch("http://localhost:8000/category-engagement")
            .then((res) => res.json())
            .then(setCategory);
    }, []);

    const colors = [
        "#FF4444",
        "#FF6A6A",
        "#E50914",
        "#B20710",
        "#8A0000",
        "#FF4D4D",
    ];

    return (
        <div
            className="min-h-screen text-white p-10"
            style={{
                background:
                    "linear-gradient(135deg, #0a0a0a 0%, #130000 40%, #3a0000 100%)",
            }}
        >
            {/* HEADER */}
            <header className="mb-14 text-center">
                <h1 className="text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-red-300 to-red-700 drop-shadow-xl">
                    YouTube Statistics
                </h1>
                <p className="mt-3 text-lg text-gray-300">
                    Big Data Analytics Dashboard • Spark • Hadoop • FastAPI •
                    Next.js
                </p>
            </header>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* TOP CHANNELS */}
                <section className="backdrop-blur-lg bg-white/5 p-6 rounded-2xl border border-red-500/40 shadow-lg shadow-red-900/20 hover:shadow-red-600/40 transition-all">
                    <h2 className="text-3xl font-semibold mb-5 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                        🔥 Top Channels by Views
                    </h2>

                    <div className="w-full h-80 min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={topChannels}
                                margin={{
                                    top: 20,
                                    right: 35,
                                    left: 20,
                                    bottom: 20,
                                }}
                            >
                                <CartesianGrid stroke="#444" />
                                <XAxis
                                    dataKey="channel_title"
                                    tick={{ fill: "#ccc" }}
                                    hide
                                />
                                <YAxis
                                    tick={{ fill: "#ccc" }}
                                    tickFormatter={formatNumber}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a1a",
                                        border: "1px solid #444",
                                    }}
                                />
                                <Bar
                                    dataKey="total_views"
                                    fill="#ff2c2c"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* DAILY VIEWS TREND */}
                <section className="backdrop-blur-lg bg-white/5 p-6 rounded-2xl border border-purple-400/40 shadow-lg shadow-purple-900/20 hover:shadow-purple-700/40 transition-all">
                    <h2 className="text-3xl font-semibold mb-5 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        〰️ Daily Views Trend
                    </h2>

                    <div className="w-full h-80 min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={daily}
                                margin={{
                                    top: 20,
                                    right: 35,
                                    left: 20,
                                    bottom: 20,
                                }}
                            >
                                <CartesianGrid stroke="#444" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "#ccc" }}
                                    hide
                                />
                                <YAxis
                                    tick={{ fill: "#ccc" }}
                                    tickFormatter={formatNumber}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a1a",
                                        border: "1px solid #444",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="daily_views"
                                    stroke="#ff4d4d"
                                    strokeWidth={3}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* CATEGORY PIE */}
                <section className="col-span-1 lg:col-span-2 backdrop-blur-lg bg-white/5 p-8 rounded-2xl border border-blue-400/40 shadow-lg shadow-blue-900/20 hover:shadow-blue-700/40 transition-all">
                    <h2 className="text-3xl font-semibold mb-5 bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                        ✨ Category Engagement
                    </h2>

                    <div className="flex flex-col lg:flex-row items-center gap-10">
                        <div className="h-120 w-full min-h-120">
                            <ResponsiveContainer width={"100%"} height={"100%"}>
                                <PieChart>
                                    <Pie
                                        data={category}
                                        dataKey="avg_engagement"
                                        nameKey="category_id"
                                        outerRadius={"70%"}
                                        innerRadius={"40%"}
                                        paddingAngle={4}
                                        labelLine={false}
                                        label={({ percent }) => {
                                            // if (percent < 0.05) return "";
                                            return `${(percent * 100).toFixed(
                                                1
                                            )}%`;
                                        }}
                                    >
                                        {category.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={colors[i % colors.length]}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Category List */}
                        <div className="space-y-4 w-full lg:w-1/2">
                            {category.map((c, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between gap-2 bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition"
                                >
                                    <span className="text-gray-200">
                                        Category {c.category_id}
                                    </span>
                                    <span className="text-red-400 font-bold">
                                        {(c.avg_engagement * 100).toFixed(2)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
