// modules/auto/index.js - MUFASER-X AUTO SYSTEM

// ========== AUTO VIEW STATUS ==========
async function handleAutoViewStatus(sock, msg, account) {
  try {
    if (!msg?.key?.remoteJid) return false;
    if (msg.key.remoteJid!== 'status@broadcast') return false;
    if (!account?.autoviewstatus) return false;
    if (msg.key.fromMe) return false;

    await sock.readMessages([msg.key]);

    console.log(
      `[AutoView:${account.phone}] 👁️ Viewed status`
    );

    return false;
  } catch (e) {
    console.log(`[AutoView] Error: ${e.message}`);
    return false;
  }
}
// ========== AUTO LIKE STATUS ==========
async function handleAutoLikeStatus(sock, msg, account) {
  try {
    if (!msg?.key?.remoteJid) return false;
    if (msg.key.remoteJid!== 'status@broadcast') return false;
    if (!account?.autolikestatus) return false;
    if (msg.key.fromMe) return false;

    const participant = msg.key.participant;
    if (!participant) return false;

    await sock.sendMessage(
      'status@broadcast',
      {
        react: {
          text: '❤️',
          key: msg.key
        }
      },
      {
        statusJidList: [participant]
      }
    );

    console.log(
      `[AutoLike:${account.phone}] ❤️ Liked status`
    );

    return false;
  } catch (e) {
    console.log(`[AutoLike] Error: ${e.message}`);
    return false;
  }
}
// ========== AUTO REACT - GROUP + DM + CHANNEL ==========

const randomEmojis = [
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','❤️‍🩹','💔','💕','💞','💓','💗','💖','💝','💘','💟',
  '🔥','✨','⚡','💯','💥','🌟','💫','⭐','🌙','☀️','💎','👑','🎉','🎊','🏆','🥇','🥈','🥉','🏅','🚀','🪐','💡',
  '😂','🤣','😍','🥰','😘','😗','😙','🥲','🥹','😊','☺️','😇','🤩','😎','🤓','🥳','🤭','🫣','🥺','😭','😢','😩','😮‍💨','🫶','🫡','🤗','🤫','🤐','😋','🤤','😏','😌','🤯','😳','🫢','🫠',
  '👀','👁️','👏','🙏','👍','👎','👌','🤌','🤏','✌️','🤞','🫰','🤘','🤙','👊','✊','🤝','🫂','💪','🦾','🦿','🦵','🫦','👄','💋','👅','👂','🦻',
  '🙆','🙅','🙆‍♂️','🙆‍♀️','💁','🙋','🤦','🤷','🧖','🧖‍♀️','🧖‍♂️','🛀','🛌','🤾','🤾‍♂️','🤾‍♀️','⛷️','🏂','🏋️','🧘','🧘‍♀️','🧘‍♂️','🕺','💃',
  '🥀','🌹','🌷','🌺','🌸','🌼','💐','🌻','🪷','🪻','🌵','🌴','🌲','🌳','🍀','☘️','🍁','🍄','🌈','🌫️','🌏','🌍','🌎','🌊','❄️','🧊','☃️','🌪️','🌩️','🦋','🐝','🪲','🐞','🦀',
  '🍓','🍒','🍎','🍑','🍊','🍋','🍉','🍇','🍍','🥝','🥭','🍈','🍌','🍋‍🟩','🥥','🥑','🍆','🥔','🥕','🌽','🍿','🍫','🍬','🍭','🍩','🧁','🎂','🍰','🍪','🧃','🥤','🧋','☕','🍵','🥂','🍾','🍷','🍸','🍹','🍺','🥃',
  '🎀','🎁','🎇','🧨','🎆','🧧','🎗️','🎟️','🎫','🎖️','🏵️','🎨','🖼️','🪞','🪩','🧩','🧸','🪅','🪆','🎮','🕹️','🎰','🎲','🃏','🎯','🎳','🎪','🎭','🎬','🎤','🎧','🎼','🎵','🎶','🎸','🎹','🎺','🎻','🥁','🎷',
  '🚨','🚧','🛝','🏙️','🌇','🌃','🗾','🌐','🗺️','📢','📣','📯','🔔','🔕'
];

