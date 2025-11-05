// Minimal placeholder — implement real Meta Graph calls here
import dotenv from 'dotenv';
dotenv.config();

export async function createInstagramMediaContainer({ igUserId, videoUrl, caption, accessToken }) {
  // POST https://graph.facebook.com/v16.0/{ig-user-id}/media?media_type=VIDEO&video_url={videoUrl}&caption={caption}&access_token={accessToken}
  throw new Error('Implement Instagram Graph API flow: media container -> publish.');
}

export async function publishInstagramMedia({ igUserId, creationId, accessToken }) {
  // POST /{ig-user-id}/media_publish?creation_id={creationId}&access_token={accessToken}
  throw new Error('Implement Instagram publish.');
}
