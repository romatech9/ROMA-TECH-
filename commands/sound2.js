module.exports = {
  name: 'sound2',
  aliases: ['s2', 'sound_2'],
  desc: 'Sound 2',
  category: 'Media',
  async execute(sock, msg, jid) {
    try {
      await sock.sendMessage(jid, {
        audio: { url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788642940/lwil81mztdetzhic4hwm.mp3' },
        mimetype: 'audio/mpeg',
        ptt: false
      }, { quoted: msg });
    } catch (e) {
      console.error('[Sound2]', e);
      await sock.sendMessage(jid, { text: '❌ Failed to send Sound 2' }, { quoted: msg });
    }
  }
};