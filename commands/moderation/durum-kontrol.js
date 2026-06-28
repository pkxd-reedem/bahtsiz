
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('durum-kontrol')
        .setDescription('Belirtilen role sahip olup durumunda "/bahtsiz" yazmayan kullanıcıları listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const requiredRoleId = '1513241732748153073';
        const requiredStatus = '/bahtsiz';
        const guild = interaction.guild;

        try {
            const members = await guild.members.fetch();
            const nonCompliantMembers = [];

            members.forEach(member => {
                // Botları ve rolü olmayanları atla
                if (member.user.bot || !member.roles.cache.has(requiredRoleId)) {
                    return;
                }

                const customStatus = member.presence?.activities.find(activity => activity.type === ActivityType.Custom);
                
                if (!customStatus || !customStatus.state || !customStatus.state.includes(requiredStatus)) {
                    nonCompliantMembers.push(member);
                }
            });

            if (nonCompliantMembers.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('✅ Herkes Uyumlu')
                    .setDescription(`\`${requiredStatus}\` rolüne sahip tüm üyelerin durumunda gerekli metin bulunuyor.`);
                return interaction.editReply({ embeds: [embed] });
            }

            const description = nonCompliantMembers.map(member => `- ${member.user.tag} (${member.id})`).join('\\n');

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Durumunda "/bahtsiz" Olmayanlar')
                .setDescription(description)
                .setFooter({ text: `Toplam ${nonCompliantMembers.length} kişi bulundu.` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Durum kontrolü sırasında bir hata oluştu:', error);
            await interaction.editReply({ content: 'Komutu yürütürken bir hata oluştu.' });
        }
    },
};
