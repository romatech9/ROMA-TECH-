// ============================================================
// Command:.p
// ============================================================

module.exports = {
  name: 'p',
  aliases: ['ping'],
  description: 'Check if the bot is online',

  async execute(sock, msg, jid, args) {
    const start = Date.now();
    const sent = await sock.sendMessage(jid, { text: `🏓 Pinging...` }, { quoted: msg });

    // fancy numbers: 0-9 -> 𝟎-𝟗
    const fancyNums = {
      '0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗'
    };
    const ms = Date.now() - start;
    const fancyMs = String(ms).split('').map(d => fancyNums[d] || d).join('');

    // exact style you wanted
    const finalText = `_𝑴𝑼𝑭𝑨𝑺𝑬𝑹-𝑿 𝑼𝑳𝑻𝑹𝑨_ 𝒔𝒑𝒆𝒆𝒅:
    ${fancyMs}𝒎𝒔`;

    await sock.sendMessage(jid, { text: finalText, edit: sent.key });
  },
};