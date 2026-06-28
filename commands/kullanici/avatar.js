const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Bir kullanıcının avatarını gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Avatarı gösterilecek kullanıcı')),
    async execute(interaction) {
        const user = interaction.options.getUser('kullanici') || interaction.user;
        const avatarURL = user.displayAvatarURL({ dynamic: true, size: 4096 });

        const embed = new EmbedBuilder()
            .setTitle(`${user.username} adlı kullanıcının avatarı`)
            .setImage(avatarURL)
            .setColor('#0099ff')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};