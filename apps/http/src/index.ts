import express from "express";
import dotenv from "dotenv";
import { startEmailCron } from "./jobs/emailCron.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("📬 Gmail Cron Job is running!");
});

startEmailCron();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
