import cron from "node-cron";
import { fetchNewEmails } from "../services/gmailService.js";

export const startEmailCron = () => {
  console.log("🕒 Cron job scheduled to run every 5 minutes...");
  cron.schedule("*/5 * * * *", () => {
    fetchNewEmails();
  });
};
