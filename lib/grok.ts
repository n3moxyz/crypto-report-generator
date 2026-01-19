const XAI_API = "https://api.x.ai/v1/chat/completions";

export interface GrokCryptoIntel {
  narratives: string[];
  breakingNews: string[];
  sentiment: string;
  keyTweets: string[];
}

export async function fetchCryptoIntelFromGrok(): Promise<GrokCryptoIntel> {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    console.log("XAI_API_KEY not configured, skipping Grok intelligence");
    return {
      narratives: [],
      breakingNews: [],
      sentiment: "",
      keyTweets: [],
    };
  }

  const systemPrompt = `You are a crypto market intelligence analyst with real-time access to X (Twitter). Your job is to surface the most important crypto narratives, breaking news, and sentiment from the past 24-48 hours.

Focus on:
1. BREAKING NEWS: Hacks, exploits, regulatory actions, major announcements, exchange issues
2. WHALE MOVEMENTS: Large transfers, wallet tracking alerts, smart money moves
3. NARRATIVE SHIFTS: What tokens/sectors are gaining mindshare (AI, DePIN, memes, L2s, etc.)
4. INFLUENCER TAKES: Key opinions from major crypto accounts that are moving markets
5. LIQUIDATION CASCADES: Major liquidation events, funding rate extremes
6. ON-CHAIN DATA: Notable on-chain metrics being discussed (TVL changes, active addresses, etc.)

Be specific with numbers, names, and details. Don't be generic.`;

  const userPrompt = `Search X/Twitter for the most important crypto market developments in the last 24-48 hours. I need:

1. BREAKING NEWS (2-3 items): Major events that moved markets or could move markets
2. DOMINANT NARRATIVES (2-3 items): What sectors/tokens are people talking about most and why
3. KEY ALPHA (2-3 items): Whale moves, smart money positioning, notable on-chain activity
4. OVERALL SENTIMENT: One sentence summary of crypto Twitter mood

Return as JSON:
{
  "breakingNews": ["specific news item with details..."],
  "narratives": ["narrative with specific tokens/projects mentioned..."],
  "keyTweets": ["paraphrased key insights from notable accounts..."],
  "sentiment": "one sentence mood summary"
}

Be sharp and specific. Include ticker symbols, percentages, and dollar amounts where relevant.`;

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
        temperature: 0.7,
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

    return {
      narratives: parsed.narratives || [],
      breakingNews: parsed.breakingNews || [],
      sentiment: parsed.sentiment || "",
      keyTweets: parsed.keyTweets || [],
    };
  } catch (error) {
    console.error("Grok fetch error:", error);
    return {
      narratives: [],
      breakingNews: [],
      sentiment: "",
      keyTweets: [],
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
