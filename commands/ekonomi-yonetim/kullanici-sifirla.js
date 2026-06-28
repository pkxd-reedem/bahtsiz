const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kullanici-sifirla')
        .setDescription('[Yönetici] Bir kullanıcının tüm ekonomi verilerini sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => 
            option.setName('hedef')
                .setDescription('Verileri sıfırlanacak kullanıcı.')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('hedef');

        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm_reset_${targetUser.id}`)
            .setLabel('Evet, Sıfırla')
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_reset')
            .setLabel('Hayır, İptal Et')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ Kullanıcı Verilerini Sıfırlama Onayı')
            .setDescription(`**${targetUser.username}** adlı kullanıcının tüm cüzdan, banka ve envanter verilerini kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz. Emin misiniz?`);

        const message = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 20000 });

        collector.on('collect', async i => {
            if (i.customId === `confirm_reset_${targetUser.id}`) {
                await db.delete(`cuzdan_${targetUser.id}`);
                await db.delete(`banka_${targetUser.id}`);
                await db.delete(`envanter_${targetUser.id}`);
                // İsteğe bağlı: Cooldownları da silebilirsiniz
                // await db.delete(`gunluk_cooldown_${targetUser.id}`);
                // await db.delete(`calis_cooldown_${targetUser.id}`);
                
                await i.update({ content: `✅ **${targetUser.username}** adlı kullanıcının ekonomi verileri başarıyla sıfırlandı.`, embeds: [], components: [] });
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