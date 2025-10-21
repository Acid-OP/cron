import { gmail_v1 } from 'googleapis';

interface Email {
  messageId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
}

export class GmailService {
  constructor(private gmail: gmail_v1.Gmail, private userEmail: string) {}

  async fetchUnreadEmails(maxResults: number = 10): Promise<Email[]> {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults,
    });

    const messageIds = response.data.messages || [];
    const emails: Email[] = [];

    for (const msg of messageIds) {
      const email = await this.getEmailContent(msg.id!);
      if (email) emails.push(email);
    }

    return emails;
  }

  private async getEmailContent(messageId: string): Promise<Email | null> {
    try {
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const headers = message.data.payload?.headers || [];
      const from = this.extractHeader(headers, 'From');
      const to = this.extractHeader(headers, 'To');
      const subject = this.extractHeader(headers, 'Subject');
      const body = this.extractBody(message.data.payload);

      return {
        messageId,
        threadId: message.data.threadId || '',
        from: from || 'Unknown',
        to: to || this.userEmail,
        subject: subject || 'No Subject',
        body,
        receivedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error);
      return null;
    }
  }

  private extractHeader(headers: any[], name: string): string | null {
    return headers.find(h => h.name === name)?.value || null;
  }

  private extractBody(payload: any): string {
    if (payload.parts) {
      const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    return '';
  }

  async createDraft(to: string, subject: string, body: string): Promise<string | null> {
    try {
      const message = [
        `From: <${this.userEmail}>`,
        `To: <${to}>`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        '',
        body,
      ].join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage,
          },
        },
      });

      return response.data.id || null;
    } catch (error) {
      console.error('Error creating draft:', error);
      return null;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      console.error(`Error marking email as read: ${messageId}`, error);
    }
  }
}

