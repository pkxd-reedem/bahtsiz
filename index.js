const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
// Express kütüphanesini web sunucusu için dahil ediyoruz
const express = require('express'); 

// DOTENV paketini en üste ekliyoruz. Bu, .env dosyasını veya ortam değişkenlerini okur.
require('dotenv').config();

// --- RENDER 7/24 AKTİF TUTMA SUNUCUSU ---
const app = express();
const port = process.env.PORT || 8080;

// Render bu adrese ping attığında "Aktif" yanıtı alacak ve bot kapanmayacak
app.get('/', (req, res) => {
    res.send('808 Botu 7/24 Aktif Durumda!');
});

app.listen(port, () => {
    console.log(`[WEB SERVER] Bot için web sunucusu ${port} portunda başarıyla başlatıldı.`);
});
// ----------------------------------------

// Token, clientId ve guildId'yi process.env'den alıyoruz.
// Bu, önce ortam değişkenlerine (Render'daki gibi) bakar, bulamazsa null olur.
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Eğer token bulunamazsa, botun başlamasını engelle.
if (!token) {
    throw new Error('TOKEN bulunamadı! Lütfen .env dosyanızı veya ortam değişkenlerinizi kontrol edin.');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions] });

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
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// --- OTOMATİK SLASH KOMUT YÜKLEYİCİ ---
try {
    console.log('[DISCORD] Yeni slash komutları Discord\'a yükleniyor...');
    require('./deploy-commands.js');
    console.log('[DISCORD] Tüm slash komutları başarıyla senkronize edildi!');
} catch (error) {
    console.error('[HATA] Komutlar yüklenirken bir sorun oluştu:', error);
}
// ----------------------------------------

client.login(token);
