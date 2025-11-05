import { exec } from 'child_process';
import { promisify } from 'util';
const execp = promisify(exec);

export async function transcodeToMp4(inputPath, outputPath) {
  // adjust params as needed; keep safe defaults (H.264)
  const cmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}"`;
  await execp(cmd);
  return outputPath;
}
