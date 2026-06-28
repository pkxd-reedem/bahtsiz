const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('oylama')
        .setDescription('Sunucuda evet/hayır oylaması başlatır.')
        .addStringOption(option =>
            option.setName('konu')
                .setDescription('Oylamanın konusu veya sorusu')
                .setRequired(true)),

    async execute(interaction) {
        const konu = interaction.options.getString('konu');

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📊 Oylama Başladı!')
            .setDescription(`**Konu:** ${konu}`)
            .setTimestamp()
            .setFooter({ text: `Oylamayı başlatan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        try {
            // Önce bir "işleniyor" mesajı göndermek yerine doğrudan mesajı gönderip fetch ediyoruz.
            const message = await interaction.reply({ embeds: [embed], fetchReply: true });

            // Gönderilen mesaja tepkileri ekliyoruz.
            await message.react('👍');
            await message.react('👎');

        } catch (error) {
            console.error('Oylama komutunda hata:', error);
            // Eğer ilk reply başarısız olursa diye bir fallback
            if (!interaction.replied) {
                 await interaction.reply({ content: 'Oylama oluşturulurken bir hata oluştu.', ephemeral: true });
            }
        }
    },
};