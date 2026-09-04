// ============================================================
// MUFASER-X — ANTI-EDIT
// OWNER ONLY • GLOBAL SYSTEM
// ============================================================

module.exports = {
  name: 'antiedit',

  aliases: ['antiedit', 'antied'],

  desc: 'Enable or disable the Anti-Edit system',

  category: 'Owner',

  usage: '.antiedit on | off',

  async execute(sock, msg, jid, args, sender, account) {

    // ========================================================
    // OWNER CHECK
    // ========================================================
    const isOwner = msg.key?.fromMe === true;

    if (!isOwner) {
      return sock.sendMessage(jid, {
        text:
`😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
      });
    }

    // ========================================================
    // GET COMMAND
    // ========================================================
    const state = String(args[0] || '').toLowerCase().trim();

    // ========================================================
    // SHOW STATUS
    // ========================================================
    if (!state) {
      return sock.sendMessage(jid, {
        text:
`╭━━━〔 🛡️ ANTI-EDIT 〕━━━╮
┃
┃  Status: ${account.antiedit ? '🟢 ON' : '🔴 OFF'}
┃  Mode: 🌐 Global
┃
╰━━━━━━━━━━━━━━━━━━━━╯

📌 Owner Controls:

.antiedit on
.antiedit off`
      });
    }

    // ========================================================
    // VALIDATION
    // ========================================================
    if (!['on', 'off'].includes(state)) {
      return sock.sendMessage(jid, {
        text:
`╭━━━〔 ⚠️ INVALID OPTION 〕━━━╮
┃
┃  Use one of the following:
┃
┃  • .antiedit on
┃  • .antiedit off
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
      });
    }

    // ========================================================
    // UPDATE SYSTEM
    // ========================================================
    account.antiedit = { dm: state === 'on', group: state === 'on', private: false };

    // ========================================================
    // ENABLED
    // ========================================================
    if (account.antiedit) {
      return sock.sendMessage(jid, {
        text:
`╭━━━〔 🛡️ ANTI-EDIT SYSTEM 〕━━━╮
┃
┃  🟢 STATUS: ENABLED
┃  🌐 MODE: GLOBAL
┃  👑 CONTROL: OWNER
┃
┃  Anti-Edit is now active.
┃  Edited messages can now be
┃  detected by MUFASER-X.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
✅ System activated successfully.`
      });
    }

    // ========================================================
    // DISABLED
    // ========================================================
    return sock.sendMessage(jid, {
      text:
`╭━━━〔 🛡️ ANTI-EDIT SYSTEM 〕━━━╮
┃
┃  🔴 STATUS: DISABLED
┃  🌐 MODE: GLOBAL
┃  👑 CONTROL: OWNER
┃
┃  Anti-Edit protection is now off.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
✅ System disabled successfully.`
    });
  }
};