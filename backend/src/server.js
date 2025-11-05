import express from 'express';
import session from 'express-session';
import multer from 'multer';
import dotenv from 'dotenv';
import { getAuthUrl, getTokensFromCode, uploadVideoWithClient, oauthClientFromTokens } from './youtube.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import db from './db.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || 'secret', resave: false, saveUninitialized: true }));

const upload = multer({ dest: '/tmp/uploads' });

const redis = new IORedis(process.env.REDIS_URL);
const uploadQueue = new Queue('uploads', { connection: redis });

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// ---------- YouTube OAuth ----------
app.get('/connect/youtube', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

app.get('/oauth2callback/google', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing code');
    const tokens = await getTokensFromCode(code);
    // Save tokens to DB. Simple example: store tokens in table integrations.
    // You should tie to authenticated user; here we create a dummy user id 1 for example.
    const userId = 1;
    await db.query(
      `INSERT INTO integrations (user_id, provider, access_token, refresh_token, meta, created_at)
       VALUES ($1,$2,$3,$4,$5,now())
       ON CONFLICT DO NOTHING`,
      [userId, 'youtube', tokens.access_token, tokens.refresh_token, JSON.stringify(tokens)]
    );
    res.send('YouTube connected. You can close this window.');
  } catch (e) {
    console.error(e);
    res.status(500).send('OAuth error');
  }
});

// ---------- AI metadata generation (proxy to OpenAI) ----------
app.post('/ai/generate-metadata', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400
      })
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Publish endpoint (adds job to queue) ----------
app.post('/publish', async (req, res) => {
  try {
    // Expect body: { platforms: ['youtube'], file_s3_url, metadata: {...}, scheduleAt (optional iso) }
    const { platforms, file_s3_url, metadata, scheduleAt } = req.body;
    if (!platforms || !file_s3_url) return res.status(400).json({ error: 'Missing fields' });

    const jobId = uuidv4();
    await uploadQueue.add('publish', { platforms, file_s3_url, metadata, jobId }, {
      delay: scheduleAt ? Math.max(0, new Date(scheduleAt).getTime() - Date.now()) : 0,
      attempts: 5,
      backoff: { type: 'exponential', delay: 60000 }
    });

    // Save scheduled_posts to DB
    await db.query(
      `INSERT INTO scheduled_posts (id, user_id, platforms, file_s3_url, metadata, scheduled_for, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [jobId, 1, platforms, file_s3_url, metadata || {}, scheduleAt || new Date().toISOString(), 'queued']
    );

    res.json({ ok: true, jobId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Quick manual test upload (local file) ----------
app.post('/upload/youtube-local', upload.single('file'), async (req, res) => {
  try {
    // For quick test: take tokens from DB
    const r = await db.query('SELECT access_token, refresh_token, meta FROM integrations WHERE provider=$1 LIMIT 1', ['youtube']);
    if (r.rowCount === 0) return res.status(400).json({ error: 'No youtube tokens' });
    const tokens = r.rows[0].meta || { access_token: r.rows[0].access_token, refresh_token: r.rows[0].refresh_token };
    const client = oauthClientFromTokens(tokens);
    const out = await uploadVideoWithClient(client, req.file.path, { title: req.body.title, description: req.body.description });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Server listening on ${port}`));
