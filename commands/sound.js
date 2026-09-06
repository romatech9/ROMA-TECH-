const axios = require('axios');

const sounds = {
  sound1: { name: 'Sound 1', url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788643779/wf3imagjeja0gdwpt8jb.mp4' },
  
  sound2: { name: 'Sound 2', url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788642940/lwil81mztdetzhic4hwm.mp3' },
  
  sound3: { name: 'Sound 3', url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788643169/qgqb8eloumjdutseqdfj.mp4' },
  
  sound4: { name: 'Sound 4', url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788644510/tgckwpujhdyg6ndqt1mw.mp4' },
  
  sound5: { name: 'Sound 5', url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788643123/hgnjzupuskd7f6wih9qd.mp4' }
};

function soundMenu(sock, msg, jid) {
  return sock.sendMessage(jid, {
    text: `🎵 *MUFASER-X SOUNDS*\n\n1️⃣.sound1 or.sound 1 — Sound 1\n2️⃣.sound2 or.sound 2 — Sound 2\n3️⃣.sound3 or.sound 3 — Sound 3\n4️⃣.sound4 or.sound 4 — Sound 4\n5️⃣.sound5 or.sound 5 — Sound 5\n\n🎧 Example:.sound 1`
  }, { quoted: msg });
}

async function sendSound(sock, msg, jid, sound) {
  try {
    const response = await axios.get(sound.url, {
      responseType: 'arraybuffer',
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
      timeout: 120000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const buffer = Buffer.from(response.data);
    return sock.sendMessage(jid, {
      audio: buffer,
      mimetype: response.headers['content-type'] || 'audio/mpeg',
      ptt: false
    }, { quoted: msg });
  } catch (error) {
    console.error(`[${sound.name} ERROR]`, error.message);
    return sock.sendMessage(jid, { text: `❌ Failed to send ${sound.name}.\nCheck Cloudinary URL.` }, { quoted: msg });
  }
}

module.exports = {
  name: 'sound',
  aliases: ['sounds', 'sound1', 'sound2', 'sound3', 'sound4', 'sound5', 's1', 's2', 's3', 's4', 's5'],
  desc: 'Play MUFASER-X sounds',
  category: 'Media',
  usage: '.sound',

  async execute(sock, msg, jid, args) {
    try {
      const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
      const clean = text.toLowerCase().replace(/^\./, ''); // remove dot

      // clean = "sound 1", "sound1", "s 2", etc
      let num = null;

      // Case 1:.sound 1 -> args[0] = "1"
      if (args && args[0] && /^[1-5]$/.test(args[0])) num = args[0];

      // Case 2: parse from text itself
      const match = clean.match(/(?:sound|s)\s*([1-5])$/);
      if (match) num = match[1];

      if (num) {
        if (num === '1') return sendSound(sock, msg, jid, sounds.sound1);
        if (num === '2') return sendSound(sock, msg, jid, sounds.sound2);
        if (num === '3') return sendSound(sock, msg, jid, sounds.sound3);
        if (num === '4') return sendSound(sock, msg, jid, sounds.sound4);
        if (num === '5') return sendSound(sock, msg, jid, sounds.sound5);
      }

      // If just.sound
      if (clean === 'sound' || clean === 'sounds') return soundMenu(sock, msg, jid);

      // Direct.sound1 without space (fallback if handler sends command as sound1)
      if (clean === 'sound1' || clean === 's1') return sendSound(sock, msg, jid, sounds.sound1);
      if (clean === 'sound2' || clean === 's2') return sendSound(sock, msg, jid, sounds.sound2);
      if (clean === 'sound3' || clean === 's3') return sendSound(sock, msg, jid, sounds.sound3);
      if (clean === 'sound4' || clean === 's4') return sendSound(sock, msg, jid, sounds.sound4);
      if (clean === 'sound5' || clean === 's5') return sendSound(sock, msg, jid, sounds.sound5);

      return soundMenu(sock, msg, jid);
    } catch (error) {
      console.error('[SOUND COMMAND ERROR]', error);
      return sock.sendMessage(jid, { text: '❌ Sound command failed.' }, { quoted: msg });
    }
  }
};