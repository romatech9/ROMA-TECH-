// ============================================================
// MUFASER-X — CHATBOT COMMAND
//
// .chatbot on
// .chatbot off
// .chatbot dm on
// .chatbot dm off
// .chatbot all on
// .chatbot all off
// .chatbot status
//
// OWNER ONLY
// ============================================================

const config =
  require('../config.js');


// ============================================================
// NORMALIZE NUMBER
// ============================================================

function normalizeNumber(value) {

  if (!value) {
    return '';
  }

  let number =
    String(value);

  number =
    number.split('@')[0];

  number =
    number.split(':')[0];

  return number.replace(
    /\D/g,
    ''
  );
}


// ============================================================
// MAKE SURE CHATBOT CONFIG EXISTS
// ============================================================

function ensureChatbot(account) {

  if (!account.chatbot) {

    account.chatbot = {
      groups: {},
      dm: false,
      all: false
    };

  }

  if (!account.chatbot.groups) {
    account.chatbot.groups = {};
  }

  if (
    typeof account.chatbot.dm !== 'boolean'
  ) {
    account.chatbot.dm = false;
  }

  if (
    typeof account.chatbot.all !== 'boolean'
  ) {
    account.chatbot.all = false;
  }

  return account.chatbot;
}


// ============================================================
// COMMAND
// ============================================================

module.exports = {

  name: 'chatbot',


  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    // ========================================================
    // OWNER ONLY
    // ========================================================

    const senderNumber =
      normalizeNumber(
        sender?.number ||
        msg.key?.participant ||
        msg.key?.remoteJid
      );


    const ownerNumber =
      normalizeNumber(
        account?.ownerNumber ||
        account?.phone ||
        config.ownerNumber
      );


    const isOwner =
      msg.key?.fromMe === true ||
      (
        ownerNumber &&
        senderNumber === ownerNumber
      );


    if (!isOwner) {

      return sock.sendMessage(
        jid,
        {
          text:
`😅 *OWNER ONLY!*

Sorry Comrade, only the bot owner can change chatbot settings.`
        }
      );

    }


    // ========================================================
    // CHATBOT CONFIG
    // ========================================================

    const chatbot =
      ensureChatbot(account);


    const action =
      String(
        args?.[0] || ''
      )
      .toLowerCase()
      .trim();


    const option =
      String(
        args?.[1] || ''
      )
      .toLowerCase()
      .trim();


    // ========================================================
    // STATUS
    // ========================================================

    if (
      action === 'status' ||
      !action
    ) {

      const isGroup =
        jid.endsWith('@g.us');


      const groupStatus =
        isGroup
          ? (
              chatbot.all === true
                ? '🌍 GLOBAL ON'
                : chatbot.groups?.[jid] === true
                  ? '✅ ON'
                  : '❌ OFF'
            )
          : 'N/A';


      return sock.sendMessage(
        jid,
        {
          text:
`╭━━━〔 🤖 MUFASER-X CHATBOT 〕━━━╮

🌍 Global: ${
  chatbot.all
    ? '✅ ON'
    : '❌ OFF'
}

💬 Private DM: ${
  chatbot.dm
    ? '✅ ON'
    : '❌ OFF'
}

👥 Current Group: ${
  groupStatus
}

╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

Commands:

.chatbot on
.chatbot off

.chatbot dm on
.chatbot dm off

.chatbot all on
.chatbot all off

.chatbot status`
        }
      );

    }


    // ========================================================
    // CURRENT GROUP ON
    // ========================================================

    if (action === 'on') {

      if (!jid.endsWith('@g.us')) {

        return sock.sendMessage(
          jid,
          {
            text:
`❌ *GROUP ONLY*

Use this command inside a group:

.chatbot on`
          }
        );

      }


      chatbot.groups[jid] = true;


      return sock.sendMessage(
        jid,
        {
          text:
`✅ *CHATBOT ENABLED*

🤖 MUFASER-X will now automatically reply to normal messages in this group.

⚙️ Scope: *This group only*`
        }
      );

    }


    // ========================================================
    // CURRENT GROUP OFF
    // ========================================================

    if (action === 'off') {

      if (!jid.endsWith('@g.us')) {

        return sock.sendMessage(
          jid,
          {
            text:
`❌ *GROUP ONLY*

Use this command inside a group:

.chatbot off`
          }
        );

      }


      chatbot.groups[jid] = false;


      return sock.sendMessage(
        jid,
        {
          text:
`✅ *CHATBOT DISABLED*

🤖 MUFASER-X will no longer automatically reply in this group.

⚙️ Scope: *This group only*`
        }
      );

    }


    // ========================================================
    // PRIVATE DM
    // ========================================================

    if (action === 'dm') {

      if (
        option !== 'on' &&
        option !== 'off'
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
`❌ Invalid DM option.

Use:

.chatbot dm on
.chatbot dm off`
          }
        );

      }


      chatbot.dm =
        option === 'on';


      return sock.sendMessage(
        jid,
        {
          text:
            chatbot.dm
              ? `✅ *DM CHATBOT ENABLED*\n\n🤖 MUFASER-X will now automatically reply to private messages.`
              : `✅ *DM CHATBOT DISABLED*\n\n🤖 MUFASER-X will no longer automatically reply to private messages.`
        }
      );

    }


    // ========================================================
    // GLOBAL
    // ========================================================

    if (action === 'all') {

      if (
        option !== 'on' &&
        option !== 'off'
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
`❌ Invalid global option.

Use:

.chatbot all on
.chatbot all off`
          }
        );

      }


      // ── GLOBAL ON ──────────────────────────────────

      if (option === 'on') {

        chatbot.all = true;


        return sock.sendMessage(
          jid,
          {
            text:
`🌍 *GLOBAL CHATBOT ENABLED*

🤖 MUFASER-X will automatically reply to normal messages in all groups and private DMs.`
          }
        );

      }


      // ── GLOBAL OFF ─────────────────────────────────

      chatbot.all = false;

      chatbot.dm = false;

      chatbot.groups = {};


      return sock.sendMessage(
        jid,
        {
          text:
`🌍 *GLOBAL CHATBOT DISABLED*

❌ Chatbot has been turned OFF everywhere.

👥 All groups: OFF
💬 All private DMs: OFF`
        }
      );

    }


    // ========================================================
    // INVALID COMMAND
    // ========================================================

    return sock.sendMessage(
      jid,
      {
        text:
`❌ *Invalid chatbot command.*

Use:

🤖 .chatbot on
🤖 .chatbot off

💬 .chatbot dm on
💬 .chatbot dm off

🌍 .chatbot all on
🌍 .chatbot all off

⚙️ .chatbot status`
      }
    );

  }
};