
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

// --- En Kararlı Olay Yükleyici ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
        const event = require(filePath);
        // Standart olay formatı: { name, execute }
        if (event.name && typeof event.execute === 'function') {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        } 
        // Yeni handler formatı: (client) => { ... }
        else if (typeof event === 'function') {
            event(client);
        } 
        // Diğer durumlar için uyarı ver (roleCreate gibi dosyalar artık bu bloğa düşmemeli)
        else {
            // console.log(`[BİLGİ] ${file} bir olay dinleyicisi değil, atlanıyor.`);
        }
    } catch (error) {
        console.error(`[HATA] ${file} olay dosyası yüklenirken bir sorun oluştu:`, error);
    }
}
// ----------------------------------

client.login(token);
