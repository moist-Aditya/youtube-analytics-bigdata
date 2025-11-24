"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
    open: boolean;
    onClose: () => void;
}

interface ChannelItem {
    channel_title: string;
}

export default function SearchModal({ open, onClose }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ChannelItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (query.trim().length === 0) {
            setResults([]);
            return;
        }

        const delay = setTimeout(async () => {
            try {
                const res = await fetch(
                    `http://localhost:8000/search-channels?q=${encodeURIComponent(
                        query
                    )}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch {
                setResults([]);
            }
        }, 200);

        return () => clearTimeout(delay);
    }, [query]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-32 z-50">
            <div className="bg-[#1c1c1c] rounded-xl shadow-xl border border-red-900/40 w-[90%] max-w-xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    ✕
                </button>

                <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a YouTube channel..."
                    className="w-full bg-[#111] border border-red-800/40 p-3 rounded-lg text-white focus:outline-none focus:border-red-500"
                />

                <div className="mt-4 max-h-60 overflow-y-auto">
                    {results.length > 0 ? (
                        results.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    router.push(
                                        `/channel/${encodeURIComponent(
                                            item.channel_title
                                        )}`
                                    );
                                    onClose();
                                }}
                                className="p-3 cursor-pointer rounded-lg hover:bg-red-900/20 text-gray-200"
                            >
                                {item.channel_title}
                            </div>
                        ))
                    ) : query.length > 0 ? (
                        <div className="text-gray-500 p-3">
                            No results found.
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
