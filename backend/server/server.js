// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

app.post("/api/ai", async (req, res) => {
  const { prompt } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Jesteś asystentem AI do planowania i publikowania treści na social media.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (err) {
    console.error("Błąd OpenAI:", err);
    res.status(500).json({ error: "Błąd po stronie serwera AI" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server działa na porcie ${PORT}`));
