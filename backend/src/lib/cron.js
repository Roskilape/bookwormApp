import { CronJob } from "cron";
import https from "node:https";

const serviceUrl = process.env.API_URL || process.env.RENDER_EXTERNAL_URL;
let healthUrl;

if (serviceUrl) {
  try {
    healthUrl = new URL("/health", serviceUrl);
    if (healthUrl.protocol !== "https:") {
      throw new Error("Cron service URL must use HTTPS");
    }
  } catch (error) {
    console.error("Cron job disabled:", error.message);
    healthUrl = undefined;
  }
} else {
  console.warn("Cron job disabled: set API_URL or RENDER_EXTERNAL_URL");
}

const job = new CronJob("*/14 * * * *", function () {
  if (!healthUrl) return;

  const request = https.get(healthUrl, (res) => {
    res.resume(); // Consume the response so the connection can be released.
    if (res.statusCode === 200) console.log("Cron health request succeeded");
    else console.error("Cron health request failed:", res.statusCode);
  });
  request.setTimeout(10000, () => {
    request.destroy(new Error("Cron health request timed out"));
  });
  request.on("error", (error) => {
    console.error("Cron health request error:", error.message);
  });
});

export default job;

// CRON JOB EXPLANATION:
// Cron jobs are scheduled tasks that run periodically at fixed intervals
// we want to send 1 GET request for every 14 minutes

// How to define a "Schedule"?
// You define a schedule using a cron expression, which consists of 5 fields representing:

//! MINUTE, HOUR, DAY OF THE MONTH, MONTH, DAY OF THE WEEK

//? EXAMPLES && EXPLANATION:
//* */14 * * * * - At minutes 0, 14, 28, 42, and 56 of each hour
//* 0 0 * * 0 - At midnight on every Sunday
//* 30 3 15 * * - At 3:30 AM, on the 15th of every month
//* 0 0 1 1 * - At midnight, on January 1st
//* 0 * * * * - Every hour
