module.exports = {
  name: 'sound3',
  aliases: ['s3', 'sound_3'],
  desc: 'Sound 3',
  category: 'Media',
  async execute(sock, msg, jid) {
    try {
      await sock.sendMessage(jid, {
        audio: { url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788643169/qgqb8eloumjdutseqdfj.mp4' },
        mimetype: 'audio/mp4',
        ptt: false
      }, { quoted: msg });
    } catch (e) {
      console.error('[Sound3]', e);
      await sock.sendMessage(jid, { text: '❌ Failed to send Sound 3' }, { quoted: msg });
    }
  }
};