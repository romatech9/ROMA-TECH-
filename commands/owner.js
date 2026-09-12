// ============================================================
// MUFASER-X — OWNER COMMAND
// Usage: .owner
// ============================================================

module.exports = {
  name: 'owner',

  async execute(sock, msg, jid, args, sender, account) {

    const ownerNumber = '256791480644';
    const ownerName = 'ROMA-TECH';

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
ORG:ROMA-TECH;
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}
END:VCARD`;

    await sock.sendMessage(
      jid,
      {
        contacts: {
          displayName: ownerName,
          contacts: [
            { vcard }
          ]
        }
      },
      { quoted: msg }
    );
  }
};