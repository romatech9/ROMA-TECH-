module.exports = {
  name: 'sound5',
  aliases: ['s5', 'sound_5'],
  desc: 'Sound 5',
  category: 'Media',
  async execute(sock, msg, jid) {
    try {
      await sock.sendMessage(jid, {
        audio: { url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788643123/hgnjzupuskd7f6wih9qd.mp4' },
        mimetype: 'audio/mp4',
        ptt: false
      }, { quoted: msg });
    } catch (e) {
      console.error('[Sound5]', e);
      await sock.sendMessage(jid, { text: '❌ Failed to send Sound 5' }, { quoted: msg });
    }
  }
};