function getRandomEmoji() {
  return randomEmojis[
    Math.floor(Math.random() * randomEmojis.length)
  ];
}


// ============================================================
// GET REACTION EMOJI
// ============================================================

function getAutoReactEmoji(setting) {

  if (
    typeof setting === 'string' &&
    setting.trim().length > 0 &&
    setting.trim().length <= 10
  ) {

    const value = setting.trim().toLowerCase();

    if (
      ![
        'on',
        'true',
        'random',
        'off',
        'false',
        'group',
        'dm',
        'channel'
      ].includes(value)
    ) {
      return setting.trim();
    }
  }

  return getRandomEmoji();
}


// ============================================================
// AUTO REACT — GROUP + DM
// ============================================================

async function handleAutoReact(sock, msg, account) {
  try {

    if (!msg?.key?.remoteJid) return false;

    const jid = msg.key.remoteJid;

    // Ignore WhatsApp Status
    if (jid === 'status@broadcast') return false;

    // Channels are handled separately below
    if (jid.includes('@newsletter')) return false;

    // Don't react to bot's own messages
    if (msg.key.fromMe) return false;

    if (!msg.message) return false;

    account.autoreactGroups =
      account.autoreactGroups || [];

    const isGroup =
      jid.endsWith('@g.us');


    // ========================================================
    // GROUP
    // ========================================================

    if (isGroup) {

      // Keep your working group-specific system.
      // Only groups where:
      //
      // .autoreact group on
      //
      // was used will react.

      if (
        !account.autoreactGroups.includes(jid)
      ) {
        return false;
      }

      const setting =
        account.autoreactgroup;

      const emoji =
        getAutoReactEmoji(setting);

      await sock.sendMessage(jid, {
        react: {
          text: emoji,
          key: msg.key
        }
      });

      console.log(
        `[AutoReact:${account.phone}] ${emoji} on GROUP ${jid}`
      );

      return false;
    }


    // ========================================================
    // PRIVATE DM
    // ========================================================

    const setting =
      account.autoreactdm;

    const enabled =
      setting === true ||
      setting === 'on' ||
      setting === 'true' ||
      setting === 'random' ||
      (
        typeof setting === 'string' &&
        setting.trim().length > 0
      );

    if (!enabled) return false;

    const emoji =
      getAutoReactEmoji(setting);

    await sock.sendMessage(jid, {
      react: {
        text: emoji,
        key: msg.key
      }
    });

    console.log(
      `[AutoReact:${account.phone}] ${emoji} on DM ${jid}`
    );

    return false;

  } catch (e) {

    console.log(
      `[AutoReact] Error: ${e.message}`
    );

    return false;
  }
}


// ============================================================
// CHANNEL AUTO-REACT
// ============================================================

async function handleAutoReactChannel(sock, msg, account) {
  try {

    if (!msg?.key?.remoteJid) return false;

    const jid =
      msg.key.remoteJid;

    // Channel only
    if (!jid.includes('@newsletter')) {
      return false;
    }

    // Don't react to bot's own channel messages
    if (msg.key.fromMe) return false;

    if (!msg.message) return false;

    // ========================================================
    // CHANNEL SETTING
    // ========================================================

    const setting =
      account?.autoreactchannel;

    const enabled =
      setting === true ||
      setting === 'on' ||
      setting === 'true' ||
      setting === 'random' ||
      (
        typeof setting === 'string' &&
        setting.trim().length > 0
      );

    if (!enabled) return false;


    // ========================================================
    // EMOJI
    // ========================================================

    const emoji =
      getAutoReactEmoji(setting);


    // ========================================================
    // SEND CHANNEL REACTION
    // ========================================================

    await sock.sendMessage(jid, {
      react: {
        text: emoji,
        key: msg.key
      }
    });

    console.log(
      `[AutoReactChannel:${account.phone}] ${emoji} on CHANNEL ${jid}`
    );

    return false;

  } catch (e) {

    console.log(
      `[AutoReactChannel] Error: ${e.message}`
    );

    return false;
  }
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  handleAutoViewStatus,
  handleAutoLikeStatus,
  handleAutoReact,
  handleAutoReactChannel
};