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
// ========== AUTO REACT - GROUP SPECIFIC ==========
const randomEmojis = [
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','❤️‍🩹','💔','💕','💞','💓','💗','💖','💝','💘','💟',
  '🔥','✨','⚡','💯','💥','🌟','💫','⭐','🌙','☀️','💎','👑','🎉','🎊','🏆','🥇','🥈','🥉','🏅','🚀','🪐','💡',
  '😂','🤣','😍','🥰','😘','😗','😙','🥲','🥹','😊','☺️','😇','🤩','😎','🤓','🥳','🤭','🫣','🥺','😭','😢','😩','😮‍💨','🫶','🫡','🤗','🤫','🤐','😋','🤤','😏','😌','🤯','😳','🫢','🫠',
  '👀','👁️','👏','🙏','👍','👎','👌','🤌','🤏','✌️','🤞','🫰','🤘','🤙','👊','✊','🤝','🫂','💪','🦾','🦿','🦵','🫦','👄','💋','👅','👂','🦻',
  '🙆','🙅','🙆‍♂️','🙆‍♀️','💁','🙋','🤦','🤷','🧖','🧖‍♀️','🧖‍♂️','🛀','🛌','🤾','🤾‍♂️','🤾‍♀️','⛷️','🏂','🏋️','🧘','🧘‍♀️','🧘‍♂️','🕺','💃',
  '🥀','🌹','🌷','🌺','🌸','🌼','💐','🌻','🪷','🪻','🌵','🌴','🌲','🌳','🍀','☘️','🍁','🍄','🌈','🌫️','🌏','🌍','🌎','🌊','❄️','🧊','☃️','🌪️','🌩️','🦋','🐝','🪲','🐞','🦀',
  '🍓','🍒','🍎','🍑','🍊','🍋','🍉','🍇','🍍','🥝','🥭','🍈','🍌','🍋‍🟩','🥥','🥑','🍆','🥔','🥕','🌽','🍿','🍫','🍬','🍭','🍩','🧁','🎂','🍰','🍪','🧃','🥤','🧋','☕','🍵','🥂','🍾','🍷','🍸','🍹','🍺','🥃',
  '🎀','🎁','🎇','🧨','🎆','🧧','🎗️','🎟️','🎫','🎖️','🏵️','🎨','🖼️','🪞','🪩','🧩','🧸','🪅','🪆','🎮','🕹️','🎰','🎲','🃏','🎯','🎳','🎪','🎭','🎬','🎤','🎧','🎼','🎵','🎶','🎸','🎹','🎺','🎻','🥁','🎷',
  '🚨','🚧','🛝','🏙️','🌇','🌃','🗾','🌐','🗺️','📢','📣','📯','🔔','🔕','🪡','🧵','🖼️','📻','🎙️','📷','📸','📹','🎥','🖥️','💻','⌨️','🖨️','🖱️','💾','💿','📀','📼','🪜','🪝','🔧','🔨','⚒️','🛠️','⛏️','🪛','🔩','⚙️','🧲',
  '✏️','📝','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧾','📑','🪪','📰','📜','✉️','📧','📨','📩','📤','📥','📦','📫','📪','🖋️','🖊️','🖌️','🖍️','📏','📐','✂️','📌','📍','🔗','🧷','🧿','🔮','🪬','🔑','🗝️','🔒','🔓','🔏','🔐','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔶','🔷','🔸','🔹','📛','⛔','🚫','♻️','〽️','⚜️','🏁','🚩','🎌','🏳️','🏴',
  '😹','😻','😼','🙈','🙉','🙊','🐶','🐕','🦮','🐩','🐺','🦊','🦝','🐱','🐈','🦁','🐯','🐅','🐆','🦄','🦓','🦌','🦬','🐮','🐷','🐽','🐸','🐵','🙊','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕‍🦺','🐈‍⬛','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔',
  '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🥅','🏒','🏑','🥍','🏏','🪃','🥊','🥋','⛳','⛸️','🎣','🤿','🎽','🎿','🛷','🥌','🎯','🪀','🪁','🎮','🎲','🧩','♟️','🎭','🎨','🧵','🧶','🎼','🎤','🎧','🎷','🎸','🎹','🎺','🎻','🥁','📻',
  '💀','☠️','👻','👽','🤖','🎃','🫀','🧠','🦾','🦿','🦷','🦴','👀','👁️','🫁','🩸','🧬','🦠','🕶️','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲','🩳','👙','👚','👛','👜','👝','🛍️','🎒','👞','👟','🥾','🥿','👠','👡','🩰','👢','👑','👒','🎩','🎓','🧢','🪖','⛑️','💄','💍','💎','👓','🕶️','🥽'
];

function getRandomEmoji() {
  return randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
}

async function handleAutoReact(sock, msg, account) {
  try {
    if (!msg?.key?.remoteJid) return false;
    const jid = msg.key.remoteJid;
    if (jid === 'status@broadcast') return false;
    if (jid.includes('@newsletter')) return false;
    if (msg.key.fromMe) return false;
    if (!msg.message) return false;

    // GROUP ONLY LOGIC
    account.autoreactGroups = account.autoreactGroups || [];
    const isGroup = jid.endsWith('@g.us');

    // If it's group, check if this group is enabled
    if (isGroup) {
      if (!account.autoreactGroups.includes(jid)) return false; // only groups where user did .autoreact group on
    } else {
      // DM logic - use global autoreact
      if (!account?.autoreact) return false;
    }

    let emoji;
    if (typeof account.autoreact === 'string' && account.autoreact.length <= 10 &&!['on','true','off','false','group','random'].includes(account.autoreact.toLowerCase())) {
      emoji = account.autoreact; // custom like 🔥
    } else {
      emoji = getRandomEmoji();
    }

    await sock.sendMessage(jid, {
      react: { text: emoji, key: msg.key }
    });

    console.log(`[AutoReact:${account.phone}] ${emoji} on ${jid}`);
    return false;
  } catch (e) {
    console.log(`[AutoReact] Error: ${e.message}`);
    return false;
  }
}

// ========== CHANNEL AUTO-REACT (ON/OFF ONLY) ==========
async function handleAutoReactChannel(sock, msg, account) {
  try {
    if (!msg?.key?.remoteJid) return false;
    const jid = msg.key.remoteJid;
    if (!jid.includes('@newsletter')) return false;
    if (msg.key.fromMe) return false;
    if (!msg.message) return false;

    const enabled = account?.autoreactchannel;
    const isOn = enabled === true || enabled === 'on' || enabled === 'true';
    if (!isOn) return false;

    const emoji = getRandomEmoji();
    
    await sock.sendMessage(jid, {
      react: { text: emoji, key: msg.key }
    });

    console.log(`[AutoReactChannel:${account.phone}] ${emoji} on CHANNEL ${jid}`);
    return false;
  } catch (e) {
    console.log(`[AutoReactChannel] Error: ${e.message}`);
    return false;
  }
}
module.exports = {handleAutoViewStatus,
handleAutoLikeStatus, handleAutoReact, handleAutoReactChannel
};