"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className="relative w-[90%] max-w-xl bg-[#1c1c1c] rounded-2xl shadow-2xl border border-red-900/40 p-8">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition"
                >
                    <X className="w-6 h-6 text-gray-300 hover:text-white" />
                </button>

                {/* Title */}
                <div className="flex items-center gap-3 mb-6">
                    <Search className="w-6 h-6 text-red-500" />
                    <h2 className="text-2xl font-semibold text-white">
                        Search Channels
                    </h2>
                </div>

                {/* Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type channel name..."
                        className="w-full bg-[#111] border border-red-800/40 pl-12 p-3 rounded-lg text-white focus:outline-none focus:border-red-500 transition shadow-md"
                    />
                </div>

                {/* Results */}
                <div className="mt-5 max-h-64 overflow-y-auto space-y-1">
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
                                className="p-3 cursor-pointer rounded-lg bg-[#181818] hover:bg-red-900/30 text-gray-200 transition"
                            >
                                {item.channel_title}
                            </div>
                        ))
                    ) : query.length > 0 ? (
                        <div className="text-gray-500 text-center p-3">
                            No results found.
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center p-3 opacity-70">
                            Start typing to search...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
