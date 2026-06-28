const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

function getConfig() {
    try {
        if (!fs.existsSync(configPath)) return {};
        const data = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(data || '{}');
    } catch (error) {
        console.error("config.json okuma hatası:", error);
        return {};
    }
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Botun kendi mesajlarına veya diğer botlara cevap vermesini engelle
        if (message.author.bot) return;
        if (!message.guild) return;

        const config = getConfig();
        const guildConfig = config[message.guild.id];

        if (!guildConfig || !guildConfig.otoCevaplar || guildConfig.otoCevaplar.length === 0) {
            return; // Sunucu için ayarlanmış oto cevap yoksa işlemi bitir
        }

        const messageContent = message.content.toLowerCase();

        // Mesaj içeriği, tetikleyicilerden biriyle tam olarak eşleşiyor mu kontrol et
        const matchedOtoCevap = guildConfig.otoCevaplar.find(oc => oc.tetikleyici === messageContent);

        if (matchedOtoCevap) {
            try {
                await message.channel.send(matchedOtoCevap.cevap);
            } catch (error) {
                console.error('Oto cevap gönderilemedi:', error);
            }
        }
    },
};