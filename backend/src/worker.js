import { Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { transcodeToMp4 } from './ffmpeg-utils.js';
import { oauthClientFromTokens, uploadVideoWithClient } from './youtube.js';
import db from './db.js';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL);
new QueueScheduler('uploads', { connection });

const worker = new Worker('uploads', async job => {
  const { platforms, file_s3_url, metadata, jobId } = job.data;
  console.log('Processing job', jobId, platforms);

  // Download file from S3 (public URL). Save to /tmp
  const tmpFile = `/tmp/${jobId}_input`;
  const tmpOut = `/tmp/${jobId}_out.mp4`;

  // fetch and save
  const r = await fetch(file_s3_url);
  if (!r.ok) throw new Error(`Failed to fetch file ${r.status}`);
  const fileStream = fs.createWriteStream(tmpFile);
  await new Promise((res, rej) => {
    r.body.pipe(fileStream);
    r.body.on('error', rej);
    fileStream.on('finish', res);
  });

  // transcode
  await transcodeToMp4(tmpFile, tmpOut);

  // For each platform perform upload
  for (const p of platforms) {
    if (p === 'youtube') {
      // Get tokens (simple example: single integration)
      const r = await db.query('SELECT meta FROM integrations WHERE provider=$1 LIMIT 1', ['youtube']);
      if (r.rowCount === 0) throw new Error('No YouTube integration');
      const tokens = r.rows[0].meta;
      const client = oauthClientFromTokens(tokens);
      const result = await uploadVideoWithClient(client, tmpOut, metadata || {});
      console.log('Uploaded to YouTube', result.id);

      // Save analytics placeholder
      await db.query('INSERT INTO analytics (platform, platform_post_id, metrics, sample_time) VALUES ($1,$2,$3,now())',
        ['youtube', result.id, JSON.stringify({ uploadedAt: new Date().toISOString() })]);
    } else if (p === 'instagram') {
      // call instagram flow (S3 URL approach recommended)
      console.log('Instagram upload placeholder — implement instagram.js flow.');
    } else if (p === 'tiktok') {
      console.log('TikTok upload placeholder — implement tiktok.js flow.');
    }
  }

  // cleanup
  try { fs.unlinkSync(tmpFile); fs.unlinkSync(tmpOut); } catch(e){}

  // update scheduled_posts
  await db.query('UPDATE scheduled_posts SET status=$1 WHERE id=$2', ['done', jobId]);
}, { connection });

worker.on('failed', (job, err) => {
  console.error('Job failed', job?.id, err);
});

console.log('Worker started');
