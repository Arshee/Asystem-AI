import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}${process.env.GOOGLE_OAUTH_REDIRECT || '/oauth2callback/google'}`
);

export function getAuthUrl() {
  const scopes = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'];
  return oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent' });
}

export async function getTokensFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens; // { access_token, refresh_token, expiry_date, ...}
}

export function oauthClientFromTokens(tokens) {
  const client = new google.auth.OAuth2();
  client.setCredentials(tokens);
  return client;
}

export async function uploadVideoWithClient(authClient, filePath, metadata = {}) {
  const youtube = google.youtube({ version: 'v3', auth: authClient });
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: metadata.title || 'Untitled',
        description: metadata.description || '',
        tags: metadata.tags || []
      },
      status: {
        privacyStatus: metadata.privacy || 'private'
      }
    },
    media: {
      body: fs.createReadStream(filePath)
    }
  }, { maxBodyLength: Infinity, maxContentLength: Infinity });

  return res.data;
}
