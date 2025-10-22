import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI!;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN!;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !GMAIL_REFRESH_TOKEN) {
  console.error("❌ Missing Gmail credentials in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

export const gmail = google.gmail({ version: "v1", auth: oauth2Client });
