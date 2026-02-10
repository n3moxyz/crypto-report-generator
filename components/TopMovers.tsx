"use client";

import { useState } from "react";
import type { TieredTopMovers, TopMoverTier } from "@/components/WhatsUpDisplay";

const TIER_OPTIONS: { value: TopMoverTier; label: string }[] = [
  { value: "top50", label: "Top 50" },
  { value: "top100", label: "Top 100" },
  { value: "top200", label: "Top 200" },
  { value: "top300", label: "Top 300" },
];

function formatPrice(price: number) {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

interface TopMoversProps {
  topMovers: TieredTopMovers;
}

export default function TopMovers({ topMovers }: TopMoversProps) {
  const [selectedTier, setSelectedTier] = useState<TopMoverTier>("top100");

  return (
    <div>
      {/* Tier Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted" style={{ fontSize: "var(--text-xs)" }}>Show movers from:</span>
        <div className="flex gap-1 overflow-x-auto">
          {TIER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedTier(option.value)}
              className={`px-2 py-1 rounded transition-colors flex-shrink-0 ${
                selectedTier === option.value
                  ? "bg-[var(--accent)] text-white"
                  : "bg-tertiary text-secondary hover:bg-hover"
              }`}
              style={{ fontSize: "var(--text-xs)" }}
              aria-label={`Show movers from ${option.label}`}
              aria-pressed={selectedTier === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gainers */}
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "var(--success-bg)", border: "1px solid var(--success)" }}
        >
          <div className="mb-3" style={{ fontSize: "var(--text-xs)", color: "var(--success)", fontWeight: 700, letterSpacing: "0.05em" }}>
            TOP GAINERS (24H)
          </div>
          <div className="space-y-2.5">
            {(topMovers[selectedTier]?.gainers || []).slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted" style={{ fontSize: "var(--text-xs)", width: "16px" }}>
                    {index + 1}.
                  </span>
                  <span className="font-medium" style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                    {item.symbol}
                  </span>
                  <span className="text-muted font-mono" style={{ fontSize: "var(--text-xs)" }}>
                    {formatPrice(item.price)}
                  </span>
                </div>
                <span className="font-mono font-semibold" style={{ fontSize: "var(--text-sm)", color: "var(--success)" }}>
                  {item.change}
                </span>
              </div>
            ))}
            {(topMovers[selectedTier]?.gainers || []).length === 0 && (
              <span className="text-muted" style={{ fontSize: "var(--text-xs)" }}>No gainers</span>
            )}
          </div>
        </div>

        {/* Losers */}
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger)" }}
        >
          <div className="mb-3" style={{ fontSize: "var(--text-xs)", color: "var(--danger)", fontWeight: 700, letterSpacing: "0.05em" }}>
            TOP LOSERS (24H)
          </div>
          <div className="space-y-2.5">
            {(topMovers[selectedTier]?.losers || []).slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted" style={{ fontSize: "var(--text-xs)", width: "16px" }}>
                    {index + 1}.
                  </span>
                  <span className="font-medium" style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                    {item.symbol}
                  </span>
                  <span className="text-muted font-mono" style={{ fontSize: "var(--text-xs)" }}>
                    {formatPrice(item.price)}
                  </span>
                </div>
                <span className="font-mono font-semibold" style={{ fontSize: "var(--text-sm)", color: "var(--danger)" }}>
                  {item.change}
                </span>
              </div>
            ))}
            {(topMovers[selectedTier]?.losers || []).length === 0 && (
              <span className="text-muted" style={{ fontSize: "var(--text-xs)" }}>No losers</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
