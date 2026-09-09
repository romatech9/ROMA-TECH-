const axios = require('axios');

const API_BASE = 'https://apix.wolvarex.com';

function formatDuration(duration) {
  if (!duration) return '0:00';

  // API already returns formats like 4:45
  if (typeof duration === 'string') {
    return duration;
  }

  const seconds = Number(duration);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatNumber(value) {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return 'Unknown';
  }

  return n.toLocaleString();
}

function getRequesterName(msg, sender) {
  return (
    msg?.pushName ||
    sender?.name ||
    sender?.pushName ||
    'Unknown'
  );
}

module.exports = {
  name: 'play',
  desc: 'Search and play a song',
  category: 'Download',
  usage: '.play <song name>',

  async execute(sock, msg, jid, args, sender, account) {
    try {

      // ---------------------------------------------
      // CHECK QUERY
      // ---------------------------------------------

      const query = args.join(' ').trim();

      if (!query) {
        return sock.sendMessage(
          jid,
          {
            text:
              '🎵 *PLAY*\n\n' +
              'Usage:\n' +
              '`.play <song name>`\n\n' +
              'Example:\n' +
              '`.play NF Home`'
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // API KEY
      // ---------------------------------------------

      const apiKey = process.env.WOLFT_API_KEY;

      if (!apiKey) {
        console.error('[PLAY] WOLFT_API_KEY is missing');

        return sock.sendMessage(
          jid,
          {
            text: '❌ Play API key is not configured.'
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // SEARCH
      // NO PROGRESS MESSAGE
      // ---------------------------------------------

      const searchResponse = await axios.get(
        `${API_BASE}/api/music/ytmp3-search`,
        {
          params: {
            q: query
          },

          headers: {
            'x-api-key': apiKey
          },

          timeout: 30000
        }
      );

      const data = searchResponse.data;


      if (
        !data ||
        data.success !== true ||
        !Array.isArray(data.tracks) ||
        data.tracks.length === 0
      ) {
        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *Song not found.*\n\n` +
              `🔎 ${query}`
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // FIRST / BEST RESULT
      // ---------------------------------------------

      const track = data.tracks[0];

      const title =
        track.title ||
        query;

      const artist =
        track.artist ||
        'Unknown';

      const duration =
        formatDuration(track.duration);

      const thumbnail =
        track.thumbnail;

      const youtubeURL =
        track.youtubeURL;


      // ---------------------------------------------
      // REQUESTER
      // ---------------------------------------------

      const requester =
        getRequesterName(msg, sender);


      // ---------------------------------------------
      // CAPTION
      // ---------------------------------------------

      const caption = `
🎵 *${title}*
👤 Artist: ${artist}

━━━━━━━━━━━━━━

🎧 Quality: Stream on YouTube

⏱ Duration: ${duration}

👀 Views: Unknown

❤️ Likes: Unknown

📥 Get MP3: From MUFASER-X 

👤 Requested by:
${requester}

━━━━━━━━━━━━━━

Powered By: MUFASER-X
`;


      // ---------------------------------------------
      // SEND THUMBNAIL + SONG INFO FIRST
      // ---------------------------------------------

      if (thumbnail) {

        const message = {
          image: {
            url: thumbnail
          },
          caption: caption.trim()
        };


        // Add YouTube button when URL exists
        if (youtubeURL) {
          message.buttons = [
            {
              buttonId: 'youtube',
              buttonText: {
                displayText: '▶️ Listen on YouTube'
              },
              type: 1
            }
          ];
        }


        try {
          await sock.sendMessage(
            jid,
            message,
            { quoted: msg }
          );
        } catch (buttonError) {

          // Some WhatsApp/Baileys versions reject
          // legacy buttons. Send image without buttons.

          console.log(
            '[PLAY] Button failed:',
            buttonError.message
          );

          await sock.sendMessage(
            jid,
            {
              image: {
                url: thumbnail
              },
              caption: caption.trim()
            },
            { quoted: msg }
          );
        }

      } else {

        await sock.sendMessage(
          jid,
          {
            text: caption.trim()
          },
          { quoted: msg }
        );

      }


      // ---------------------------------------------
      // GET MP3
      // ---------------------------------------------

      if (!youtubeURL) {
        return;
      }

      const downloadResponse = await axios.get(
        `${API_BASE}/api/music/ytmp3-download`,
        {
          params: {
            url: youtubeURL
          },

          headers: {
            'x-api-key': apiKey
          },

          timeout: 60000
        }
      );

      const downloadData =
        downloadResponse.data;


      if (
        !downloadData ||
        downloadData.success !== true
      ) {
        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *Unable to play:* ${title}`
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // MP3 URL
      // ---------------------------------------------

      const audioURL =
        downloadData.downloadURL ||
        downloadData.directURL ||
        downloadData.proxyURL;


      if (!audioURL) {
        return sock.sendMessage(
          jid,
          {
            text:
              `❌ No audio URL returned for:\n${title}`
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // DOWNLOAD MP3
      // ---------------------------------------------

      const audioResponse = await axios.get(
        audioURL,
        {
          responseType: 'arraybuffer',

          timeout: 120000,

          maxContentLength:
            50 * 1024 * 1024,

          maxBodyLength:
            50 * 1024 * 1024
        }
      );


      const audioBuffer =
        Buffer.from(audioResponse.data);


      if (!audioBuffer.length) {
        return sock.sendMessage(
          jid,
          {
            text:
              `❌ Empty audio received for:\n${title}`
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // SEND SONG
      // ---------------------------------------------

      await sock.sendMessage(
        jid,
        {
          audio: audioBuffer,

          mimetype: 'audio/mpeg',

          fileName:
            `${title}.mp3`,

          ptt: false
        },
        { quoted: msg }
      );


      console.log(
        `[PLAY] ${title} - ${artist}`
      );

    } catch (error) {

      console.error(
        '[PLAY ERROR]',
        error.response?.data ||
        error.message
      );

      return sock.sendMessage(
        jid,
        {
          text:
            '❌ *Play failed.*\n' +
            'Please try the song again.'
        },
        { quoted: msg }
      );
    }
  }
};