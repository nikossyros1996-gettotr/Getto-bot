import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(process.cwd()));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// Δωρεάν μετάφραση
app.post("/api/translate", async (req, res) => {
  try {
    const { text, from, to } = req.body;

    if (!text) {
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
    const data = await response.json();

    if (!data.responseData || !data.responseData.translatedText) {
      return res.status(500).json({
        error: "Η μετάφραση απέτυχε."
      });
    }

    res.json({
      original: text,
      translated: data.responseData.translatedText
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Σφάλμα μετάφρασης."
    });
  }
});

app.listen(PORT, () => {
  console.log(`GETTO Translator running on port ${PORT}`);
});
