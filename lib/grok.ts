const XAI_API = "https://api.x.ai/v1/chat/completions";

export interface TweetReference {
  summary: string;
  url?: string;
  author?: string;
  engagement?: string;
}

export interface GrokCryptoIntel {
  priceDrivers: string[];
  breakingNews: string[];
  sentiment: string;
  topTweets: TweetReference[];
  searchTimestamp: string;
}

export async function fetchCryptoIntelFromGrok(): Promise<GrokCryptoIntel> {
  const apiKey = process.env.XAI_API_KEY;
  const now = new Date();
  const searchTimestamp = now.toISOString();

  if (!apiKey) {
    console.log("XAI_API_KEY not configured, skipping Grok intelligence");
    return {
      priceDrivers: [],
      breakingNews: [],
      sentiment: "",
      topTweets: [],
      searchTimestamp,
    };
  }

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

  const systemPrompt = `You are a crypto market intelligence analyst with real-time access to X (Twitter).

CRITICAL RULES:
1. TODAY'S DATE IS: ${currentDate}, ${currentTime} UTC
2. ONLY report information you can VERIFY from actual X posts in the last 24-48 hours
3. NEVER make up statistics, prices, ratios, or percentages
4. NEVER reference events that happened before 48 hours ago as if they're current
5. If you cannot find specific information, return empty arrays - DO NOT HALLUCINATE
6. Only mention specific tokens/sectors if there are ACTUAL tweets discussing them
7. Include links to high-engagement tweets when available`;

  const userPrompt = `CURRENT DATE/TIME: ${currentDate}, ${currentTime} UTC

Search X/Twitter for VERIFIED crypto market developments from the LAST 24-48 HOURS ONLY (from ${getDateDaysAgo(2)} to ${getTodayDate()}).

I need to understand WHY crypto prices moved. Find:

1. PRICE DRIVERS: What reasons are people giving for recent price movements? (macro events, news, whale activity, etc.)
2. BREAKING NEWS: Major events that moved or could move markets
3. TOP TWEETS: Find 2-4 high-engagement tweets (1000+ likes or from notable accounts) that explain market conditions well. Include the actual X/Twitter URL.

STRICT REQUIREMENTS:
- Only include verified information from actual posts
- For top tweets, prioritize posts with good explanations AND high engagement
- Include actual tweet URLs in format: https://x.com/username/status/id
- If you find no significant news, return empty arrays

Return as JSON:
{
  "priceDrivers": ["reason 1 for price movement...", "reason 2..."] or [],
  "breakingNews": ["verified news item..."] or [],
  "topTweets": [
    {"summary": "what the tweet says", "url": "https://x.com/...", "author": "@username", "engagement": "5.2k likes"},
    ...
  ] or [],
  "sentiment": "brief factual summary of CT mood, or 'mixed/unclear' if no strong signal"
}

ACCURACY FIRST. Empty arrays are better than made-up information.`;

  try {
    const response = await fetch(XAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        search_parameters: {
          mode: "auto",
          return_citations: false,
          from_date: getDateDaysAgo(2),
          to_date: getTodayDate(),
        },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Grok API error:", errorData);
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in Grok response");
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse Grok JSON, raw content:", content);
      throw new Error("Failed to parse Grok response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Parse topTweets which can be objects or strings
    const topTweets: TweetReference[] = (parsed.topTweets || []).map((t: TweetReference | string) => {
      if (typeof t === 'string') {
        return { summary: t };
      }
      return t;
    });

    return {
      priceDrivers: parsed.priceDrivers || [],
      breakingNews: parsed.breakingNews || [],
      sentiment: parsed.sentiment || "",
      topTweets,
      searchTimestamp,
    };
  } catch (error) {
    console.error("Grok fetch error:", error);
    return {
      priceDrivers: [],
      breakingNews: [],
      sentiment: "",
      topTweets: [],
      searchTimestamp,
    };
  }
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}
