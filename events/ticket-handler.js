const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

function getConfig() {
    try {
        if (!fs.existsSync(configPath)) return {};
        const data = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(data || '{}');
    } catch (error) {
        console.error("config.json okuma hatası:", error);
        return {};
    }
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.guild) return;
        
        const config = getConfig();
        const guildConfig = config[interaction.guild.id] || {};
        const staffRoleId = guildConfig.ticketSorumluRolId;

        // Ticket oluşturma butonu tıklandığında
        if (interaction.isButton() && interaction.customId === 'ticket_create') {
            const konular = guildConfig.ticketKonulari;
            if (!konular || konular.length === 0) {
                return interaction.reply({ content: 'Ticket sistemi için konular henüz ayarlanmamış.', ephemeral: true });
            }

            const options = konular.map(konu => ({
                label: konu.label,
                description: `Konu: ${konu.label}`,
                value: konu.value,
                emoji: konu.emoji,
            }));

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket_select_topic')
                        .setPlaceholder('Lütfen bir ticket konusu seçin')
                        .addOptions(options),
                );

            await interaction.reply({ content: 'Ticket oluşturma nedeninizi seçin:', components: [row], ephemeral: true });
        }

        // Ticket konusu seçildiğinde
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_topic') {
            await interaction.deferReply({ ephemeral: true });

            const topicValue = interaction.values[0];
            const topic = guildConfig.ticketKonulari.find(t => t.value === topicValue);

            const category = interaction.guild.channels.cache.get(guildConfig.ticketKategoriId);

            if (!category || !staffRoleId) {
                return interaction.editReply('Ticket ayarları eksik (sorumlu rol veya kategori). Lütfen bir yöneticiyle iletişime geçin.');
            }

            const channelName = `ticket-${topic.value.substring(0, 10)}-${interaction.user.username.substring(0, 10)}`.toLowerCase().replace(/ /g, '-');
            const existingChannel = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id && c.name.startsWith(`ticket-${topic.value}`));
            
            if (existingChannel) {
                 return interaction.editReply(`Zaten bu konuda açık bir ticketiniz bulunuyor: ${existingChannel}`);
            }

            try {
                const channel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    topic: interaction.user.id, // Kanalın topic'ine kullanıcı ID'sini yazarak kimin açtığını anlarız.
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] },
                        { id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages] },
                        { id: interaction.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels] }
                    ],
                });

                await interaction.editReply(`Ticket kanalınız oluşturuldu: ${channel}`);

                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`${topic.emoji} ${topic.label}`)
                    .setDescription(`Hoş geldin ${interaction.user}!\nLütfen sorununuzu veya talebinizi detaylı bir şekilde açıklayın. Bir yetkili en kısa sürede size yardımcı olacaktır.`)
                    .addFields({ name: 'Kullanıcı', value: interaction.user.tag, inline: true }, { name: 'Konu', value: topic.label, inline: true })
                    .setTimestamp();

                const actionRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`ticket_close`).setLabel('Ticketı Kapat').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                        new ButtonBuilder().setCustomId(`ticket_claim`).setLabel('Ticketa Sahip Çık').setStyle(ButtonStyle.Success).setEmoji('🙋')
                    );
                
                const staffRoleMention = `<@&${staffRoleId}>`;
                await channel.send({ content: `${interaction.user} ${staffRoleMention}`, embeds: [embed], components: [actionRow] });

            } catch (error) {
                console.error('Ticket kanalı oluşturma hatası:', error);
                await interaction.editReply('Ticket oluşturulurken bir hata oluştu. Lütfen botun izinlerini kontrol edin.');
            }
        }

        // Ticket Kapatma Butonu
        if (interaction.isButton() && interaction.customId === 'ticket_close') {
            if (!interaction.member.roles.cache.has(staffRoleId)) {
                return interaction.reply({ content: 'Bu butonu kullanmak için gerekli yetkiye sahip değilsiniz.', ephemeral: true });
            }

            await interaction.reply({ content: `Ticket ${interaction.user} tarafından kapatılıyor. Bu kanal 5 saniye içinde silinecektir.` });
            setTimeout(() => {
                interaction.channel.delete().catch(err => console.error('Kanal silinemedi:', err));
            }, 5000);
        }

        // Ticket Sahip Çıkma Butonu
        if (interaction.isButton() && interaction.customId === 'ticket_claim') {
             if (!interaction.member.roles.cache.has(staffRoleId)) {
                return interaction.reply({ content: 'Bu butonu kullanmak için gerekli yetkiye sahip değilsiniz.', ephemeral: true });
            }

            const originalMessage = interaction.message;
            const originalEmbed = originalMessage.embeds[0];

            const updatedEmbed = new EmbedBuilder(originalEmbed.toJSON())
                .setColor('#2ECC71') // Yeşil Renk
                .addFields({ name: 'Yetkili', value: `${interaction.user}` });

            const disabledButtons = new ActionRowBuilder().addComponents(
                originalMessage.components[0].components[0], // Kapat butonu
                new ButtonBuilder()
                    .setCustomId('ticket_claimed')
                    .setLabel('Ticket Sahiplenildi')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✔️')
                    .setDisabled(true)
            );

            await originalMessage.edit({ embeds: [updatedEmbed], components: [disabledButtons] });
            await interaction.reply({ content: `Bu ticket ile ${interaction.user} ilgileniyor.`, ephemeral: false });
        }
    },
};