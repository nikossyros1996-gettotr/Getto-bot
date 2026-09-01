import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================
// MIDDLEWARE
// ================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================
// FRONTEND
// ================================

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ================================
// ΔΩΡΕΑΝ ΜΕΤΑΦΡΑΣΗ
// ================================

app.post("/api/translate", async (req, res) => {
  try {
    const { text, from, to } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Δεν δόθηκε κείμενο."
      });
    }

    const source = from || "el";
    const target = to || "en";

    const url =
      "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(text) +
      "&langpair=" +
      encodeURIComponent(source + "|" + target);

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(500).json({
        error: "Δεν ήταν δυνατή η μετάφραση."
      });
    }

    const data = await response.json();

    const translated =
      data?.responseData?.translatedText;

    if (!translated) {
      return res.status(500).json({
        error: "Δεν επιστράφηκε μετάφραση."
      });
    }

    return res.json({
      original: text,
      translated: translated
    });

  } catch (error) {
    console.error("Translation error:", error);

    return res.status(500).json({
      error: "Σφάλμα μετάφρασης.",
      details: error.message
    });
  }
});

// ================================
// SERVER
// ================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`GETTO Translator running on port ${PORT}`);
});
