import { fetchSpecificCoins, CoinData } from "./coingecko";
import { fetchCryptoIntelFromGrok, GrokCryptoIntel } from "./grok";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

export interface WhatsUpData {
  bullets: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  topMovers: {
    gainers: Array<{ symbol: string; change: string }>;
    losers: Array<{ symbol: string; change: string }>;
  };
}

// Format prices as requested
function formatBtcPrice(price: number): string {
  const rounded = Math.round(price / 1000);
  return `$${rounded}k`;
}

function formatEthPrice(price: number): string {
  const rounded = Math.round(price / 100) / 10;
  return `$${rounded}k`;
}

function formatSolPrice(price: number): string {
  const rounded = Math.round(price / 10) * 10;
  return `$${rounded}`;
}

function formatOtherPrice(price: number): string {
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}k`;
  } else if (price >= 1) {
    return `$${price.toFixed(0)}`;
  } else {
    return `$${price.toFixed(2)}`;
  }
}


export async function generateWhatsUp(): Promise<WhatsUpData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  // Fetch real prices and Grok intelligence in parallel
  const [coins, grokIntel] = await Promise.all([
    fetchSpecificCoins(),
    fetchCryptoIntelFromGrok()
  ]);

  // Sort by 24h change to get real top movers
  const sortedByChange = [...coins].sort(
    (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
  );

  const gainers = sortedByChange
    .filter(c => c.price_change_percentage_24h > 0)
    .slice(0, 3)
    .map(c => ({
      symbol: c.symbol.toUpperCase(),
      change: `+${c.price_change_percentage_24h.toFixed(1)}%`
    }));

  const losers = sortedByChange
    .filter(c => c.price_change_percentage_24h < 0)
    .slice(-3)
    .reverse()
    .map(c => ({
      symbol: c.symbol.toUpperCase(),
      change: `${c.price_change_percentage_24h.toFixed(1)}%`
    }));

  // Format price data with proper rounding
  const btc = coins.find(c => c.symbol === "btc");
  const eth = coins.find(c => c.symbol === "eth");
  const sol = coins.find(c => c.symbol === "sol");
  const bnb = coins.find(c => c.symbol === "bnb");
  const xrp = coins.find(c => c.symbol === "xrp");

  const priceLines: string[] = [];
  if (btc) priceLines.push(`BTC: ${formatBtcPrice(btc.current_price)} (24h: ${btc.price_change_percentage_24h >= 0 ? '+' : ''}${btc.price_change_percentage_24h.toFixed(1)}%)`);
  if (eth) priceLines.push(`ETH: ${formatEthPrice(eth.current_price)} (24h: ${eth.price_change_percentage_24h >= 0 ? '+' : ''}${eth.price_change_percentage_24h.toFixed(1)}%)`);
  if (sol) priceLines.push(`SOL: ${formatSolPrice(sol.current_price)} (24h: ${sol.price_change_percentage_24h >= 0 ? '+' : ''}${sol.price_change_percentage_24h.toFixed(1)}%)`);
  if (bnb) priceLines.push(`BNB: ${formatOtherPrice(bnb.current_price)} (24h: ${bnb.price_change_percentage_24h >= 0 ? '+' : ''}${bnb.price_change_percentage_24h.toFixed(1)}%)`);
  if (xrp) priceLines.push(`XRP: ${formatOtherPrice(xrp.current_price)} (24h: ${xrp.price_change_percentage_24h >= 0 ? '+' : ''}${xrp.price_change_percentage_24h.toFixed(1)}%)`);

  const priceContext = priceLines.join('\n');

  // Determine overall sentiment
  const avgChange = coins.reduce((sum, c) => sum + c.price_change_percentage_24h, 0) / coins.length;

  let sentiment: "bullish" | "bearish" | "neutral";
  if (avgChange > 2) sentiment = "bullish";
  else if (avgChange < -2) sentiment = "bearish";
  else sentiment = "neutral";

  // Build Grok intelligence context
  const hasGrokIntel = grokIntel.breakingNews.length > 0 || grokIntel.narratives.length > 0;

  let intelContext = '';
  if (hasGrokIntel) {
    intelContext = '\n\n=== REAL-TIME X/TWITTER INTELLIGENCE (last 24-48h) ===';

    if (grokIntel.breakingNews.length > 0) {
      intelContext += `\n\nBREAKING NEWS:\n${grokIntel.breakingNews.map(n => `• ${n}`).join('\n')}`;
    }

    if (grokIntel.narratives.length > 0) {
      intelContext += `\n\nDOMINANT NARRATIVES:\n${grokIntel.narratives.map(n => `• ${n}`).join('\n')}`;
    }

    if (grokIntel.keyTweets.length > 0) {
      intelContext += `\n\nKEY ALPHA FROM CT:\n${grokIntel.keyTweets.map(t => `• ${t}`).join('\n')}`;
    }

    if (grokIntel.sentiment) {
      intelContext += `\n\nCT MOOD: ${grokIntel.sentiment}`;
    }
  }

  const systemPrompt = `You are a sharp crypto market analyst known for cutting through noise and delivering unique, actionable insights. You write for sophisticated traders who want to know WHAT happened, WHY it matters, and WHAT'S NEXT.

