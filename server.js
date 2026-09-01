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
// ΜΕΤΑΦΡΑΣΗ
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

    // Πρώτη υπηρεσία: MyMemory
    try {
      const url =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(text) +
        "&langpair=" +
        encodeURIComponent(source + "|" + target);

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        if (
          data &&
          data.responseData &&
          data.responseData.translatedText
        ) {
          return res.json({
            original: text,
            translated: data.responseData.translatedText
          });
        }
      }
    } catch (error) {
      console.log("MyMemory failed:", error.message);
    }

    // Δεύτερη υπηρεσία: Google Translate endpoint
    try {
      const googleUrl =
        "https://translate.googleapis.com/translate_a/single" +
        "?client=gtx" +
        "&sl=" +
        encodeURIComponent(source) +
        "&tl=" +
        encodeURIComponent(target) +
        "&dt=t&q=" +
        encodeURIComponent(text);

      const response = await fetch(googleUrl);

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0]
            .map(item => item[0])
            .filter(Boolean)
            .join("");

          if (translated) {
            return res.json({
              original: text,
              translated: translated
            });
          }
        }
      }
    } catch (error) {
      console.log("Google Translate failed:", error.message);
    }

    return res.status(500).json({
      error: "Δεν ήταν δυνατή η μετάφραση."
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
