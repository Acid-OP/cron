import { google } from 'googleapis';
import fs from 'fs';

const keyPath = process.env.GMAIL_SERVICE_ACCOUNT_KEY!;

async function initializeGmailClient() {
  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
  });

  return google.gmail({ version: 'v1', auth });
}

let gmailInstance: any = null;

export async function getGmailClient() {
  if (!gmailInstance) {
    gmailInstance = await initializeGmailClient();
  }
  return gmailInstance;
}