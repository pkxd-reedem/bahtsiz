const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

console.log('--- Komut Dağıtım Scripti Başlatıldı ---');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
    console.error('HATA: TOKEN bulunamadı!');
    process.exit(1);
}
if (!clientId) {
    console.error('HATA: CLIENT_ID bulunamadı!');
    process.exit(1);
}
if (!guildId) {
    console.error('HATA: GUILD_ID bulunamadı!');
    process.exit(1);
}

console.log(`CLIENT_ID: ${clientId}`);
console.log(`GUILD_ID: ${guildId}`);

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

console.log('Komutlar klasörleri okunuyor...');
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            console.log(`[+] Bulunan Komut: ${command.data.name}`);
            commands.push(command.data.toJSON());
        } else {
            console.log(`[UYARI] ${filePath} dosyasındaki komut, gerekli "data" veya "execute" özelliklerinden yoksun.`);
        }
    }
}

if (commands.length === 0) {
    console.error('HATA: Yüklenecek komut bulunamadı. Komut dosyalarınızı kontrol edin.');
    process.exit(1); // Komut bulunamazsa scripti durdur
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`${commands.length} adet komut (/) Discord API'sine gönderiliyor...`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`--- BAŞARILI: ${data.length} adet komut (/) yüklendi. ---`);
        console.log('Bot şimdi başlatılacak...');

    } catch (error) {
        console.error('--- HATA: Komutlar yüklenirken bir sorun oluştu! ---');
        console.error(error);
        process.exit(1); // Hata durumunda scripti durdur
    }
})();
