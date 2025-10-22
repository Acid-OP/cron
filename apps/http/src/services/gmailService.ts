import { gmail } from "../config/gmail.js";

let lastCheck = new Date().toISOString();

export const fetchNewEmails = async () => {
  try {
    console.log("🔍 Checking for new emails...");

    const res = await gmail.users.messages.list({
      userId: "me",
      q: `after:${Math.floor(new Date(lastCheck).getTime() / 1000)}`,
      maxResults: 5,
    });

    const messages = res.data.messages || [];

    if (messages.length === 0) {
      console.log("No new emails since last check.");
    } else {
      console.log(`📩 Found ${messages.length} new email(s).`);
      for (const msg of messages) {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
        });
        console.log("✉️ Snippet:", detail.data.snippet);
      }
    }

    lastCheck = new Date().toISOString();
  } catch (err) {
    console.error("❌ Error fetching emails:", err);
  }
};
