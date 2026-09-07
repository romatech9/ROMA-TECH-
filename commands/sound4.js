module.exports = {
  name: 'sound4',
  aliases: ['s4', 'sound_4'],
  desc: 'Sound 4',
  category: 'Media',
  async execute(sock, msg, jid) {
    try {
      await sock.sendMessage(jid, {
        audio: { url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788644510/tgckwpujhdyg6ndqt1mw.mp4' },
        mimetype: 'audio/mp4',
        ptt: false
      }, { quoted: msg });
    } catch (e) {
      console.error('[Sound4]', e);
      await sock.sendMessage(jid, { text: '❌ Failed to send Sound 4' }, { quoted: msg });
    }
  }
};