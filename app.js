let recognition;
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

// ===============================
// ΓΛΩΣΣΑ
// ===============================

greekBtn.onclick = () => setLanguage("el");
englishBtn.onclick = () => setLanguage("en");

function setLanguage(lang) {
    selected = lang;

    greekBtn.classList.toggle("active", lang === "el");
    englishBtn.classList.toggle("active", lang === "en");

    if (lang === "el") {
        statusEl.textContent = "Μιλήστε Ελληνικά → Αγγλικά";
    } else {
        statusEl.textContent = "Speak English → Greek";
    }
}

// ===============================
// ΜΙΚΡΟΦΩΝΟ
// ===============================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    statusEl.textContent =
        "Το πρόγραμμα περιήγησης δεν υποστηρίζει αναγνώριση φωνής.";
}

function startRecognition() {
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();

    recognition.lang =
        selected === "el"
            ? "el-GR"
            : "en-US";

    recognition.continuous = false;
    recognition.interimResults = false;

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
            statusEl.textContent = "Δεν ακούστηκε κείμενο.";
            return;
        }

        originalEl.textContent = text;

        await translateText(text);
    };

    recognition.onerror = (event) => {
        console.error(event.error);

        isRecording = false;
        mic.classList.remove("recording");

        statusEl.textContent =
            "Σφάλμα μικροφώνου: " + event.error;
    };

    recognition.onend = () => {
        isRecording = false;
        mic.classList.remove("recording");
    };

    recognition.start();
}

mic.onclick = () => {
    if (isRecording) {
        if (recognition) {
            recognition.stop();
        }

        isRecording = false;
        mic.classList.remove("recording");

        return;
    }

    startRecognition();
};

// ===============================
// ΜΕΤΑΦΡΑΣΗ
// ===============================

async function translateText(text) {
    try {
        statusEl.textContent = "⏳ Μετάφραση...";

        const from = selected;
        const to = selected === "el" ? "en" : "el";

        const response = await fetch("/api/translate", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text: text,
                from: from,
                to: to
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Η μετάφραση απέτυχε."
            );
        }

        originalEl.textContent =
            data.original || text;

        translatedEl.textContent =
            data.translated || "—";

        statusEl.textContent = "Έτοιμο ✅";

        playSpeech(data.translated);

    } catch (error) {
        console.error(error);

        translatedEl.textContent = "—";

        statusEl.textContent =
            "Σφάλμα: " + error.message;
    }
}

// ===============================
// ΦΩΝΗ
// ===============================

function playSpeech(text) {
    if (!text) return;

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang =
        selected === "el"
            ? "en-US"
            : "el-GR";

    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    lastAudio = speech;

    window.speechSynthesis.speak(speech);
}

playBtn.onclick = () => {
    if (lastAudio) {
        window.speechSynthesis.cancel();

        const newSpeech =
            new SpeechSynthesisUtterance(
                lastAudio.text
            );

        newSpeech.lang = lastAudio.lang;
        newSpeech.rate = 1;
        newSpeech.pitch = 1;
        newSpeech.volume = 1;

        window.speechSynthesis.speak(newSpeech);
    } else if (translatedEl.textContent !== "—") {
        playSpeech(translatedEl.textContent);
    }
};

// ===============================
// ΕΓΚΑΤΑΣΤΑΣΗ PWA
// ===============================

let deferredPrompt = null;

window.addEventListener(
    "beforeinstallprompt",
    (event) => {
        event.preventDefault();

        deferredPrompt = event;

        if (installBtn) {
            installBtn.hidden = false;
        }
    }
);

if (installBtn) {
    installBtn.onclick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        await deferredPrompt.userChoice;

        deferredPrompt = null;

        installBtn.hidden = true;
    };
}

// ===============================
// SERVICE WORKER
// ===============================

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
        .then(() => {
            console.log("Service Worker ενεργό.");
        })
        .catch((error) => {
            console.error(
                "Service Worker error:",
                error
            );
        });
}

// ===============================
// ΑΡΧΙΚΗ ΓΛΩΣΣΑ
// ===============================

setLanguage("el");
