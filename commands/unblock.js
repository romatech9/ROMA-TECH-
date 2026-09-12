// ============================================================
// MUFASER-X — UNBLOCK COMMAND
// OWNER ONLY
//
// Usage:
// .unblock 2567XXXXXXXX
// OR reply to someone's message:
// .unblock
// OR use:
// .unblock
// inside the person's DM
// ============================================================

const config = require('../config.js');


// ============================================================
// NORMALIZE NUMBER
// ============================================================

function normalizeNumber(value) {

  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}


// ============================================================
// GET QUOTED PARTICIPANT
// ============================================================

function getQuotedParticipant(msg) {

  const contextInfo =
    msg?.message?.extendedTextMessage?.contextInfo ||
    msg?.message?.imageMessage?.contextInfo ||
    msg?.message?.videoMessage?.contextInfo ||
    msg?.message?.documentMessage?.contextInfo ||
    msg?.message?.audioMessage?.contextInfo ||
    msg?.message?.stickerMessage?.contextInfo;

  return contextInfo?.participant || '';
}


// ============================================================
// GET TARGET FROM MESSAGE
// ============================================================

function getTargetFromMessage(msg) {

  // ----------------------------------------------------------
  // REPLY TARGET
  // ----------------------------------------------------------

  const quoted =
    getQuotedParticipant(msg);

  if (quoted) {

    console.log(
      `[Unblock] 🎯 Quoted target: ${quoted}`
    );

    return quoted;
  }


  // ----------------------------------------------------------
  // MENTION TARGET
  // ----------------------------------------------------------

  const mentioned =
    msg?.message?.extendedTextMessage
      ?.contextInfo
      ?.mentionedJid;

  if (
    Array.isArray(mentioned) &&
    mentioned.length > 0
  ) {

    console.log(
      `[Unblock] 🎯 Mentioned target: ${mentioned[0]}`
    );

    return mentioned[0];
  }


  return '';
}


// ============================================================
// GET BOT NUMBER
// ============================================================

function getBotNumber(sock) {

  return normalizeNumber(
    sock?.user?.id
  );
}


// ============================================================
// GET OWNER NUMBER
// ============================================================

function getOwnerNumber(account) {

  return normalizeNumber(
    account?.ownerNumber ||
    account?.phone ||
    account?.number ||
    config?.ownerNumber ||
    process.env.OWNER_NUMBER
  );
}


// ============================================================
// UNBLOCK COMMAND
// ============================================================

