const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kullanici-bilgi')
        .setDescription('Bir kullanıcı hakkında bilgi verir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Bilgisi gösterilecek kullanıcı')),
    async execute(interaction) {
        const user = interaction.options.getUser('kullanici') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setTitle(`${user.username} Kullanıcı Bilgileri`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Kullanıcı Adı', value: user.tag, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Hesap Oluşturma Tarihi', value: user.createdAt.toLocaleDateString(), inline: true },
                { name: 'Sunucuya Katılma Tarihi', value: member.joinedAt.toLocaleDateString(), inline: true },
                { name: 'Rolleri', value: member.roles.cache.map(role => role.name).join(', '), inline: false },
            )
            .setColor('#0099ff')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};