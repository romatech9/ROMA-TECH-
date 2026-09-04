// ============================================================
// Command:.p
// ============================================================

module.exports = {
  name: 'p',
  aliases: ['ping'],
  description: 'Check if the bot is online',

  /**
   * @param {object} sock   - Baileys socket
   * @param {object} msg    - Full WAMessage object
   * @param {string} jid    - Chat JID (sender or group)
   * @param {string[]} args - Remaining arguments after prefix+command
   */
  async execute(sock, msg, jid, args) {
    const start = Date.now();
    const sent = await sock.sendMessage(jid, { text: `🏓 Pinging...` }, { quoted: msg });
    await sock.sendMessage(jid, { text: `🏓 *Pong ✅ Bot is online - MUFASER-X*\n⚡ Response: ${Date.now() - start}ms`, edit: sent.key });
  },
};