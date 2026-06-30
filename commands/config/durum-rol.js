const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('croxydb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('durum-rol')
        .setDescription('Durumunda belirli bir metin yazanlara verilecek rolü ayarlar. (Yönetici Yetkisi Gerekir)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Sadece Yönetici yetkisi olanlar kullanabilir
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Ayarlanacak rol.')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Yetki kontrolü artık Discord tarafından otomatik olarak yapılıyor.
        // Bu yüzden ek bir kontrole gerek yok.

        const role = interaction.options.getRole('rol');
        const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

        // Botun rolünün, yöneteceği rolden üstün olup olmadığını kontrol et.
        if (role.position >= botMember.roles.highest.position) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Yetersiz Yetki')
                .setDescription(`Seçtiğiniz rol (${role}) benim rolümden daha yüksek veya aynı seviyede. Lütfen botun rolünü, bu rolün üzerine taşıyın.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Rol ID'sini veritabanına kaydet.
        db.set(`statusRoleId_${interaction.guild.id}`, role.id);

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Başarılı!')
            .setDescription(`Durum rolü başarıyla ${role} olarak ayarlandı. Artık birinin durumunda \`/bahtsız\` veya \`/bahtsiz\` yazarsa bu rol otomatik olarak verilecek.`);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
