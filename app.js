let recorder;
let chunks = [];
let stream;
let lastAudio = null;
let selected = "el";

const mic = document.getElementById("mic");
const statusEl = document.getElementById("status");
const originalEl = document.getElementById("original");
const translatedEl = document.getElementById("translated");
const playBtn = document.getElementById("play");
const greekBtn = document.getElementById("greekBtn");
const englishBtn = document.getElementById("englishBtn");
const installBtn = document.getElementById("install");

greekBtn.onclick = () => setLanguage("el");
englishBtn.onclick = () => setLanguage("en");

function setLanguage(lang) {
  selected = lang;
  greekBtn.classList.toggle("active", lang === "el");
  englishBtn.classList.toggle("active", lang === "en");
  statusEl.textContent = lang === "el"
    ? "Μιλήστε Ελληνικά → Αγγλικά"
    : "Speak English → Greek";
}

mic.onclick = async () => {
  if (recorder && recorder.state === "recording") {
    recorder.stop();
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    recorder.ondataavailable = e => {
      if (e.data.size) chunks.push(e.data);
    };

    recorder.onstop = sendAudio;
    recorder.start();

    mic.classList.add("recording");
    document.getElementById("micIcon").textContent = "⏹️";
    statusEl.textContent = selected === "el" ? "Ακούω Ελληνικά..." : "Listening to English...";
  } catch (e) {
    statusEl.textContent = "Δεν έχω πρόσβαση στο μικρόφωνο.";
  }
};

async function sendAudio() {
  mic.classList.remove("recording");
  document.getElementById("micIcon").textContent = "🎙️";
  stream?.getTracks().forEach(t => t.stop());

  statusEl.textContent = "Μετάφραση...";
  originalEl.textContent = "…";
  translatedEl.textContent = "…";
  playBtn.disabled = true;

  const blob = new Blob(chunks, { type: "audio/webm" });
  const form = new FormData();
  form.append("audio", blob, "speech.webm");

  try {
    const response = await fetch("/api/translate", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Translation failed");

    originalEl.textContent = data.original;
    translatedEl.textContent = data.translated;
    lastAudio = new Audio("data:audio/mp3;base64," + data.audio);
    playBtn.disabled = false;
    statusEl.textContent = "Έτοιμο ✅";
    lastAudio.play();
  } catch (e) {
    originalEl.textContent = "—";
    translatedEl.textContent = "—";
    statusEl.textContent = "Σφάλμα: " + e.message;
  }
}

playBtn.onclick = () => lastAudio?.play();

let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt = null;
  installBtn.hidden = true;
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}