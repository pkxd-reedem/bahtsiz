
const fs = require('node:fs');
const path = require('node:path');
// GatewayIntentBits'e GuildPresences ve GuildMembers ekliyoruz.
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
    throw new Error('TOKEN bulunamadı! Lütfen .env dosyanızı veya ortam değişkenlerinizi kontrol edin.');
}

// Yeni intent'leri (yetkileri) client'a ekliyoruz.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences, // Kullanıcı durumlarını (status, activity) okumak için gerekli.
        GatewayIntentBits.GuildMembers    // Üye bilgilerini çekmek ve DM göndermek için gerekli.
    ]
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[UYARI] ${filePath} dosyasındaki komut, gerekli "data" veya "execute" özelliklerinden yoksun.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    // Eğer dosya bir "-handler.js" ise, onu client ile başlat.
    if (file.endsWith('-handler.js')) {
        event(client);
    } else if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(token);
