import { NextRequest, NextResponse } from "next/server";
import { fetchTop100Coins, fetchTop300Coins, fetchSpecificCoins, getDisplayItems, getTopMovers, CoinData } from "@/lib/coingecko";

// Stablecoins to filter out
const STABLECOIN_IDS = [
  "tether", "usd-coin", "dai", "trueusd", "paxos-standard", "binance-usd",
  "frax", "usdd", "gemini-dollar", "pax-dollar", "first-digital-usd",
  "paypal-usd", "ethena-usde", "usual-usd", "fdusd", "ondo-us-dollar-yield",
  "binance-bridged-usdc-bnb-smart-chain", "usds", "usdc-bridged-base", "usyc", "bfusd"
];

// Liquid staking derivatives / wrapped tokens to filter out
const WRAPPED_TOKEN_IDS = [
  "wrapped-bitcoin", "wrapped-steth", "wrapped-eeth", "wrapped-ether",
  "staked-ether", "rocket-pool-eth", "coinbase-wrapped-btc", "cbeth",
  "binance-staked-sol", "marinade-staked-sol", "jito-staked-sol",
  "mantle-staked-ether", "renzo-restaked-eth", "kelp-dao-restaked-eth",
  "lombard-staked-btc", "solv-btc", "msol", "bnsol", "bbsol"
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const selectedCoins = searchParams.get("coins")?.split(",").filter(Boolean) || [];
    const coinIds = selectedCoins.length > 0 ? selectedCoins : undefined;

    // Fetch selected coins (with sparkline), top 100 for movers, top 300 for selector — all in parallel
    const [selectedCoinsData, top100Coins, top300Coins] = await Promise.all([
      fetchSpecificCoins(coinIds),
      fetchTop100Coins(),
      fetchTop300Coins(),
    ]);

    // Get display items for selected coins (sparkline data included from fetchSpecificCoins)
    const displayItems = getDisplayItems(selectedCoinsData, coinIds);

    // Get top movers for different tiers
    const topMovers = {
      top50: getTopMovers(top300Coins.slice(0, 50)),
      top100: getTopMovers(top100Coins),
      top200: getTopMovers(top300Coins.slice(0, 200)),
      top300: getTopMovers(top300Coins),
    };

    // Format available coins for selector (exclude stablecoins and wrapped tokens)
    const excludedIds = [...STABLECOIN_IDS, ...WRAPPED_TOKEN_IDS];
    const availableCoins = top300Coins
      .filter(coin => !excludedIds.includes(coin.id))
      .map((coin) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
      }));

    return NextResponse.json({
      coins: selectedCoinsData,
      displayItems,
      topMovers,
      availableCoins,
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch crypto prices" },
      { status: 500 }
    );
  }
}
