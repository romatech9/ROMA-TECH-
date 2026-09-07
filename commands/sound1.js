module.exports = {
  name: 'sound1',
  aliases: ['s1', 'sound_1'],
  desc: 'Sound 1',
  category: 'Media',
  async execute(sock, msg, jid) {
    try {
      await sock.sendMessage(jid, {
        audio: { url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788643779/wf3imagjeja0gdwpt8jb.mp4' },
        mimetype: 'audio/mp4',
        ptt: false
      }, { quoted: msg });
    } catch (e) {
      console.error('[Sound1]', e);
      await sock.sendMessage(jid, { text: '❌ Failed to send Sound 1' }, { quoted: msg });
    }
  }
};