import express from "express";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI!;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN!;

if (!CLIENT_ID || !CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
  console.error("Missing CLIENT_ID, CLIENT_SECRET, or GMAIL_REFRESH_TOKEN in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

const app = express();

app.get("/emails", async (req, res) => {
  try {
    const list = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
    const messages = list.data.messages || [];

    const out = [];
    for (const msg of messages) {
      const detail = await gmail.users.messages.get({ userId: "me", id: msg.id!, format: "full" });
      const headers = detail.data.payload?.headers || [];
      const subject = headers.find(h => h.name === "Subject")?.value || "";
      const from = headers.find(h => h.name === "From")?.value || "";
      out.push({ id: msg.id, subject, from, snippet: detail.data.snippet });
    }

    res.json({ messages: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch emails", details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
