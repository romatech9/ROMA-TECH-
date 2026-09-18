// ============================================================
// MUFASER-X — AI IMAGE EDIT
// Powered By PixelAPI
// Developer: ROMA-TECH
// ============================================================

const {
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const os = require('os');
const path = require('path');

const API_KEY = process.env.PIXEL_API_KEY;

const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(message) {

  const type = Object.keys(message)[0];

  const stream =
    await downloadContentFromMessage(
      message[type],
      'image'
    );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function pollPixelAPI(generationId) {

  const maxAttempts = 30;

  for (let i = 0; i < maxAttempts; i++) {

    await sleep(2500);

    const response = await fetch(
      `https://api.pixelapi.dev/v1/image/${generationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'User-Agent': 'MUFASER-X/1.0'
        }
      }
    );

    const data = await response.json();

    console.log(
      '[PixelAPI] Status:',
      JSON.stringify(data)
    );

    if (data.status === 'completed') {

      if (!data.output_url) {
        throw new Error(
          'PixelAPI completed the job but returned no output_url.'
        );
      }

      return data.output_url;
    }

    if (
      data.status === 'failed' ||
      data.status === 'blocked'
    ) {

      throw new Error(
        data.error ||
        `PixelAPI job ${data.status}.`
      );
    }
  }

  throw new Error(
    'PixelAPI processing timed out.'
  );
}

async function getPixelOutput(data) {

  // Direct result
  if (data.output_url) {
    return data.output_url;
  }

  // Async result
  if (data.generation_id) {
    return await pollPixelAPI(
      data.generation_id
    );
  }

  // Some responses may use id
  if (data.id) {
    return await pollPixelAPI(
      data.id
    );
  }

  throw new Error(
    `PixelAPI returned no output image or generation ID. Response: ${JSON.stringify(data)}`
  );
}

async function downloadOutput(url) {

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Could not download edited image (${response.status}).`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

module.exports = {

  name: 'aiedit',

  aliases: [
    'editai',
    'imageedit'
  ],

  description:
    'Edit an image using AI instructions.',

  category: 'AI',

  usage:
    '.aiedit <instruction>',

  async execute(sock, m, args) {

    try {

      if (!API_KEY) {

        return await sock.sendMessage(
          m.key.remoteJid,
          {
            text:
              '❌ *AI image editing failed.*\n\n' +
              '⚠️ *Reason:* PIXEL_API_KEY is missing from `.env`.'
          },
          {
            quoted: m
          }
        );
      }

      const instruction =
        args.join(' ').trim();

      if (!instruction) {

        return await sock.sendMessage(
          m.key.remoteJid,
          {
            text:
              '❌ *Missing instruction.*\n\n' +

              'Example:\n' +
              '`.aiedit add a kid in the middle`\n\n' +

              'Other examples:\n' +
              '`.aiedit change the background to a beach`\n' +
              '`.aiedit make the shirt black`\n' +
              '`.aiedit remove the person on the left`'
          },
          {
            quoted: m
          }
        );
      }

      // --------------------------------------------------------
      // FIND REPLIED IMAGE
      // --------------------------------------------------------

      const contextInfo =
        m.message?.extendedTextMessage
          ?.contextInfo;

      const quotedMessage =
        contextInfo?.quotedMessage;

      let imageMessage = null;

      if (quotedMessage?.imageMessage) {

        imageMessage =
          quotedMessage.imageMessage;

      } else if (
        m.message?.imageMessage
      ) {

        imageMessage =
          m.message.imageMessage;
      }

      if (!imageMessage) {

        return await sock.sendMessage(
          m.key.remoteJid,
          {
            text:
              '❌ *Reply to an image first.*\n\n' +
              `Example:\n.reply to an image with \`.aiedit ${instruction}\``
          },
          {
            quoted: m
          }
        );
      }

      await sock.sendMessage(
        m.key.remoteJid,
        {
          text:
            '🎨 *MUFASER-X AI EDIT*\n\n' +
            '⏳ Processing your image...\n' +
            '🤖 Powered By PixelAPI'
        },
        {
          quoted: m
        }
      );

      // --------------------------------------------------------
      // DOWNLOAD IMAGE
      // --------------------------------------------------------

      const imageBuffer =
        await downloadImage({
          imageMessage
        });

      if (!imageBuffer?.length) {

        throw new Error(
          'Failed to download the source image.'
        );
      }

      const mime =
        imageMessage.mimetype ||
        'image/jpeg';

      const base64 =
        imageBuffer.toString('base64');

      const dataUri =
        `data:${mime};base64,${base64}`;

      // --------------------------------------------------------
      // PIXELAPI
      // --------------------------------------------------------

      console.log(
        '[PixelAPI] Sending image edit request...'
      );

      console.log(
        '[PixelAPI] Instruction:',
        instruction
      );

      const response =
        await fetch(
          'https://api.pixelapi.dev/v1/image/edit',
          {
            method: 'POST',

            headers: {
              'Authorization':
                `Bearer ${API_KEY}`,

              'Content-Type':
                'application/json',

              'User-Agent':
                'MUFASER-X/1.0'
            },

            body: JSON.stringify({

              image: dataUri,

              prompt: instruction,

              steps: 40,

              cfg_scale: 4.0

            })
          }
        );

      const rawText =
        await response.text();

      console.log(
        '[PixelAPI] HTTP:',
        response.status
      );

      console.log(
        '[PixelAPI] Response:',
        rawText
      );

      let data;

      try {

        data =
          JSON.parse(rawText);

      } catch {

        throw new Error(
          `PixelAPI returned invalid JSON: ${rawText.slice(0, 500)}`
        );
      }

      if (!response.ok) {

        throw new Error(
          data.error ||
          data.message ||
          `PixelAPI HTTP ${response.status}`
        );
      }

      // --------------------------------------------------------
      // GET OUTPUT
      // --------------------------------------------------------

      const outputUrl =
        await getPixelOutput(data);

      console.log(
        '[PixelAPI] Output:',
        outputUrl
      );

      // --------------------------------------------------------
      // DOWNLOAD RESULT
      // --------------------------------------------------------

      const outputBuffer =
        await downloadOutput(outputUrl);

      if (!outputBuffer?.length) {

        throw new Error(
          'PixelAPI returned an empty output image.'
        );
      }

      // --------------------------------------------------------
      // SEND RESULT
      // --------------------------------------------------------

      await sock.sendMessage(
        m.key.remoteJid,
        {
          image: outputBuffer,

          caption:
            '✨ *AI IMAGE EDITED*\n\n' +
            `📝 ${instruction}\n\n` +
            '🤖 Powered By MUFASER-X\n' +
            '👨‍💻 ROMA-TECH'
        },
        {
          quoted: m
        }
      );

      console.log(
        '[PixelAPI] AI edit completed successfully.'
      );

    } catch (error) {

      console.error(
        '[AI EDIT ERROR]',
        error
      );

      await sock.sendMessage(
        m.key.remoteJid,
        {
          text:
            '❌ *AI image editing failed.*\n\n' +
            `⚠️ *Reason:* ${error.message || 'Unknown error'}`
        },
        {
          quoted: m
        }
      );
    }
  }
};