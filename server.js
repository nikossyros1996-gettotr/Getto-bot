const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(process.cwd()));

// ========================================
// GETTO TRANSLATOR
// ΔΩΡΕΑΝ ΜΕΤΑΦΡΑΣΗ
// ========================================

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

app.post("/api/translate", async (req, res) => {
  try {
    const { text, from, to } = req.body;

    // Έλεγχος κειμένου
    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Δεν δόθηκε κείμενο."
      });
    }

    const source = from || "el";
    const target = to || "en";

    // ========================================
    // ΔΩΡΕΑΝ GOOGLE TRANSLATE ENDPOINT
    // ========================================

    const url =
      "https://translate.googleapis.com/translate_a/single" +
      "?client=gtx" +
      "&sl=" + encodeURIComponent(source) +
      "&tl=" + encodeURIComponent(target) +
      "&dt=t" +
      "&q=" + encodeURIComponent(text);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Translation service returned " + response.status
      );
    }

    const data = await response.json();

    // ========================================
    // ΠΑΡΑΛΑΒΗ ΜΕΤΑΦΡΑΣΗΣ
    // ========================================

    let translated = "";

    if (Array.isArray(data) && Array.isArray(data[0])) {
      translated = data[0]
        .map(item => item && item[0])
        .filter(Boolean)
        .join("");
    }

    if (!translated) {
      return res.status(500).json({
        error: "Δεν επιστράφηκε μετάφραση."
      });
    }

    // ========================================
    // ΑΠΑΝΤΗΣΗ ΣΤΟ INDEX.HTML
    // ========================================

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

// ========================================
// SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`GETTO Translator running on port ${PORT}`);
});
