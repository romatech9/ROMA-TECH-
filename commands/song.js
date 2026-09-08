const axios = require('axios');

const API_BASE = 'https://apix.wolvarex.com';

module.exports = {
  name: 'song',
  desc: 'Search and download songs',
  category: 'Download',
  usage: '.song <song name>',

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
              '🎵 *SONG DOWNLOADER*\n\n' +
              'Usage:\n' +
              '`.song <song name>`\n\n' +
              'Example:\n' +
              '`.song NF Home`'
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // API KEY
      // ---------------------------------------------

      const apiKey = process.env.WOLFT_API_KEY;

      if (!apiKey) {
        console.error('[SONG] WOLFT_API_KEY is missing');

        return sock.sendMessage(
          jid,
          {
            text: '❌ Song API key is not configured.'
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // SEARCH SONG
      // ---------------------------------------------

      await sock.sendMessage(
        jid,
        {
          text:
            `🔎 *Searching...*\n\n` +
            `🎵 ${query}`
        },
        { quoted: msg }
      );


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
              `🔎 Search: ${query}`
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // SELECT BEST RESULT
      // ---------------------------------------------

      const track = data.tracks[0];

      if (!track.youtubeURL) {
        return sock.sendMessage(
          jid,
          {
            text: '❌ The song result has no YouTube URL.'
          },
          { quoted: msg }
        );
      }


      const title =
        track.title ||
        query;

      const artist =
        track.artist ||
        'Unknown Artist';

      const duration =
        track.duration ||
        'Unknown';


      // ---------------------------------------------
      // GET MP3 DOWNLOAD URL
      // ---------------------------------------------

      const downloadResponse = await axios.get(
        `${API_BASE}/api/music/ytmp3-download`,
        {
          params: {
            url: track.youtubeURL
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
              `❌ *Download failed.*\n\n` +
              `🎵 ${title}\n` +
              `👤 ${artist}`
          },
          { quoted: msg }
        );
      }


      // ---------------------------------------------
      // GET MP3 URL
      // ---------------------------------------------

      const audioURL =
        downloadData.downloadURL ||
        downloadData.directURL ||
        downloadData.proxyURL;


      if (!audioURL) {
        console.error(
          '[SONG] No audio URL:',
          downloadData
        );

        return sock.sendMessage(
          jid,
          {
            text: '❌ API did not return an audio URL.'
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
          maxContentLength: 50 * 1024 * 1024,
          maxBodyLength: 50 * 1024 * 1024
        }
      );


      const audioBuffer =
        Buffer.from(audioResponse.data);


      if (!audioBuffer.length) {
        return sock.sendMessage(
          jid,
          {
            text: '❌ Downloaded audio is empty.'
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
          fileName: `${title}.mp3`,
          ptt: false,

          contextInfo: {
            externalAdReply: {
              title: title,
              body: `${artist} • ${duration}`,
              mediaType: 2,
              thumbnailUrl: track.thumbnail || undefined,
              sourceUrl: track.youtubeURL
            }
          }
        },
        { quoted: msg }
      );


      console.log(
        `[SONG] Sent: ${title} - ${artist}`
      );

    } catch (error) {

      console.error(
        '[SONG ERROR]',
        error.response?.data ||
        error.message
      );

      let message =
        '❌ *Song download failed.*';

      if (error.code === 'ECONNABORTED') {
        message +=
          '\n\n⏱️ API request timed out.';
      }

      return sock.sendMessage(
        jid,
        {
          text: message
        },
        { quoted: msg }
      );
    }
  }
};