import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(process.cwd()));

// Αρχική σελίδα
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// ================================
// ΔΩΡΕΑΝ ΜΕΤΑΦΡΑΣΗ
// ================================
app.post("/api/translate", async (req, res) => {
  try {
    const { text, from, to } = req.body;

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
        error: "Αποτυχία επικοινωνίας με την υπηρεσία μετάφρασης."
      });
    }

    const data = await response.json();

    if (
      !data ||
      !data.responseData ||
      !data.responseData.translatedText
    ) {
      return res.status(500).json({
        error: "Δεν επιστράφηκε μετάφραση."
      });
    }

    return res.json({
      original: text,
      translated: data.responseData.translatedText
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
app.listen(PORT, () => {
  console.log(`GETTO Translator running on port ${PORT}`);
});
