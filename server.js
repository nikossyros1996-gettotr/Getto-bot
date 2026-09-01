import express from "express";
import multer from "multer";
import OpenAI, { toFile } from "openai";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.static("public"));

app.post("/api/translate", upload.single("audio"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No audio was received." });
    }

    const audioFile = await toFile(
      req.file.buffer,
      req.file.originalname || "speech.webm",
      { type: req.file.mimetype || "audio/webm" }
    );

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-mini-transcribe",
      response_format: "json"
    });

    const original = (transcription.text || "").trim();
    if (!original) {
      return res.status(400).json({ error: "I couldn't hear any words." });
    }

    const translation = await client.responses.create({
      model: "gpt-5.6-luna",
      input: [
        {
          role: "system",
          content:
            "You are GETTO TRANSLATOR. Translate the user's sentence between Greek and English. " +
            "If the input is Greek, translate to natural spoken English. If the input is English, " +
            "translate to natural spoken Greek. Do not explain anything. Return only the translation."
        },
        { role: "user", content: original }
      ]
    });

    const translated = (translation.output_text || "").trim();
    if (!translated) {
      return res.status(500).json({ error: "Translation failed." });
    }

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: translated,
      response_format: "mp3"
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    res.json({
      original,
      translated,
      audio: audioBuffer.toString("base64")
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err?.message || "Something went wrong."
    });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true, app: "GETTO TRANSLATOR" }));

const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => {
  console.log(`GETTO TRANSLATOR running on port ${port}`);
});