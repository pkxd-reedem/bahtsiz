const { Events, PermissionsBitField } = require('discord.js');

// Render Environment'dan OWNER_ID'yi alıyoruz
const ownerId = process.env.OWNER_ID;

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`'${interaction.commandName}' adında bir komut bulunamadı.`);
            await interaction.reply({ content: 'Bu komut bulunamadı veya bir hata oluştu!', ephemeral: true });
            return;
        }

        // --- YENİ YETKİ KONTROL MERKEZİ ---

        // Komutun bir yetki gereksinimi var mı?
        // Genellikle komutun data'sında default_member_permissions ile belirtilir.
        const requiredPermission = command.data.default_member_permissions;

        // Eğer komut bir yetki gerektiriyorsa...
        if (requiredPermission) {
            const isOwner = interaction.user.id === ownerId;
            // Kullanıcının sunucuda gerekli yetkiye sahip olup olmadığını kontrol et
            const hasPermission = interaction.member.permissions.has(requiredPermission);

            // EĞER KULLANICI, SAHİP DEĞİLSE VE YETKİSİ DE YOKSA...
            if (!isOwner && !hasPermission) {
                await interaction.reply({
                    content: 'Bu komutu kullanmak için gerekli yetkilere sahip değilsin.',
                    ephemeral: true // Bu mesaj sadece komutu deneyen kişiye görünür
                });
                return; // Komutu çalıştırmayı burada durdur.
            }
        }

        // --- YETKİ KONTROLÜ BAŞARILI ---
        // Kod buraya ulaştıysa, kullanıcı ya sahipti ya da yetkisi vardı.

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Komut yürütülürken hata oluştu: ${interaction.commandName}`);
            console.error(error);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Bu komutu yürütürken bir hata oluştu!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Bu komutu yürütürken bir hata oluştu!', ephemeral: true });
            }
        }
    },
};
