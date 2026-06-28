const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('durum-kanal')
        .setDescription('Botu belirtilen bir ses kanalına kalıcı olarak katılır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Sadece yöneticiler kullanabilsin
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Botun katılacağı ses kanalı.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)), // Sadece ses kanalları seçilebilsin

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const voiceChannel = interaction.options.getChannel('kanal');
        const guild = interaction.guild;

        // Önceki bağlantıyı kontrol et ve varsa sonlandır
        const existingConnection = getVoiceConnection(guild.id);
        if (existingConnection) {
            // Eğer zaten aynı kanalda ise, bilgi ver.
            if (existingConnection.joinConfig.channelId === voiceChannel.id) {
                const embed = new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription(`🤷‍♂️ Zaten <#${voiceChannel.id}> kanalındayım.`);
                return interaction.editReply({ embeds: [embed] });
            }
            existingConnection.destroy();
        }

        try {
            // Yeni kanala bağlan
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true, // Bot kendini sağırlaştırır, bu performansı artırır
            });

            // Bağlantı durumlarını dinle
            connection.on(VoiceConnectionStatus.Ready, () => {
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('✅ Bağlantı Başarılı')
                    .setDescription(`Artık <#${voiceChannel.id}> kanalında sürekli olarak bulunacağım.`);
                interaction.editReply({ embeds: [embed] });
            });

            connection.on(VoiceConnectionStatus.Disconnected, () => {
                // Bağlantı koptuğunda yeniden bağlanmayı deneyebilir veya sadece yok edebilir.
                // Şimdilik basit tutuyoruz ve bağlantıyı yok ediyoruz.
                connection.destroy();
            });

        } catch (error) {
            console.error('Ses kanalına katılırken hata:', error);
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Bir Hata Oluştu')
                .setDescription('Ses kanalına katılırken beklenmedik bir sorun yaşandı. Lütfen botun izinlerini kontrol et.');
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