module.exports = {

  name: 'unblock',

  desc: 'Unblock a WhatsApp user',

  category: 'Owner',

  usage:
    '.unblock 2567XXXXXXXX OR reply to a message',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    let targetJid = '';
    let targetNumber = '';

    try {

      // ======================================================
      // OWNER ONLY
      // ======================================================

      if (!msg?.key?.fromMe) {

        return sock.sendMessage(
          jid,
          {
            text:
              `😅 *OWNER ONLY!*\n\n` +
              `Sorry Comrade, this command is reserved for my owner. 😌`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // DO NOT USE IN GROUPS
      // ======================================================

      if (
        String(jid).endsWith('@g.us')
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *This command works in a DM only.*\n\n` +
              `Use:\n` +
              `.unblock 2567XXXXXXXX`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // METHOD 1 — MANUAL NUMBER
      // ======================================================

      if (
        Array.isArray(args) &&
        args.length > 0
      ) {

        targetNumber =
          args
            .join('')
            .replace(/\D/g, '');

        if (!targetNumber) {

          return sock.sendMessage(
            jid,
            {
              text:
                `❌ *Invalid number.*\n\n` +
                `Example:\n` +
                `.unblock 2567XXXXXXXX`
            },
            {
              quoted: msg
            }
          );
        }

        targetJid =
          `${targetNumber}@s.whatsapp.net`;

        console.log(
          `[Unblock] 📱 Manual target: ${targetJid}`
        );
      }


      // ======================================================
      // METHOD 2 — REPLY / MENTION
      // ======================================================

      if (!targetJid) {

        const messageTarget =
          getTargetFromMessage(msg);

        if (messageTarget) {

          // --------------------------------------------------
          // NORMAL WHATSAPP PHONE JID
          // --------------------------------------------------

          if (
            messageTarget.endsWith(
              '@s.whatsapp.net'
            )
          ) {

            targetJid =
              messageTarget;

            targetNumber =
              normalizeNumber(targetJid);

            console.log(
              `[Unblock] ✅ Phone target: ${targetJid}`
            );
          }


          // --------------------------------------------------
          // LID
          // --------------------------------------------------

          else if (
            messageTarget.endsWith('@lid')
          ) {

            console.log(
              `[Unblock] ⚠️ Target is a WhatsApp LID: ${messageTarget}`
            );

            let resolved = '';

            try {

              const mapping =
                sock?.signalRepository?.lidMapping;

              if (
                mapping &&
                typeof mapping.getPNForLID === 'function'
              ) {

                resolved =
                  await mapping.getPNForLID(
                    messageTarget
                  );
              }

            } catch (lidError) {

              console.error(
                '[Unblock] ⚠️ LID mapping failed:',
                lidError?.message || lidError
              );
            }


            if (resolved) {

              targetJid =
                String(resolved);

              if (
                !targetJid.includes('@')
              ) {

                targetJid +=
                  '@s.whatsapp.net';
              }

              targetNumber =
                normalizeNumber(targetJid);

              console.log(
                `[Unblock] ✅ LID resolved: ${targetJid}`
              );

            } else {

              return sock.sendMessage(
                jid,
                {
                  text:
                    `❌ *Could not resolve this WhatsApp LID.*\n\n` +
                    `WhatsApp did not provide the real phone number.\n\n` +
                    `Try using:\n` +
                    `.unblock 2567XXXXXXXX`
                },
                {
                  quoted: msg
                }
              );
            }
          }
        }
      }


      // ======================================================
      // METHOD 3 — CURRENT DM
      // ======================================================

      if (!targetJid) {

        const currentJid =
          String(jid || '');

        if (
          currentJid.endsWith(
            '@s.whatsapp.net'
          )
        ) {

          targetJid =
            currentJid;

          targetNumber =
            normalizeNumber(targetJid);

          console.log(
            `[Unblock] 💬 Current DM target: ${targetJid}`
          );
        }
      }


      // ======================================================
      // FINAL VALIDATION
      // ======================================================

      if (
        !targetJid ||
        !targetNumber
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *Could not identify the user to unblock.*\n\n` +
              `Use:\n` +
              `.unblock 2567XXXXXXXX\n\n` +
              `Or reply to a user's message with:\n` +
              `.unblock`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // VALIDATE NUMBER
      // ======================================================

      if (
        targetNumber.length < 7
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *Invalid WhatsApp number.*\n\n` +
              `Target: +${targetNumber}`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // OWNER PROTECTION
      // ======================================================

      const ownerNumber =
        getOwnerNumber(account);

      if (
        ownerNumber &&
        targetNumber === ownerNumber
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *I cannot unblock my owner.* 😌`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // BOT PROTECTION
      // ======================================================

      const botNumber =
        getBotNumber(sock);

      if (
        botNumber &&
        targetNumber === botNumber
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *I cannot unblock myself.* 🤖`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // SHOW TARGET
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            `⏳ *Unblocking +${targetNumber}...*`
        },
        {
          quoted: msg
        }
      );


      // ======================================================
      // UNBLOCK
      // ======================================================

      console.log(
        `[Unblock] 🔓 Unblocking target: ${targetJid}`
      );


      await sock.updateBlockStatus(
        targetJid,
        'unblock'
      );


      // ======================================================
      // SUCCESS
      // ======================================================

      console.log(
        `[Unblock] ✅ Successfully unblocked: ${targetJid}`
      );


      return sock.sendMessage(
        jid,
        {
          text:
            `✅ *USER UNBLOCKED SUCCESSFULLY!*\n\n` +
            `👤 *Number:* +${targetNumber}`
        },
        {
          quoted: msg
        }
      );


    } catch (error) {

      // ======================================================
      // ERROR
      // ======================================================

      console.error(
        '[Unblock] ❌ Failed:',
        error
      );


      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to unblock user.*\n\n` +
            `👤 *Target:* ${
              targetNumber ||
              targetJid ||
              'Unknown'
            }\n\n` +
            `⚠️ *Reason:*\n${
              error?.message ||
              'Unknown error'
            }`
        },
        {
          quoted: msg
        }
      );
    }
  }
};