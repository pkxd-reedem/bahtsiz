const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ekonomiyi-sifirla')
        .setDescription('[!!TEHLİKELİ!!] Sunucudaki tüm ekonomi verilerini sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_reset')
            .setLabel('Evet, Tüm Ekonomiyi Sıfırla')
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_reset')
            .setLabel('Hayır, İptal Et')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ Emin misin?')
            .setDescription('Bu işlem geri alınamaz! Sunucudaki **tüm** kullanıcıların cüzdan ve banka verileri kalıcı olarak silinecektir. Devam etmek istiyor musun?');

        const message = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_reset') {
                const allData = await db.all();
                const moneyData = allData.filter(d => d.id.startsWith('cuzdan_') || d.id.startsWith('banka_'));
                
                for (const entry of moneyData) {
                    await db.delete(entry.id);
                }

                await i.update({ content: '✅ Sunucu ekonomisi başarıyla sıfırlandı.', embeds: [], components: [] });
            } else if (i.customId === 'cancel_reset') {
                await i.update({ content: 'İşlem iptal edildi.', embeds: [], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Zaman aşımı! Sıfırlama işlemi iptal edildi.', embeds: [], components: [] });
            }
        });
    },
};