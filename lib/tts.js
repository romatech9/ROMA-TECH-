// ============================================================
// MUFASER-X — PROFESSIONAL TTS ENGINE
// ROMA-TECH
// ============================================================

const googleTTS = require('google-tts-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const TEMP_DIR = path.join(
  process.cwd(),
  'tmp',
  'tts'
);

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ------------------------------------------------------------
// Generate professional WhatsApp voice
// ------------------------------------------------------------

async function generateVoice(text) {

  if (!text || !text.trim()) {
    throw new Error('Text is empty.');
  }

  text = text
    .replace(/\s+/g, ' ')
    .trim();

  const id =
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const mp3 = path.join(
    TEMP_DIR,
    `${id}.mp3`
  );

  const ogg = path.join(
    TEMP_DIR,
    `${id}.ogg`
  );

  try {

    // --------------------------------------------------------
    // Google TTS
    // --------------------------------------------------------

    const audioUrl = googleTTS.getAudioUrl(
      text,
      {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com'
      }
    );

    const response = await axios.get(
      audioUrl,
      {
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );

    fs.writeFileSync(
      mp3,
      Buffer.from(response.data)
    );

    // --------------------------------------------------------
    // MP3 → OGG/OPUS
    // Professional voice-note processing
    // --------------------------------------------------------

    await new Promise((resolve, reject) => {

      ffmpeg(mp3)

        .audioCodec('libopus')

        .audioChannels(1)

        .audioFrequency(48000)

        .audioBitrate('64k')

        .audioFilters([
          'highpass=f=70',
          'lowpass=f=15000',
          'loudnorm=I=-16:TP=-1.5:LRA=11'
        ])

        .format('ogg')

        .on('end', resolve)

        .on('error', reject)

        .save(ogg);
    });

    if (!fs.existsSync(ogg)) {
      throw new Error(
        'FFmpeg did not create the voice file.'
      );
    }

    return ogg;

  } catch (error) {

    // Clean failed files
    try {
      if (fs.existsSync(mp3)) {
        fs.unlinkSync(mp3);
      }
    } catch {}

    try {
      if (fs.existsSync(ogg)) {
        fs.unlinkSync(ogg);
      }
    } catch {}

    throw error;
  }
}

module.exports = {
  generateVoice
};