Your style:
- Lead with the most important insight, not generic price recaps
- Connect dots others miss: on-chain data → narrative shifts → price action
- Call out specific catalysts with conviction (ETF flows, whale wallets, protocol events)
- Be contrarian when warranted - don't just echo consensus
- Include specific numbers: "$420M liquidated", "Wallet 0x... moved 10k ETH", "Funding at +0.03%"

FORMATTING:
- BTC: $104k format
- ETH: $3.2k format
- SOL: $240 format
- Percentages in *italics*: *+2.3%*
- Token mentions in caps: BTC, ETH, SOL, ARB

DON'T:
- State obvious price movements without explaining why
- Force macro commentary if crypto is moving on its own
- Be wishy-washy with "could go up or down"
- Use generic phrases like "market showing volatility"`;

  const userPrompt = `LIVE PRICE DATA:
${priceContext}
${intelContext}

Write 5-7 sharp bullet points covering:

1. **THE STORY**: What's the dominant narrative driving crypto right now? What changed in the last 24-48h?

2. **CATALYSTS**: Specific events moving prices - ETF flows, whale movements, protocol news, liquidation cascades, funding rates

3. **SECTOR ROTATION**: Which sectors/tokens are gaining mindshare? (AI, memes, L2s, DePIN, etc.) Any notable outperformers or laggards?

4. **SMART MONEY**: What are whales/institutions doing? Any notable wallet movements or positioning?

5. **CONTRARIAN TAKE**: One insight that goes against the current consensus or highlights something the market is missing

6. **LEVELS TO WATCH**: Key support/resistance for majors, liquidation clusters

FORMAT: Return ONLY a JSON array of bullet strings. Each bullet should be punchy and insight-dense. Use the formatting rules.

Example output style:
[
  "BTC grinding toward $105k with *+2.1%* as spot ETFs logged $340M inflows - third consecutive day of accumulation despite macro uncertainty",
  "ETH underperforming at $3.2k (*-0.8%*) - gas fees spiked 3x on memecoin activity but value isn't flowing to ETH yet",
  "AI sector rotation accelerating: TAO *+15%*, RNDR *+8%* as Nvidia earnings loom - CT pivoting from memes to 'real utility'",
  "Whale alert: Jump Trading wallet deposited 15k ETH to Binance - historically precedes volatility, watch for distribution",
  "Contrarian: Everyone bearish on SOL after memecoin fatigue but Solana DEX volume still 2x Ethereum - market structure stronger than sentiment",
  "Key levels: BTC $103.5k = CME gap fill, $106.5k = ATH retest. Liquidation cluster at $101k (~$800M longs)"
]`;

  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Claude API error: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error("Invalid response from Claude API");
  }

  const textContent = data.content[0].text;

  // Parse the JSON array from the response
  const jsonMatch = textContent.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse WhatsUp response");
  }

  const bullets = JSON.parse(jsonMatch[0]) as string[];

  return {
    bullets,
    sentiment,
    topMovers: { gainers, losers }
  };
}
