// ============================================================
// MUFASER-X — AI IMAGE EDITOR
// Powered by PixelAPI
//
// Usage:
// Reply to an image with:
// .aiedit add a kid in the middle
//
// Examples:
// .aiedit change the background to a beach
// .aiedit make everyone wear black suits
// .aiedit turn this into anime style
// .aiedit add sunglasses
// .aiedit remove the person on the left
// ============================================================

const {
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');


// ============================================================
// DOWNLOAD IMAGE
// ============================================================

async function downloadImage(imageMessage) {

  const stream =
    await downloadContentFromMessage(
      imageMessage,
      'image'
    );

  const chunks = [];

  for await (
    const chunk of stream
  ) {

    chunks.push(chunk);

  }

  const buffer =
    Buffer.concat(chunks);

  if (!buffer.length) {

    throw new Error(
      'Downloaded image is empty.'
    );

  }

  return buffer;

}


// ============================================================
// GET REPLIED MESSAGE
// ============================================================

function getQuotedMessage(msg) {

  return (
    msg?.message
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage
  );

}


// ============================================================
// COMMAND
// ============================================================

module.exports = {

  name: 'aiedit',

  aliases: [
    'editai',
    'aiphoto',
    'imageedit'
  ],

  desc:
    'Edit an image using AI',

  category:
    'AI',

  usage:
    '.aiedit <instruction> [reply to image]',


  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    try {

      // ======================================================
      // CHECK API KEY
      // ======================================================

      const apiKey =
        process.env.PIXEL_API_KEY;

      if (!apiKey) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *PixelAPI is not configured.*\n\n' +
              '⚙️ Add `PIXEL_API_KEY` to your `.env` file.'
          },
          {
            quoted: msg
          }
        );

      }


      // ======================================================
      // GET INSTRUCTION
      // ======================================================

      const instruction =
        args
          ?.join(' ')
          ?.trim();


      if (!instruction) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Please tell me what you want to change.*\n\n' +

              '*Example:*\n' +
              '`.aiedit add a kid in the middle`\n\n' +

              '*More examples:*\n' +
              '`.aiedit change the background to a beach`\n' +
              '`.aiedit add sunglasses`\n' +
              '`.aiedit make everyone wear black suits`\n' +
              '`.aiedit turn this into anime style`'
          },
          {
            quoted: msg
          }
        );

      }


      // ======================================================
      // GET QUOTED MESSAGE
      // ======================================================

      const quoted =
        getQuotedMessage(msg);


      if (!quoted) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to an image with .aiedit*\n\n' +
              '*Example:*\n' +
              'Reply to a photo and type:\n' +
              '`.aiedit add a kid in the middle`'
          },
          {
            quoted: msg
          }
        );

      }


      // ======================================================
      // CHECK IMAGE
      // ======================================================

      const imageMessage =
        quoted.imageMessage;


      if (!imageMessage) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *The replied message is not an image.*\n\n' +
              'Reply to a photo and tell me what to edit.'
          },
          {
            quoted: msg
          }
        );

      }


      // ======================================================
      // PROCESSING REACTION
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          react: {
            text: '🎨',
            key: msg.key
          }
        }
      );


      // ======================================================
      // DOWNLOAD IMAGE
      // ======================================================

      console.log(
        '[AIEdit] ⬇️ Downloading image...'
      );

      const imageBuffer =
        await downloadImage(
          imageMessage
        );


      console.log(
        '[AIEdit] 📦 Image:',
        imageBuffer.length,
        'bytes'
      );


      // ======================================================
      // DETERMINE MIME TYPE
      // ======================================================

      const mimeType =
        imageMessage.mimetype ||
        'image/jpeg';


      // ======================================================
      // CONVERT TO DATA URI
      // ======================================================

      const base64 =
        imageBuffer.toString(
          'base64'
        );

      const dataUri =
        `data:${mimeType};base64,${base64}`;


      // ======================================================
      // SEND TO PIXELAPI
      // ======================================================

      console.log(
        '[AIEdit] 🤖 Sending image to PixelAPI...'
      );

      console.log(
        '[AIEdit] 📝 Instruction:',
        instruction
      );


      const response =
        await fetch(
          'https://api.pixelapi.dev/v1/image/edit',
          {
            method: 'POST',

            headers: {
              'Authorization':
                `Bearer ${apiKey}`,

              'Content-Type':
                'application/json',

              'User-Agent':
                'MUFASER-X/1.0'
            },

            body:
              JSON.stringify({

                image:
                  dataUri,

                prompt:
                  instruction,

                steps:
                  40,

                cfg_scale:
                  4.0

              })
          }
        );


      // ======================================================
      // READ RESPONSE
      // ======================================================

      const data =
        await response.json();


      console.log(
        '[AIEdit] PixelAPI response:',
        data
      );


      if (!response.ok) {

        throw new Error(
          data?.error ||
          data?.message ||
          `PixelAPI returned HTTP ${response.status}`
        );

      }


      // ======================================================
      // GET OUTPUT URL
      // ======================================================

      const outputUrl =
        data?.output_url;


      if (!outputUrl) {

        throw new Error(
          'PixelAPI did not return an output image.'
        );

      }


      // ======================================================
      // DOWNLOAD RESULT
      // ======================================================

      console.log(
        '[AIEdit] ⬇️ Downloading edited image...'
      );


      const resultResponse =
        await fetch(
          outputUrl
        );


      if (!resultResponse.ok) {

        throw new Error(
          `Could not download edited image. HTTP ${resultResponse.status}`
        );

      }


      const resultArrayBuffer =
        await resultResponse.arrayBuffer();


      const resultBuffer =
        Buffer.from(
          resultArrayBuffer
        );


      if (!resultBuffer.length) {

        throw new Error(
          'Edited image is empty.'
        );

      }


      console.log(
        '[AIEdit] ✅ Edited image:',
        resultBuffer.length,
        'bytes'
      );


      // ======================================================
      // SEND RESULT
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          image:
            resultBuffer,

          mimetype:
            'image/png',

          caption:
            `🎨 *AI EDIT COMPLETE*\n\n` +
            `📝 *Request:* ${instruction}\n\n` +
            `⚡ *Powered By MUFASER-X*`
        },
        {
          quoted: msg
        }
      );


      // ======================================================
      // SUCCESS REACTION
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          react: {
            text: '✅',
            key: msg.key
          }
        }
      );


      console.log(
        '[AIEdit] ✅ Image sent successfully.'
      );


    } catch (error) {

      console.error(
        '[AIEdit] ❌ Error:',
        error?.message ||
        error
      );


      try {

        await sock.sendMessage(
          jid,
          {
            text:
              `❌ *AI image editing failed.*\n\n` +
              `⚠️ *Reason:* ${
                error?.message ||
                'Unknown error.'
              }`
          },
          {
            quoted: msg
          }
        );

      } catch (sendError) {

        console.error(
          '[AIEdit] ❌ Could not send error:',
          sendError?.message ||
          sendError
        );

      }

    }

  }

};