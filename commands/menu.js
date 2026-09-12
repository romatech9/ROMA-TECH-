// ============================================================
// Command: .menu
// ============================================================
const os = require('os');
const config = require('../config.js');
const { getRamUsage, getCpuModel, formatUptime, getDate, getTime, getPlatform } = require('../utils');

// Count commands dynamically
const path = require('path');
const fs = require('fs');
function countCommands() {
  try {
    return fs.readdirSync(path.join(__dirname)).filter(f => f.endsWith('.js')).length;
  } catch {
    return 0;
  }
}

module.exports = {
  name: 'menu',
  description: 'Show the bot command menu',
  
  async execute(sock, msg, jid, args, sender) {
const loading = await sock.sendMessage(jid, { text: `𝙇𝙤𝙖𝙙𝙞𝙣𝙜 𝙢𝙚𝙣𝙪.....` }, { quoted: msg });
    const uptime = formatUptime(process.uptime());
    const ram = getRamUsage();
    const cpu = getCpuModel();
    const platform = getPlatform();
    const date = getDate();
    const time = getTime();
    const cmdCount = countCommands();
    const more = String.fromCharCode(8206).repeat(4001);
    const menu = `
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
╔╔═≫「❒ *OWNER COMMANDS* ❒」 
║➽ ${config.prefix}setprefix
║➽ ${config.prefix}mode
║➽ ${config.prefix}addsudo
║➽ ${config.prefix}listgc
║➽ ${config.prefix}autotyping
║➽ ${config.prefix}autorecord
║➽ ${config.prefix}join 
║➽ ${config.prefix}pp2
║➽ ${config.prefix}pp
║➽ ${config.prefix}delpp
║➽ ${config.prefix}setpp
║➽ ${config.prefix}block 
║➽ ${config.prefix}unblock
║➽ ${config.prefix}blocklist
║➽ ${config.prefix}unblockall
║➽ ${config.prefix}leave 
║➽ ${config.prefix}leaveall
║➽ ${config.prefix}setbotpp
║➽ ${config.prefix}status 
║➽ ${config.prefix}vv2
║➽ ${config.prefix}device 
║➽ ${config.prefix}getpp2
║➽ ${config.prefix}creategc
║➽ ${config.prefix}createchanl
║➽ ${config.prefix}createcomnit
╚❏ 
                      
╔╔═≫「❒ *UNITY COMMANDS* ❒」 
║➽ ${config.prefix}menu
║➽ ${config.prefix}p
║➽ ${config.prefix}s
║➽ ${config.prefix}ping
║➽ ${config.prefix}up
║➽ ${config.prefix}alive 
║➽ ${config.prefix}owner 
║➽ ${config.prefix}vv
║➽ ${config.prefix}retrieve
║➽ ${config.prefix}viewonce
║➽ ${config.prefix}take 
║➽ ${config.prefix}hacker
║➽ ${config.prefix}admins
║➽ ${config.prefix}listadmin 
║➽ ${config.prefix}gadmins
║➽ ${config.prefix}adminlist
║➽ ${config.prefix}s2img
║➽ ${config.prefix}getpp
║➽ ${config.prefix}toimage 
║➽ ${config.prefix}tovideo
║➽ ${config.prefix}toaudio
║➽ ${config.prefix}toaudio2
║➽ ${config.prefix}tomedia
║➽ ${config.prefix}tocode
╚❏

╔╔═≫「❒ *ANTI OWN COMMANDS* ❒」
║➽ ${config.prefix}antidelete 
║➽ ${config.prefix}anticall
║➽ ${config.prefix}antidm
║➽ ${config.prefix}antideletestatus 
╚❏

╔╔═≫「❒ *AUTO COMMANDS* ❒」
║➽ ${config.prefix}autoviewstatus
║➽ ${config.prefix}autolike
║➽ ${config.prefix}autolikestatus
║➽ ${config.prefix}autoreact
║➽ ${config.prefix}autoreactchannel
╚❏

╔╔═≫「❒ *DOWNLOAD COMMANDS* ❒」 
║➽ ${config.prefix}song
║➽ ${config.prefix}play 
║➽ ${config.prefix}url
╚❏

╔╔═≫「❒ *GROUP COMMANDS* ❒」 
║➽ ${config.prefix}add
║➽ ${config.prefix}invite
║➽ ${config.prefix}tagall 
║➽ ${config.prefix}mute
║➽ ${config.prefix}close 
║➽ ${config.prefix}lock 
║➽ ${config.prefix}gcclose 
║➽ ${config.prefix}open 
║➽ ${config.prefix}unlock
║➽ ${config.prefix}unmute 
║➽ ${config.prefix}gcopen
║➽ ${config.prefix}setgcpp
║➽ ${config.prefix}setppgc
║➽ ${config.prefix}setgpic
║➽ ${config.prefix}setgcname
║➽ ${config.prefix}gname 
║➽ ${config.prefix}setname
║➽ ${config.prefix}setgdesc 
║➽ ${config.prefix}setdesc
║➽ ${config.prefix}setgcdesc
║➽ ${config.prefix}delgcpp
║➽ ${config.prefix}togstatus
║➽ ${config.prefix}delppgc
║➽ ${config.prefix}delgcdesc
║➽ ${config.prefix}deldesc
║➽ ${config.prefix}cleardesc
║➽ ${config.prefix}delgdesc
║➽ ${config.prefix}link
║➽ ${config.prefix}grouplink
║➽ ${config.prefix}invitelink
║➽ ${config.prefix}gclink
║➽ ${config.prefix}editgc
║➽ ${config.prefix}gcinfo
║➽ ${config.prefix}groupedit
║➽ ${config.prefix}editgroup
║➽ ${config.prefix}approve 
║➽ ${config.prefix}approval 
║➽ ${config.prefix}requestapprove
║➽ ${config.prefix}approve 
║➽ ${config.prefix}approval 
║➽ ${config.prefix}approve 
║➽ ${config.prefix}addmember
║➽ ${config.prefix}addmode
║➽ ${config.prefix}addmembers
║➽ ${config.prefix}memberadd
║➽ ${config.prefix}approveall
║➽ ${config.prefix}acceptrequests
║➽ ${config.prefix}approveallreq   
║➽ ${config.prefix}rejectall  
║➽ ${config.prefix}rejectallreq
║➽ ${config.prefix}denyall
║➽ ${config.prefix}requests
║➽ ${config.prefix}resetgclink
║➽ ${config.prefix}revoke
║➽ ${config.prefix}newlink
║➽ ${config.prefix}resetlink
║➽ ${config.prefix}kick 
║➽ ${config.prefix}kill
║➽ ${config.prefix}removeadmins
║➽ ${config.prefix}unadminall
║➽ ${config.prefix}demoteall
║➽ ${config.prefix}joinreq
║➽ ${config.prefix}pending
║➽ ${config.prefix}req
║➽ ${config.prefix}d
║➽ ${config.prefix}delete
║➽ ${config.prefix}del
║➽ ${config.prefix}gcpp
║➽ ${config.prefix}makealladmin
║➽ ${config.prefix}adminall
║➽ ${config.prefix}promoteall
║➽ ${config.prefix}getppgc
║➽ ${config.prefix}getgpic
║➽ ${config.prefix}getgcpp
║➽ ${config.prefix}out 
║➽ ${config.prefix}remove 
║➽ ${config.prefix}promote 
║➽ ${config.prefix}makeadmin
║➽ ${config.prefix}admin
║➽ ${config.prefix}unadmin
║➽ ${config.prefix}removeadmin
║➽ ${config.prefix}demote 
║➽ ${config.prefix}kickall
║➽ ${config.prefix}outall
║➽ ${config.prefix}killall
║➽ ${config.prefix}confirmkick
║➽ ${config.prefix}pin
║➽ ${config.prefix}unpin
╚❏

╔╔═≫「❒ *ANTI GRP COMMANDS* ❒」
║➽ ${config.prefix}antilink 
║➽ ${config.prefix}antibot
║➽ ${config.prefix}antitag 
║➽ ${config.prefix}antitext
║➽ ${config.prefix}antispam
║➽ ${config.prefix}antisticker  
║➽ ${config.prefix}antibadword
║➽ ${config.prefix}antiviewonce
║➽ ${config.prefix}antigcmention
║➽ ${config.prefix}antisong
║➽ ${config.prefix}antiaudio
║➽ ${config.prefix}antivideo
║➽ ${config.prefix}antiforward
║➽ ${config.prefix}antipromote
║➽ ${config.prefix}antidemote
║➽ ${config.prefix}antiimage
╚❏

╔╔═≫「❒ *TTS COMMANDS* ❒」
║➽ ${config.prefix}sham
║➽ ${config.prefix}tts 
║➽ ${config.prefix}adam
║➽ ${config.prefix}mvoice
║➽ ${config.prefix}boy
╚❏

╔╔═≫「❒ *DEPLOY COMMANDS* ❒」
║➽ ${config.prefix}sound1
║➽ ${config.prefix}sound2
║➽ ${config.prefix}sound3
║➽ ${config.prefix}sound4
║➽ ${config.prefix}sound5
╚❏

> © MUFASER-X BY ROMA-TECH
`.trim();

    const images = [
      'https://i.ibb.co/Rkg7Xg3Z/f32cdd6b4969.jpg',
      'https://res.cloudinary.com/vaitzgwv/image/upload/v1789098558/rbl1gcl0i2i7dhf2in2j.jpg'
    ];

    // Pick random image each time
    const randomImage = images[Math.floor(Math.random() * images.length)];

    await sock.sendMessage(jid, { 
      image: { url: randomImage },
      caption: menu
    }, { quoted: msg });
  },
};
