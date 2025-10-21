import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const PORT = process.env.PORT || "3000";
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/oauth/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing CLIENT_ID or CLIENT_SECRET in .env");
  process.exit(1);
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
];

const tokensFile = path.resolve(process.cwd(), "tokens.json");
type TokenStore = { [email: string]: any };

function readTokens(): TokenStore {
  if (!fs.existsSync(tokensFile)) return {};
  return JSON.parse(fs.readFileSync(tokensFile, "utf8") || "{}");
}
function writeTokens(store: TokenStore) {
  fs.writeFileSync(tokensFile, JSON.stringify(store, null, 2), "utf8");
}

const app = express();
app.use(bodyParser.json());

function createOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

// Step 1: Get authorization URL for user
app.get("/auth", (req, res) => {
  const email = String(req.query.email || "");
  if (!email) return res.status(400).json({ error: "Missing ?email=you@example.com" });

  const oauth2 = createOAuthClient();
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: encodeURIComponent(email),
  });

  res.json({ authUrl });
});

// Step 2: Google redirects here after consent
app.get("/oauth/callback", (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  if (!code || !state) return res.status(400).send("Missing code or state");

  res.send(`
    <h3>Authorization code received!</h3>
    <p>POST this to /token along with your email:</p>
    <pre>Code: ${code}</pre>
    <pre>Email: ${decodeURIComponent(state)}</pre>
  `);
});

// Step 3: Exchange code for tokens and save
app.post("/token", async (req, res) => {
  const { code, email } = req.body;
  if (!code || !email) return res.status(400).json({ error: "Missing code or email" });

  try {
    const oauth2 = createOAuthClient();
    const { tokens } = await oauth2.getToken(code);
    const store = readTokens();
    store[email] = tokens;
    writeTokens(store);
    res.json({ ok: true, message: "Tokens saved" });
  } catch (err) {
    res.status(500).json({ error: "Token exchange failed", details: String(err) });
  }
});

// Step 4: Fetch recent emails for connected user
app.get("/emails", async (req, res) => {
  const email = String(req.query.email || "");
  if (!email) return res.status(400).json({ error: "Missing ?email=you@example.com" });

  const store = readTokens();
  const tokens = store[email];
  if (!tokens) return res.status(404).json({ error: "User not connected. Run /auth then /token" });

  try {
    const oauth2 = createOAuthClient();
    oauth2.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const list = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
    const messages = list.data.messages || [];

    const out = [];
    for (const msg of messages) {
      if (!msg?.id) continue;
      const detail = await gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" });
      const headers = detail.data.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
      const from = headers.find((h: any) => h.name === "From")?.value || "";
      out.push({ id: msg.id, subject, from, snippet: detail.data.snippet });
    }

    res.json({ messages: out });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch emails", details: String(err) });
  }
});

app.listen(parseInt(PORT), () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
