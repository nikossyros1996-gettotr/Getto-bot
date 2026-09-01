# GETTO TRANSLATOR

A mobile-friendly Greek ↔ English voice translator.

Flow:
1. Browser records microphone audio.
2. Server sends it to OpenAI for transcription.
3. OpenAI translates Greek ↔ English.
4. OpenAI generates speech.
5. Browser plays the translated voice.

## Render
Create a Web Service from this repository.

- Build Command: `npm install`
- Start Command: `npm start`
- Environment variable: `OPENAI_API_KEY` = your OpenAI API key

Never put the API key inside `public/app.js` or any frontend file.

## Android
Once deployed, open the Render URL on Android Chrome. The site is installable as a PWA when the browser offers the install option.
