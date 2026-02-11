const DEFAULT_DAILY_BUDGET = 200;

let requestCount = 0;
let currentDay = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" in UTC

function resetIfNewDay(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== currentDay) {
    requestCount = 0;
    currentDay = today;
  }
}

function getDailyBudget(): number {
  const envBudget = process.env.DAILY_API_BUDGET;
  if (envBudget) {
    const parsed = parseInt(envBudget, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_DAILY_BUDGET;
}

export function checkDailyBudget(): { allowed: boolean; remaining: number } {
  resetIfNewDay();
  const budget = getDailyBudget();
  const remaining = Math.max(0, budget - requestCount);
  return { allowed: requestCount < budget, remaining };
}

export function incrementDailyBudget(): void {
  resetIfNewDay();
  requestCount++;
}
