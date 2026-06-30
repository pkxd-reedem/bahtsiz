const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('croxydb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('durum-rol')
        .setDescription('Durumunda belirli bir metin yazanlara verilecek rolü ayarlar. (Sadece Sunucu Sahibi)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Ayarlanacak rol.')
                .setRequired(true)
        ),

    async execute(interaction) {
        // This command can only be used by the guild owner.
        if (interaction.user.id !== interaction.guild.ownerId) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Yetkin Yok!')
                .setDescription('Bu komutu sadece sunucu sahibi kullanabilir.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const role = interaction.options.getRole('rol');
        const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

        // Check if the bot's role is high enough to manage the selected role.
        if (role.position >= botMember.roles.highest.position) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Yetersiz Yetki')
                .setDescription(`Seçtiğiniz rol (${role}) benim rolümden daha yüksek veya aynı seviyede. Lütfen botun rolünü, bu rolün üzerine taşıyın.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Save the role ID to the database for this guild.
        db.set(`statusRoleId_${interaction.guild.id}`, role.id);

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Başarılı!')
            .setDescription(`Durum rolü başarıyla ${role} olarak ayarlandı. Artık birinin durumunda \`/bahtsız\` veya \`/bahtsiz\` yazarsa bu rol otomatik olarak verilecek.`);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
