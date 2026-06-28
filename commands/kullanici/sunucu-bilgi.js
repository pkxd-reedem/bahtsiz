const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sunucu-bilgi')
        .setDescription('Sunucu hakkında bilgi verir.'),
    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} Sunucu Bilgileri`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Sunucu Sahibi', value: owner.user.tag, inline: true },
                { name: 'Üye Sayısı', value: `${guild.memberCount}`, inline: true },
                { name: 'Oluşturulma Tarihi', value: guild.createdAt.toLocaleDateString(), inline: true },
                { name: 'Rol Sayısı', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Kanal Sayısı', value: `${guild.channels.cache.size}`, inline: true },
            )
            .setColor('#0099ff')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};