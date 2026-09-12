// ============================================================
// MUFASER-X — BLOCK COMMAND
// OWNER ONLY
//
// Usage:
// .block 256791480644
// OR reply to someone's message with:
// .block
// OR use:
// .block
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
  // Reply target
  // ----------------------------------------------------------

  const quoted =
    getQuotedParticipant(msg);

  if (quoted) {

    console.log(
      `[Block] 🎯 Quoted target: ${quoted}`
    );

    return quoted;
  }


  // ----------------------------------------------------------
  // Mention target
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
      `[Block] 🎯 Mentioned target: ${mentioned[0]}`
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
// BLOCK COMMAND
// ============================================================

module.exports = {

  name: 'block',

  desc: 'Block a WhatsApp user',

  category: 'Owner',

  usage:
    '.block 2567XXXXXXXX OR reply to a message',

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
              `.block 2567XXXXXXXX`
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
                `.block 2567XXXXXXXXX`
            },
            {
              quoted: msg
            }
          );
        }

        targetJid =
          `${targetNumber}@s.whatsapp.net`;

        console.log(
          `[Block] 📱 Manual target: ${targetJid}`
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
          // Normal WhatsApp phone JID
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
              `[Block] ✅ Phone target: ${targetJid}`
            );
          }


          // --------------------------------------------------
          // LID
          // --------------------------------------------------

          else if (
            messageTarget.endsWith('@lid')
          ) {

            console.log(
              `[Block] ⚠️ Target is a WhatsApp LID: ${messageTarget}`
            );


            // Try Baileys' LID mapping if available.
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
                '[Block] ⚠️ LID mapping failed:',
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
                `[Block] ✅ LID resolved: ${targetJid}`
              );

            } else {

              return sock.sendMessage(
                jid,
                {
                  text:
                    `❌ *Could not resolve this WhatsApp LID.*\n\n` +
                    `WhatsApp did not provide the real phone number.\n\n` +
                    `Try using:\n` +
                    `.block 2567XXXXXXXX`
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


        // Normal DM

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
            `[Block] 💬 Current DM target: ${targetJid}`
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
              `❌ *Could not identify the user to block.*\n\n` +
              `Use:\n` +
              `.block 2567XXXXXXXX\n\n` +
              `Or reply to a user's message with:\n` +
              `.block`
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
              `❌ *I cannot block my owner.* 😌`
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
              `❌ *I cannot block myself.* 🤖`
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      console.log(
        `[Block] ✅ Successfully blocked: ${targetJid}`
      );


      return sock.sendMessage(
        jid,
        {
          text:
            `✅ *USER BLOCKED SUCCESSFULLY!*\n\n` +
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
        '[Block] ❌ Failed:',
        error
      );


      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to block user.*\n\n` +
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