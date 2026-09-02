let recognition = null;
let isRecording = false;
let lastAudio = null;
let selected = "el";

const mic = document.getElementById("mic");
const statusEl = document.getElementById("status");
const originalEl = document.getElementById("original");
const translatedEl = document.getElementById("translated");
const playBtn = document.getElementById("playBtn");
const greekBtn = document.getElementById("greekBtn");
const englishBtn = document.getElementById("englishBtn");
const installBtn = document.getElementById("installBtn");


// ================================
// ΓΛΩΣΣΑ
// ================================

greekBtn.onclick = () => setLanguage("el");
englishBtn.onclick = () => setLanguage("en");

function setLanguage(lang) {
    selected = lang;

    greekBtn.classList.toggle("active", lang === "el");
    englishBtn.classList.toggle("active", lang === "en");

    if (lang === "el") {
        statusEl.textContent = "Μιλήστε Ελληνικά...";
    } else {
        statusEl.textContent = "Speak English...";
    }
}


// ================================
// ΜΙΚΡΟΦΩΝΟ
// ================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    statusEl.textContent =
        "Το πρόγραμμα περιήγησης δεν υποστηρίζει αναγνώριση φωνής.";
}

function startRecognition() {

    if (!SpeechRecognition) return;

    if (isRecording) {
        stopRecognition();
        return;
    }

    recognition = new SpeechRecognition();

    recognition.lang =
        selected === "el"
            ? "el-GR"
            : "en-US";

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isRecording = true;

        mic.classList.add("recording");

        statusEl.textContent =
            selected === "el"
                ? "🎤 Ακούω Ελληνικά..."
                : "🎤 Listening to English...";
    };

    recognition.onresult = async (event) => {

        const text =
            event.results[0][0].transcript.trim();

        if (!text) {
            statusEl.textContent =
                "Δεν ακούστηκε κείμενο.";
            return;
        }

        originalEl.textContent = text;

        statusEl.textContent = "🔄 Μετάφραση...";

        await translateText(text);
    };

    recognition.onerror = (event) => {

        console.log("Speech error:", event.error);

        isRecording = false;
        mic.classList.remove("recording");

        if (event.error === "not-allowed") {
            statusEl.textContent =
                "❌ Επιτρέψτε την πρόσβαση στο μικρόφωνο.";
        } else if (event.error === "no-speech") {
            statusEl.textContent =
                "❌ Δεν ακούστηκε φωνή.";
        } else {
            statusEl.textContent =
                "❌ Παρουσιάστηκε σφάλμα στο μικρόφωνο.";
        }
    };

    recognition.onend = () => {

        isRecording = false;

        mic.classList.remove("recording");

        if (
            statusEl.textContent.includes("Ακούω") ||
            statusEl.textContent.includes("Listening")
        ) {
            statusEl.textContent =
                selected === "el"
                    ? "Μιλήστε Ελληνικά..."
                    : "Speak English...";
        }
    };

    try {
        recognition.start();
    } catch (error) {
        console.log(error);
    }
}


function stopRecognition() {

    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.log(error);
        }
    }

    isRecording = false;
    mic.classList.remove("recording");
}


// ================================
// ΚΟΥΜΠΙ ΜΙΚΡΟΦΩΝΟΥ
// ================================

mic.addEventListener("click", () => {
    startRecognition();
});


// ================================
// ΜΕΤΑΦΡΑΣΗ
// ================================

async function translateText(text) {

    try {

        const from = selected;
        const to = selected === "el" ? "en" : "el";

        const response = await fetch("/translate", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text: text,
                source: from,
                target: to
            })
        });

        if (!response.ok) {
            throw new Error(
                "Translation server error: " +
                response.status
            );
        }

        const data = await response.json();

        const translated =
            data.translation ||
            data.translatedText ||
            data.result ||
            "";

        if (!translated) {
            throw new Error("Δεν επιστράφηκε μετάφραση.");
        }

        translatedEl.textContent = translated;

        statusEl.textContent =
            selected === "el"
                ? "✅ Η μετάφραση ολοκληρώθηκε."
                : "✅ Translation completed.";

        speakText(translated, to);

    } catch (error) {

        console.error("Translation error:", error);

        translatedEl.textContent = "—";

        statusEl.textContent =
            "❌ Σφάλμα μετάφρασης.";
    }
}


// ================================
// ΑΝΑΠΑΡΑΓΩΓΗ ΜΕΤΑΦΡΑΣΗΣ
// ================================

function speakText(text, lang) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang =
        lang === "el"
            ? "el-GR"
            : "en-US";

    utterance.rate = 0.95;
    utterance.pitch = 1;

    lastAudio = utterance;

    window.speechSynthesis.speak(utterance);
}


// ================================
// Κ
