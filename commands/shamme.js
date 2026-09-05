// ============================================================
// MUFASER-X — SHAMME VOICE SYSTEM
// ROMA-TECH
// Female Google TTS voice
// ============================================================

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const googleTTS = require('google-tts-api');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const TEMP_DIR = path.join(
  process.cwd(),
  'tmp',
  'shamme'
);

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ------------------------------------------------------------
// Split long text safely
// ------------------------------------------------------------

function splitText(text, maxLength = 180) {

  const words = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ');

  const chunks = [];
  let current = '';

  for (const word of words) {

    if ((current + ' ' + word).trim().length > maxLength) {

      if (current.trim()) {
        chunks.push(current.trim());
      }

      current = word;

    } else {

      current = `${current} ${word}`.trim();
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// ------------------------------------------------------------
// Download audio
// ------------------------------------------------------------

async function downloadAudio(url, file) {

  const response = await axios.get(
    url,
    {
      responseType: 'arraybuffer',
      timeout: 30000
    }
  );

  fs.writeFileSync(
    file,
    Buffer.from(response.data)
  );
}

// ------------------------------------------------------------
// Convert MP3 → OGG/OPUS
// ------------------------------------------------------------

function convertToOgg(input, output) {

  return new Promise((resolve, reject) => {

    ffmpeg(input)

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

      .save(output);
  });
}

// ------------------------------------------------------------
// Create one voice file from a text chunk
// ------------------------------------------------------------

async function createChunk(text, id, index) {

  const mp3 = path.join(
    TEMP_DIR,
    `${id}-${index}.mp3`
  );

  const ogg = path.join(
    TEMP_DIR,
    `${id}-${index}.ogg`
  );

  try {

    const url = googleTTS.getAudioUrl(
      text,
      {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com'
      }
    );

    await downloadAudio(
      url,
      mp3
    );

    await convertToOgg(
      mp3,
      ogg
    );

    return ogg;

  } finally {

    try {
      if (fs.existsSync(mp3)) {
        fs.unlinkSync(mp3);
      }
    } catch {}
  }
}

// ------------------------------------------------------------
// Merge OGG voice chunks into one voice note
// ------------------------------------------------------------

async function mergeAudio(files, output) {

  if (files.length === 1) {

    fs.copyFileSync(
      files[0],
      output
    );

    return;
  }

  const listFile = path.join(
    TEMP_DIR,
    `list-${Date.now()}.txt`
  );

  const content = files
    .map(file =>
      `file '${file.replace(/'/g, "'\\''")}'`
    )
    .join('\n');

  fs.writeFileSync(
    listFile,
    content
  );

  try {

    await new Promise((resolve, reject) => {

      ffmpeg()

        .input(listFile)

        .inputOptions([
          '-f concat',
          '-safe 0'
        ])

        .outputOptions([
          '-c copy'
        ])

        .format('ogg')

        .on('end', resolve)

        .on('error', reject)

        .save(output);
    });

  } finally {

    try {
      fs.unlinkSync(listFile);
    } catch {}
  }
}

// ============================================================
// COMMAND
// ============================================================

module.exports = {

  name: 'shamme',

  aliases: [
    'sham',
    'speak'
  ],

  desc: 'Convert text or replied messages into a voice note',

  category: 'AI',

  usage: '.shamme <text>',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    let finalFile = null;
    const chunkFiles = [];

    try {

      // ------------------------------------------------------
      // Text typed after command
      // ------------------------------------------------------

      let text = Array.isArray(args)
        ? args.join(' ').trim()
        : '';

      // ------------------------------------------------------
      // If no text, read replied message
      // ------------------------------------------------------

      if (!text) {

        const context =
          msg?.message?.extendedTextMessage?.contextInfo;

        const quoted = context?.quotedMessage;

        if (quoted) {

          text =
            quoted.conversation ||

            quoted.extendedTextMessage?.text ||

            quoted.imageMessage?.caption ||

            quoted.videoMessage?.caption ||

            quoted.documentMessage?.caption ||

            quoted.buttonsResponseMessage?.selectedDisplayText ||

            quoted.listResponseMessage?.title ||

            '';
        }
      }

      text = String(text || '')
        .replace(/\s+/g, ' ')
        .trim();

      // ------------------------------------------------------
      // Nothing to speak
      // ------------------------------------------------------

      if (!text) {

        return sock.sendMessage(
          jid,
          {
            text:
              `🎙️ *SHAMME VOICE*\n\n` +
              `Send text after the command or reply to a message.\n\n` +
              `Example:\n` +
              `.shamme Hello everyone ❤️`
          },
          {
            quoted: msg
          }
        );
      }

      // ------------------------------------------------------
      // Split LONG messages
      // ------------------------------------------------------

      const chunks = splitText(
        text,
        180
      );

      await sock.sendMessage(
        jid,
        {
          text:
            `🎙️ *SHAMME VOICE*\n\n` +
            `Generating ${chunks.length} voice section${chunks.length > 1 ? 's' : ''}...`
        },
        {
          quoted: msg
        }
      );

      // ------------------------------------------------------
      // Generate all chunks
      // ------------------------------------------------------

      const id =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      for (
        let i = 0;
        i < chunks.length;
        i++
      ) {

        const file =
          await createChunk(
            chunks[i],
            id,
            i
          );

        chunkFiles.push(file);
      }

      // ------------------------------------------------------
      // Final file
      // ------------------------------------------------------

      finalFile = path.join(
        TEMP_DIR,
        `${id}-final.ogg`
      );

      await mergeAudio(
        chunkFiles,
        finalFile
      );

      // ------------------------------------------------------
      // Send WhatsApp voice note
      // ------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          audio: {
            url: finalFile
          },

          mimetype:
            'audio/ogg; codecs=opus',

          ptt: true
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[SHAMME ERROR]',
        error
      );

      await sock.sendMessage(
        jid,
        {
          text:
            `❌ *SHAMME FAILED*\n\n` +
            `${error?.message || 'Unknown error'}`
        },
        {
          quoted: msg
        }
      );

    } finally {

      // ------------------------------------------------------
      // Cleanup
      // ------------------------------------------------------

      for (const file of chunkFiles) {

        try {

          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }

        } catch {}
      }

      if (finalFile) {

        try {

          if (fs.existsSync(finalFile)) {
            fs.unlinkSync(finalFile);
          }

        } catch {}
      }
    }
  }
};