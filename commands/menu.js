// ============================================================
// Command:.menu - MUFASER-X 9 STYLES
// ============================================================
const os = require('os');
const config = require('../config.js');
const { getRamUsage, getCpuModel, formatUptime, getDate, getTime, getPlatform } = require('../utils');

const path = require('path');
const fs = require('fs');
function countCommands() {
  try {
    return fs.readdirSync(path.join(__dirname)).filter(f => f.endsWith('.js')).length;
  } catch {
    return 0;
  }
}

// --- STYLE SYSTEM ---
const styleDbPath = path.join(__dirname, '../database/menuStyle.json');
function getMenuStyle() {
  try {
    if (!fs.existsSync(styleDbPath)) {
      fs.mkdirSync(path.dirname(styleDbPath), { recursive: true });
      fs.writeFileSync(styleDbPath, JSON.stringify({ style: 1 }));
      return 1;
    }
    return JSON.parse(fs.readFileSync(styleDbPath)).style || 1;
  } catch { return 1 }
}

function toStyle(text, styleNum) {
  if (styleNum == 5) return text.split('').map(c => c.trim()? c + '̷' : c).join('');
  if (styleNum == 6) return text.split('\n').map(line => `> ${line}`).join('\n');
  if (styleNum == 7) return text;

  const maps = {
    1: { A:'𝑨',B:'𝑩',C:'𝑪',D:'𝑫',E:'𝑬',F:'𝑭',G:'𝑮',H:'𝑯',I:'𝑰',J:'𝑱',K:'𝑲',L:'𝑳',M:'𝑴',N:'𝑵',O:'𝑶',P:'𝑷',Q:'𝑸',R:'𝑹',S:'𝑺',T:'𝑻',U:'𝑼',V:'𝑽',W:'𝑾',X:'𝑿',Y:'𝒀',Z:'𝒁',a:'𝒂',b:'𝒃',c:'𝒄',d:'𝒅',e:'𝒆',f:'𝒇',g:'𝒈',h:'𝒉',i:'𝒊',j:'𝒋',k:'𝒌',l:'𝒍',m:'𝒎',n:'𝒏',o:'𝒐',p:'𝒑',q:'𝒒',r:'𝒓',s:'𝒔',t:'𝒕',u:'𝒖',v:'𝒗',w:'𝒘',x:'𝒙',y:'𝒚',z:'𝒛' },
    2: { A:'𝘈',B:'𝘉',C:'𝘊',D:'𝘋',E:'𝘌',F:'𝘍',G:'𝘎',H:'𝘏',I:'𝘐',J:'𝘑',K:'𝘒',L:'𝘓',M:'𝘔',N:'𝘕',O:'𝘖',P:'𝘗',Q:'𝘘',R:'𝘙',S:'𝘚',T:'𝘛',U:'𝘜',V:'𝘝',W:'𝘞',X:'𝘟',Y:'𝘠',Z:'𝘡',a:'𝘢',b:'𝘣',c:'𝘤',d:'𝘥',e:'𝘦',f:'𝘧',g:'𝘨',h:'𝘩',i:'𝘪',j:'𝘫',k:'𝘬',l:'𝘭',m:'𝘮',n:'𝘯',o:'𝘰',p:'𝘱',q:'𝘲',r:'𝘳',s:'𝘴',t:'𝘵',u:'𝘶',v:'𝘷',w:'𝘸',x:'𝘹',y:'𝘺',z:'𝘻' },
    3: { A:'𝘼',B:'𝘽',C:'𝘾',D:'𝘿',E:'𝙀',F:'𝙁',G:'𝙂',H:'𝙃',I:'𝙄',J:'𝙅',K:'𝙆',L:'𝙇',M:'𝙈',N:'𝙉',O:'𝙊',P:'𝙋',Q:'𝙌',R:'𝙍',S:'𝙎',T:'𝙏',U:'𝙐',V:'𝙑',W:'𝙒',X:'𝙓',Y:'𝙔',Z:'𝙕',a:'𝙖',b:'𝙗',c:'𝙘',d:'𝙙',e:'𝙚',f:'𝙛',g:'𝙜',h:'𝙝',i:'𝙞',j:'𝙟',k:'𝙠',l:'𝙡',m:'𝙢',n:'𝙣',o:'𝙤',p:'𝙥',q:'𝙦',r:'𝙧',s:'𝙨',t:'𝙩',u:'𝙪',v:'𝙫',w:'𝙬',x:'𝙭',y:'𝙮',z:'𝙯' },
    4: { A:'𝐀',B:'𝐁',C:'𝐂',D:'𝐃',E:'𝐄',F:'𝐅',G:'𝐆',H:'𝐇',I:'𝐈',J:'𝐉',K:'𝐊',L:'𝐋',M:'𝐌',N:'𝐍',O:'𝐎',P:'𝐏',Q:'𝐐',R:'𝐑',S:'𝐒',T:'𝐓',U:'𝐔',V:'𝐕',W:'𝐖',X:'𝐗',Y:'𝐘',Z:'𝐙',a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳' },
    8: { A:'𝙰',B:'𝙱',C:'𝙲',D:'𝙳',E:'𝙴',F:'𝙵',G:'𝙶',H:'𝙷',I:'𝙸',J:'𝙹',K:'𝙺',L:'𝙻',M:'𝙼',N:'𝙽',O:'𝙾',P:'𝙿',Q:'𝚀',R:'𝚁',S:'𝚂',T:'𝚃',U:'𝚄',V:'𝚅',W:'𝚆',X:'𝚇',Y:'𝚈',Z:'𝚉',a:'𝚊',b:'𝚋',c:'𝚌',d:'𝚍',e:'𝚎',f:'𝚏',g:'𝚐',h:'𝚑',i:'𝚒',j:'𝚓',k:'𝚔',l:'𝚕',m:'𝚖',n:'𝚗',o:'𝚘',p:'𝚙',q:'𝚚',r:'𝚛',s:'𝚜',t:'𝚝',u:'𝚞',v:'𝚟',w:'𝚠',x:'𝚡',y:'𝚢',z:'𝚣' },
    9: { A:'ℍ',B:'𝔹',C:'ℂ',D:'𝔻',E:'𝔼',F:'𝔽',G:'𝔾',H:'ℍ',I:'𝕀',J:'𝕁',K:'𝕂',L:'𝕃',M:'𝕄',N:'ℕ',O:'𝕆',P:'ℙ',Q:'ℚ',R:'ℝ',S:'𝕊',T:'𝕋',U:'𝕌',V:'𝕍',W:'𝕎',X:'𝕏',Y:'𝕐',Z:'ℤ',a:'𝕒',b:'𝕓',c:'𝕔',d:'𝕕',e:'𝕖',f:'𝕗',g:'𝕘',h:'𝕙',i:'𝕚',j:'𝕛',k:'𝕜',l:'𝕝',m:'𝕞',n:'𝕟',o:'𝕠',p:'𝕡',q:'𝕢',r:'𝕣',s:'𝕤',t:'𝕥',u:'𝕦',v:'𝕧',w:'𝕨',x:'𝕩',y:'𝕪',z:'𝕫' }
  };
  const map = maps[styleNum];
  if (!map) return text;
  return text.split('').map(c => map[c] || c).join('');
}

module.exports = {
  name: 'menu',
  description: 'Show the bot command menu',
  async execute(sock, msg, jid, args, sender) {
// ===== AUTOREACT ON MENU COMMAND =====
    try {
      await sock.sendMessage(jid, {
        react: {
          text: '🦁',
          key: msg.key
        }
      });
    } catch {}
    const loading = await sock.sendMessage(jid, { text: `𝙇𝙤𝙖𝙙𝙞𝙣𝙜 𝙢𝙚𝙣𝙪.....` }, { quoted: msg });
    const uptime = formatUptime(process.uptime());
    const ram = getRamUsage();
    const cpu = getCpuModel();
    const platform = getPlatform();
    const date = getDate();
    const time = getTime();
    const cmdCount = countCommands();
    const style = getMenuStyle();
    const styled = (t) => toStyle(t, style);
    const more = String.fromCharCode(8206).repeat(4001);

 const rawMenu = `
╔═≫〔『❒ *𝗠𝗨𝗙𝗔𝗦𝗘𝗥-𝗫 𝗕𝗢𝗧* ❒』〕
║
║∼❖ OWNER: ${config.ownerNumber || 'N/A'}
║∼❖ USER: ${sender?.name || 'Unknown'}
║∼❖ PREFIX: ${config.prefix}
║∼❖ MODE: ${config.mode || 'public'}
║∼❖ Platform: ${platform}
║∼❖ Node.js: ${process.version}
║∼❖ VERSION: v${config.version}
║∼❖ RAM: ${ram}
║∼❖ CPU: ${cpu.slice(0, 28)}
║∼❖ Runtime: ${uptime}
║∼❖ DATE: ${date}
║∼❖ TIME: ${time}
║∼❖ COMMANDS: ${cmdCount}
║∼❖ DEV : ROMA-TECH           
╚∼▬▬ι══════════════ι▬▬
${more}
╔═≫「❒ *OWNER MENU* ❒」 
┃➽ ${config.prefix}setprefix
┃➽ ${config.prefix}mode
┃➽ ${config.prefix}addsudo
┃➽ ${config.prefix}listgc
┃➽ ${config.prefix}autotyping
┃➽ ${config.prefix}autorecord
┃➽ ${config.prefix}join 
┃➽ ${config.prefix}getpp2
┃➽ ${config.prefix}delpp
┃➽ ${config.prefix}setpp
┃➽ ${config.prefix}block 
┃➽ ${config.prefix}unblock
┃➽ ${config.prefix}blocklist
┃➽ ${config.prefix}unblockall
┃➽ ${config.prefix}leave 
┃➽ ${config.prefix}leaveall
┃➽ ${config.prefix}setbotpp
┃➽ ${config.prefix}status 
┃➽ ${config.prefix}vv2
┃➽ ${config.prefix}device 
┃➽ ${config.prefix}creategc
┃➽ ${config.prefix}createchanl
┃➽ ${config.prefix}createcomnit
╚❏ 

╔═≫「❒ *SET MENU* ❒」 
┃➽ ${config.prefix}setmenu 1
┃➽ ${config.prefix}setmenu 2
┃➽ ${config.prefix}setmenu 3
┃➽ ${config.prefix}setmenu 4
┃➽ ${config.prefix}setmenu 5
┃➽ ${config.prefix}setmenu 6
┃➽ ${config.prefix}setmenu 7
┃➽ ${config.prefix}setmenu 8
┃➽ ${config.prefix}setmenu 9
╚❏ 

╔═≫「❒ *ANTI MENU* ❒」
┃➽ ${config.prefix}antidelete 
┃➽ ${config.prefix}anticall
┃➽ ${config.prefix}antidm
┃➽ ${config.prefix}antideletestatus 
╚❏

╔═≫「❒ *AUTO MENU* ❒」
┃➽ ${config.prefix}autoread
┃➽ ${config.prefix}autoviewstatus
┃➽ ${config.prefix}autolikestatus
┃➽ ${config.prefix}autoreact
┃➽ ${config.prefix}autoreactchannel
╚❏
                             
╔═≫「❒ *UNITY MENU* ❒」 
┃➽ ${config.prefix}menu
┃➽ ${config.prefix}p
┃➽ ${config.prefix}s
┃➽ ${config.prefix}ping
┃➽ ${config.prefix}up
┃➽ ${config.prefix}alive 
┃➽ ${config.prefix}owner 
┃➽ ${config.prefix}vv
┃➽ ${config.prefix}take 
┃➽ ${config.prefix}hack
┃➽ ${config.prefix}admins
┃➽ ${config.prefix}getpp
┃➽ ${config.prefix}toimage 
┃➽ ${config.prefix}tovideo
┃➽ ${config.prefix}toaudio
┃➽ ${config.prefix}toaudio2
┃➽ ${config.prefix}tomedia
┃➽ ${config.prefix}tocode
┃➽ ${config.prefix}toemoji
╚❏

╔═≫「❒ *GROUP MENU* ❒」 
┃➽ ${config.prefix}add
┃➽ ${config.prefix}tagall 
┃➽ ${config.prefix}hidtag
┃➽ ${config.prefix}close 
┃➽ ${config.prefix}open 
┃➽ ${config.prefix}setgcpp
┃➽ ${config.prefix}delppgc
┃➽ ${config.prefix}setgcname
┃➽ ${config.prefix}setdesc
┃➽ ${config.prefix}deldesc
┃➽ ${config.prefix}togstatus
┃➽ ${config.prefix}link
┃➽ ${config.prefix}editgc
┃➽ ${config.prefix}approve 
┃➽ ${config.prefix}approveall
┃➽ ${config.prefix}memberadd
┃➽ ${config.prefix}requests
┃➽ ${config.prefix}rejectall  
┃➽ ${config.prefix}resetlink
┃➽ ${config.prefix}kick 
┃➽ ${config.prefix}kickall
┃➽ ${config.prefix}yeskick 
┃➽ ${config.prefix}promote 
┃➽ ${config.prefix}promoteall
┃➽ ${config.prefix}demote 
┃➽ ${config.prefix}demoteall
┃➽ ${config.prefix}req
┃➽ ${config.prefix}del
┃➽ ${config.prefix}getgcpp
┃➽ ${config.prefix}pin
┃➽ ${config.prefix}unpin
╚❏

╔═≫「❒ *ANTI GC MENU* ❒」
┃➽ ${config.prefix}antilink 
┃➽ ${config.prefix}antibot
┃➽ ${config.prefix}antitag 
┃➽ ${config.prefix}antitext
┃➽ ${config.prefix}antispam
┃➽ ${config.prefix}antisticker  
┃➽ ${config.prefix}antibadword
┃➽ ${config.prefix}antiviewonce
┃➽ ${config.prefix}antigcmention
┃➽ ${config.prefix}antisong
┃➽ ${config.prefix}antiaudio
┃➽ ${config.prefix}antivideo
┃➽ ${config.prefix}antiforward
┃➽ ${config.prefix}antipromote
┃➽ ${config.prefix}antidemote
┃➽ ${config.prefix}antiimage
╚❏

╔═≫「❒ *DOWNLOAD MENU* ❒」 
┃➽ ${config.prefix}song
┃➽ ${config.prefix}play 
┃➽ ${config.prefix}url
╚❏

╔═≫「❒ *TTS MENU* ❒」
┃➽ ${config.prefix}sham
┃➽ ${config.prefix}tts 
┃➽ ${config.prefix}adam
┃➽ ${config.prefix}mvoice
┃➽ ${config.prefix}boy
╚❏

╔═≫「❒ *SOUNDS MENU* ❒」
┃➽ ${config.prefix}sound1
┃➽ ${config.prefix}sound2
┃➽ ${config.prefix}sound3
┃➽ ${config.prefix}sound4
┃➽ ${config.prefix}sound5
╚❏

╔═≫「❒ *RELIGION MENU* ❒」
┃➽ ${config.prefix}quran
┃➽ ${config.prefix}bible
┃➽ ${config.prefix}hadith bukhari 
┃➽ ${config.prefix}hadith bukhari
┃➽ ${config.prefix}hadith muslim
┃➽ ${config.prefix}hadith muslim
┃➽ ${config.prefix}hadith abudawud
┃➽ ${config.prefix}hadith tirmidhi
┃➽ ${config.prefix}hadith nasai
┃➽ ${config.prefix}hadith ibnmajah
┃➽ ${config.prefix}hadith malik
┃➽ ${config.prefix}hadith ahmad
╚❏   

╔═≫「❒ *GREETINGS MENU* ❒」
┃➽ ${config.prefix}gudmorning
┃➽ ${config.prefix}gudafternoon
┃➽ ${config.prefix}gudevening
┃➽ ${config.prefix}gudnight
┃➽ ${config.prefix}godbless
╚❏

╔═≫「❒ *IMAGE MENU* ❒」
┃➽ ${config.prefix}image
┃➽ ${config.prefix}wallpaper
┃➽ ${config.prefix}logo
┃➽ ${config.prefix}avatar
┃➽ ${config.prefix}anime
┃➽ ${config.prefix}realistic
┃➽ ${config.prefix}cartoon
┃➽ ${config.prefix}poster
┃➽ ${config.prefix}banner
┃➽ ${config.prefix}3d
┃➽ ${config.prefix}cyber
┃➽ ${config.prefix}manga
┃➽ ${config.prefix}sticker
┃➽ ${config.prefix}cover
┃➽ ${config.prefix}icon
┃➽ ${config.prefix}portrait
┃➽ ${config.prefix}landscape
┃➽ ${config.prefix}fantasy
┃➽ ${config.prefix}scifi
┃➽ ${config.prefix}product
┃➽ ${config.prefix}pixel
┃➽ ${config.prefix}sketch
┃➽ ${config.prefix}watercolor
┃➽ ${config.prefix}oilpaint
┃➽ ${config.prefix}graffiti
┃➽ ${config.prefix}neon
┃➽ ${config.prefix}comic
┃➽ ${config.prefix}superhero
┃➽ ${config.prefix}villain
┃➽ ${config.prefix}selfie
┃➽ ${config.prefix}fashion
┃➽ ${config.prefix}model
┃➽ ${config.prefix}wedding
┃➽ ${config.prefix}royal
┃➽ ${config.prefix}african
┃➽ ${config.prefix}uganda
┃➽ ${config.prefix}gaming
┃➽ ${config.prefix}gameart
┃➽ ${config.prefix}gamer
┃➽ ${config.prefix}hacker
┃➽ ${config.prefix}robot
┃➽ ${config.prefix}ai
┃➽ ${config.prefix}technology
┃➽ ${config.prefix}futuristic
┃➽ ${config.prefix}car
┃➽ ${config.prefix}bike
┃➽ ${config.prefix}airplane
┃➽ ${config.prefix}ship
┃➽ ${config.prefix}food
┃➽ ${config.prefix}restaurant
┃➽ ${config.prefix}cake
┃➽ ${config.prefix}drink
┃➽ ${config.prefix}city
┃➽ ${config.prefix}nature
┃➽ ${config.prefix}beach
┃➽ ${config.prefix}mountain
┃➽ ${config.prefix}forest
┃➽ ${config.prefix}space
┃➽ ${config.prefix}architecture
┃➽ ${config.prefix}interior
┃➽ ${config.prefix}bedroom
┃➽ ${config.prefix}office
┃➽ ${config.prefix}house
┃➽ ${config.prefix}tattoo
┃➽ ${config.prefix}meme
┃➽ ${config.prefix}cosplay
┃➽ ${config.prefix}horror
┃➽ ${config.prefix}magic
┃➽ ${config.prefix}medieval
┃➽ ${config.prefix}thumbnail
┃➽ ${config.prefix}youtube
┃➽ ${config.prefix}instagram
┃➽ ${config.prefix}facebook
┃➽ ${config.prefix}tiktok
┃➽ ${config.prefix}bookcover
┃➽ ${config.prefix}album
╚❏

> © MUFASER-X BY ROMA-TECH
`.trim();

  const menu = styled(rawMenu);
  
  const images = [
      'https://i.ibb.co/Rkg7Xg3Z/f32cdd6b4969.jpg',
      'https://res.cloudinary.com/vaitzgwv/image/upload/v1789547378/ptesomyo4liqkdgahrvw.jpg',
      'https://res.cloudinary.com/vaitzgwv/image/upload/v1789098558/rbl1gcl0i2i7dhf2in2j.jpg'
    ];

   const randomImage = images[Math.floor(Math.random() * images.length)];
   
   try { await sock.sendMessage(jid, { delete: loading.key }); } catch {}
    
    await sock.sendMessage(jid, { 
      image: { url: randomImage },
      caption: menu
    }, { quoted: msg });
  },
};
