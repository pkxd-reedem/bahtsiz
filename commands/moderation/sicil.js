const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const uyarilarPath = path.join(__dirname, '../../data/uyarilar.json');

function getUyarilar() {
    if (!fs.existsSync(uyarilarPath)) {
        return [];
    }
    const data = fs.readFileSync(uyarilarPath, 'utf-8');
    return JSON.parse(data);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sicil')
        .setDescription('Bir kullanıcının geçmiş uyarılarını (sicilini) gösterir.')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Sicili görüntülenecek kullanıcı')
                .setRequired(true)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        const uyarilar = getUyarilar();
        
        const userUyarilari = uyarilar.filter(uyari => uyari.userId === targetUser.id);

        if (userUyarilari.length === 0) {
            await interaction.reply({ content: `${targetUser.tag} kullanıcısının hiç uyarısı bulunmuyor.`, ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`${targetUser.username} adlı kullanıcının sicili`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        userUyarilari.forEach(uyari => {
            embed.addFields({
                name: `Uyarı ID: ${uyari.id}`,
                value: `**Sebep:** ${uyari.reason}
**Yetkili:** ${uyari.moderatorTag}
**Tarih:** <t:${parseInt(new Date(uyari.timestamp).getTime() / 1000)}:R>`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    },
};
