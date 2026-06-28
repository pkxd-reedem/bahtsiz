
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const token = process.env.TOKEN;

if (!token) {
    throw new Error('TOKEN bulunamadı! Lütfen .env dosyanızı veya ortam değişkenlerinizi kontrol edin.');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
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
    const eventOrHandler = require(filePath);

    // Yüklenen modül bir fonksiyon ise (yeni handler sistemimiz için)
    if (typeof eventOrHandler === 'function') {
        eventOrHandler(client);
    } 
    // Yüklenen modül bir olay objesi ise (eski sistem için)
    else if (eventOrHandler.name && typeof eventOrHandler.execute === 'function') {
        if (eventOrHandler.once) {
            client.once(eventOrHandler.name, (...args) => eventOrHandler.execute(...args, client));
        } else {
            client.on(eventOrHandler.name, (...args) => eventOrHandler.execute(...args, client));
        }
    } else {
      console.log(`[UYARI] ${filePath} dosyası geçerli bir olay dosyası olarak yüklenemedi.`);
    }
}

client.login(token);
