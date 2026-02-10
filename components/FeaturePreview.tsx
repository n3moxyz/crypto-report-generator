export default function FeaturePreview() {
  return (
    <section className="mb-6">
      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Market Bullets */}
        <div className="data-cell">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="font-semibold text-primary" style={{ fontSize: "var(--text-sm)" }}>
              Market Bullets
            </span>
          </div>
          <p className="text-secondary" style={{ fontSize: "var(--text-xs)", lineHeight: 1.5 }}>
            Key events from the last 24-48h with expandable AI analysis
          </p>
        </div>

        {/* Follow-Up Chat */}
        <div className="data-cell">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-semibold text-primary" style={{ fontSize: "var(--text-sm)" }}>
              Follow-Up Chat
            </span>
          </div>
          <p className="text-secondary" style={{ fontSize: "var(--text-xs)", lineHeight: 1.5 }}>
            Ask questions about any point to dig deeper into the data
          </p>
        </div>

        {/* Top Movers */}
        <div className="data-cell">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-semibold text-primary" style={{ fontSize: "var(--text-sm)" }}>
              Top Movers
            </span>
          </div>
          <p className="text-secondary" style={{ fontSize: "var(--text-xs)", lineHeight: 1.5 }}>
            Biggest gainers and losers across the top 50-300 coins
          </p>
        </div>
      </div>

      {/* Mock Preview */}
      <div className="card p-4 relative max-h-[180px] overflow-hidden">
        {/* Sample sentiment pill */}
        <div className="flex items-center gap-2 mb-3">
          <span className="pill pill-up" style={{ opacity: 0.6 }}>Bullish</span>
          <span className="text-muted" style={{ fontSize: "var(--text-xs)", opacity: 0.5 }}>
            Sample preview
          </span>
        </div>

        {/* Sample bullet points */}
        <ul className="space-y-2" style={{ opacity: 0.6 }}>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5" style={{ fontSize: "var(--text-xs)" }}>•</span>
            <span className="text-secondary" style={{ fontSize: "var(--text-sm)" }}>
              BTC holding above key support levels as institutional inflows continue through spot ETFs
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5" style={{ fontSize: "var(--text-xs)" }}>•</span>
            <span className="text-secondary" style={{ fontSize: "var(--text-sm)" }}>
              DeFi TVL rising across major L2s with several protocols hitting new all-time highs
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5" style={{ fontSize: "var(--text-xs)" }}>•</span>
            <span className="text-secondary" style={{ fontSize: "var(--text-sm)" }}>
              Market sentiment shifting as macro data signals potential rate adjustments ahead
            </span>
          </li>
        </ul>

        {/* Gradient fade overlay */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--bg-primary))",
          }}
        />
      </div>
    </section>
  );
}
