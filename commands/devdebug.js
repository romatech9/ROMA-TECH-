// ============================================================
// MUFASER-X — DEVICE DEBUG
// OWNER ONLY
// ============================================================

module.exports = {
  name: 'devdebug',
  desc: 'Debug WhatsApp device information',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      const contextInfo =
        msg?.message?.extendedTextMessage?.contextInfo;

      const output = {
        key: msg?.key || null,

        deviceSentMessage:
          msg?.message?.deviceSentMessage || null,

        messageDevice:
          msg?.message?.device || null,

        messageDeviceModel:
          msg?.message?.deviceModel || null,

        topDevice:
          msg?.device || null,

        topDeviceModel:
          msg?.deviceModel || null,

        contextDevice:
          contextInfo?.deviceSentMessage || null,

        quotedMessage:
          contextInfo?.quotedMessage || null
      };

      console.log(
        '\n================ DEVICE DEBUG ================\n' +
        JSON.stringify(output, null, 2) +
        '\n================================================\n'
      );

      await sock.sendMessage(
        jid,
        {
          text:
`🔎 *DEVICE DEBUG*

Check the bot console/logs for the raw device information.`
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[DevDebug] ❌',
        error
      );

      await sock.sendMessage(
        jid,
        {
          text:
`❌ Debug failed:
${error?.message || error}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};