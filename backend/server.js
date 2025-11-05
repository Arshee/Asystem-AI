// server.js (Node 18+, Express)
import express from "express";
import session from "express-session";
import axios from "axios";
import multer from "multer";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET||'sekret', resave:false, saveUninitialized:true }));

// storage for uploads (temporary). In production przesyłaj do S3 i worker pobiera stamtąd.
const upload = multer({ dest: "/tmp/uploads" });

// ---------- 1) SIMPLE route: generate AI meta (ChatGPT/OpenAI) ----------
app.post("/ai/generate-metadata", async (req,res) => {
  const { prompt } = req.body;
  try {
    const openaiResp = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini", // wybierz
      messages: [{role:"user", content: prompt}],
      max_tokens: 400
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    return res.json(openaiResp.data);
  } catch(e){
    console.error(e.response?.data||e.message);
    return res.status(500).json({error:"AI error"});
  }
});

// ---------- 2) YouTube OAuth (redirect based) ----------
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/oauth2callback/google`
);

app.get("/connect/youtube", (req,res) => {
  const scopes = ["https://www.googleapis.com/auth/youtube.upload"];
  const url = oauth2Client.generateAuthUrl({ access_type: "offline", scope: scopes });
  res.redirect(url);
});

app.get("/oauth2callback/google", async (req,res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  // tu zapisz tokens.access_token i tokens.refresh_token w DB powiązane z userem
  res.json({ ok: true, tokens });
});

// ---------- 3) Simple YouTube resumable upload endpoint (worker style) ----------
app.post("/upload/youtube", upload.single("file"), async (req,res) => {
  // W praktyce: dodaj job do kolejki aby worker robił upload
  // Poniżej przykład jak worker może to zrobić synchronously:
  try {
    const { accessToken, refreshToken } = /* pobierz z DB */;
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const fs = await import('fs');
    const fileSize = fs.statSync(req.file.path).size;
    const result = await youtube.videos.insert({
      part: ['snippet','status'],
      requestBody: {
        snippet: { title: req.body.title || 'Bez tytułu', description: req.body.description || '' },
        status: { privacyStatus: req.body.privacy || 'private' }
      },
      media: { body: fs.createReadStream(req.file.path) }
    }, { maxBodyLength: Infinity, maxContentLength: Infinity });
    res.json(result.data);
  } catch(err){
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

// ---------- 4) Instagram (Meta) - create media container then publish ----------
app.post("/upload/instagram", upload.single("file"), async (req,res) => {
  // workflow: POST /{ig-user-id}/media with file_url or upload via Resumable API -> then POST /{ig-user-id}/media_publish
  // Tu proponuję: worker uploaduje plik na S3 i używa file_url do /{ig-user-id}/media
  res.json({ ok: true, note: "Zalecane: worker upload->S3-> użyj URL do Meta API" });
});

app.listen(process.env.PORT || 3000, ()=> console.log("Server up"));
