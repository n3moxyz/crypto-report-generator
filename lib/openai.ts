import { fetchSpecificCoins, CoinData } from "./coingecko";
import { fetchCryptoIntelFromGrok, GrokCryptoIntel, TweetReference } from "./grok";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

export interface BulletPoint {
  main: string;
  subPoints?: string[];
}

export interface WhatsUpData {
  bullets: BulletPoint[];
  sentiment: "bullish" | "bearish" | "neutral";
  topMovers: {
    gainers: Array<{ symbol: string; change: string }>;
    losers: Array<{ symbol: string; change: string }>;
  };
  topTweets: TweetReference[];
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

  // Get current timestamp for accuracy
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
  const currentTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });

  // Build Grok intelligence context
  const hasGrokIntel = grokIntel.breakingNews.length > 0 || grokIntel.priceDrivers.length > 0;

  let intelContext = '';
  if (hasGrokIntel) {
    intelContext = '\n\n=== VERIFIED X/TWITTER INTELLIGENCE (last 24-48h) ===';

    if (grokIntel.priceDrivers.length > 0) {
      intelContext += `\n\nWHY PRICES MOVED (from CT discussion):\n${grokIntel.priceDrivers.map(d => `• ${d}`).join('\n')}`;
    }

    if (grokIntel.breakingNews.length > 0) {
      intelContext += `\n\nBREAKING NEWS:\n${grokIntel.breakingNews.map(n => `• ${n}`).join('\n')}`;
    }

    if (grokIntel.sentiment) {
      intelContext += `\n\nCT SENTIMENT: ${grokIntel.sentiment}`;
    }
  }

  const systemPrompt = `You are a crypto market analyst. Your #1 priority is ACCURACY. You would rather say less than say something wrong.

CURRENT DATE/TIME: ${currentDate}, ${currentTime} UTC

CRITICAL RULES - MUST FOLLOW:
1. ONLY use information from the provided price data and X/Twitter intelligence
2. NEVER make up statistics, ratios, percentages, or specific numbers not in the data
3. NEVER reference past events as if they're upcoming (e.g., if it's January, don't say "December rate cut is probable")
4. If you don't have information about something, DON'T MENTION IT - skip that topic entirely
5. Only mention specific sectors (AI, DePIN, memes, etc.) if there are SPECIFIC TOKENS with notable moves in the data
6. The price data shows ACTUAL current prices and 24h changes - use these exact numbers
7. If X/Twitter intel is empty or sparse, focus only on what you can verify from the price data

FORMATTING:
- BTC: $104k format (use actual price from data)
- ETH: $3.2k format (use actual price from data)
- SOL: $240 format (use actual price from data)
- Percentages in *italics*: *+2.3%* (use actual % from data)

ACCURACY > DETAIL. Say less if unsure. Never hallucinate.`;

  const userPrompt = `TIMESTAMP: ${currentDate}, ${currentTime} UTC

LIVE PRICE DATA (verified):
${priceContext}
${intelContext}

Write 4-6 bullet points about the crypto market in the last 24-48h.

STRUCTURE: For each point, provide:
1. A main observation (what happened)
2. Sub-points explaining WHY (if the intel provides reasons)

FORMAT: Return a JSON array of objects:
[
  {
    "main": "BTC dropped to $102k (*-3.2%* 24h) - significant selling pressure across majors",
    "subPoints": ["Reason 1 from the intel...", "Reason 2..."]
  },
  {
    "main": "ETH underperforming at $3.1k (*-4.5%*)",
    "subPoints": ["Specific reason if available"]
  },
  {
    "main": "Simple observation without known reason"
  }
]

RULES:
- Use exact prices/percentages from the price data
- Only add subPoints if you have ACTUAL reasons from the X/Twitter intel
- If no reason is known, omit the subPoints field entirely (don't make one up)
- Each subPoint should be a specific, verifiable reason

Example with reasons:
{
  "main": "Market-wide selling pressure: BTC *-3.2%*, ETH *-4.5%*, SOL *-6.1%*",
  "subPoints": ["Fed minutes showed hawkish tone, risk assets selling off", "Large BTC transfer to exchanges spotted (~5k BTC)"]
}

Example without reasons:
{
  "main": "BTC holding $104k (*+0.3%*) - relatively quiet 24h with no major moves"
}`;

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

  const rawBullets = JSON.parse(jsonMatch[0]);

  // Handle both old format (string[]) and new format (BulletPoint[])
  const bullets: BulletPoint[] = rawBullets.map((b: string | BulletPoint) => {
    if (typeof b === 'string') {
      return { main: b };
    }
    return b;
  });

  return {
    bullets,
    sentiment,
    topMovers: { gainers, losers },
    topTweets: grokIntel.topTweets || []
  };
}
