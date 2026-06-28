
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const express = require('express');
require('dotenv').config();

const token = process.env.TOKEN;
if (!token) {
    throw new Error('TOKEN bulunamadı! Lütfen .env dosyanızı veya ortam değişkenlerinizi kontrol edin.');
}

// --- Render Port Sorununu Çözmek İçin Web Sunucusu ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Bahtısız Bot Aktif!');
});
app.listen(port, () => {
  console.log(`Web sunucusu ${port} portunda başlatıldı.`);
});
// -----------------------------------------------------

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

// --- Geliştirilmiş Olay Yükleyici ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const eventOrHandler = require(filePath);

    // 1. Önce standart olay formatını kontrol et (nesne yapısı: { name, execute })
    if (eventOrHandler.name && typeof eventOrHandler.execute === 'function') {
        if (eventOrHandler.once) {
            client.once(eventOrHandler.name, (...args) => eventOrHandler.execute(...args, client));
        } else {
            client.on(eventOrHandler.name, (...args) => eventOrHandler.execute(...args, client));
        }
    } 
    // 2. Eğer standart format değilse, fonksiyon olup olmadığını kontrol et (yeni handler yapısı)
    else if (typeof eventOrHandler === 'function') {
        eventOrHandler(client);
    } 
    // 3. İkisi de değilse, uyarı ver
    else {
      console.log(`[UYARI] ${filePath} dosyası geçerli bir olay formatında değil (ne nesne ne de fonksiyon).`);
    }
}
// ----------------------------------

client.login(token);
