const { REST, Routes } = require('discord.js');
// DOTENV paketini en üste ekliyoruz
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

// Bilgileri process.env'den alıyoruz
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Değişkenlerin varlığını kontrol et
if (!token || !clientId || !guildId) {
    throw new Error('TOKEN, CLIENT_ID veya GUILD_ID bulunamadı! Lütfen .env dosyanızı veya ortam değişkenlerinizi kontrol edin.');
}

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[UYARI] ${filePath} dosyasındaki komut, gerekli "data" veya "execute" özelliklerinden yoksun.`);
        }
    }
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`${commands.length} adet komut (/) yenileniyor.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`${data.length} adet komut (/) başarıyla yüklendi.`);
    } catch (error) {
        console.error(error);
    }
})();
