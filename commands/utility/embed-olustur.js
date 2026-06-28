const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed-olustur')
        .setDescription('Özelleştirilmiş bir embed mesajı oluşturur ve gönderir.')
        .addStringOption(option =>
            option.setName('baslik')
                .setDescription('Embed mesajının başlığı'))
        .addStringOption(option =>
            option.setName('aciklama')
                .setDescription('Embed mesajının ana içeriği. Satır atlamak için \\n kullanabilirsiniz.'))
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Mesajın gönderileceği kanal (belirtilmezse bu kanala gönderilir)')
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option =>
            option.setName('renk')
                .setDescription('Embed\'in kenar rengi (HEX kodu, örn: #3498db)'))
        .addStringOption(option =>
            option.setName('resim-url')
                .setDescription('Embed\'in içine eklenecek resmin URL\'si'))
         .addStringOption(option =>
            option.setName('alt-bilgi')
                .setDescription('Embed\'in alt kısmında görünecek metin'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const title = interaction.options.getString('baslik');
        const description = interaction.options.getString('aciklama');
        const targetChannel = interaction.options.getChannel('kanal') || interaction.channel;
        const color = interaction.options.getString('renk');
        const imageUrl = interaction.options.getString('resim-url');
        const footerText = interaction.options.getString('alt-bilgi');

        if (!title && !description) {
            return interaction.reply({ content: 'Bir embed oluşturmak için en azından bir başlık veya açıklama girmelisiniz.', ephemeral: true });
        }

        const embed = new EmbedBuilder();

        if (title) embed.setTitle(title);
        if (description) embed.setDescription(description.replace(/\\n/g, '\n')); // \\n -> newline
        if (color) {
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                embed.setColor(color);
            } else {
                return interaction.reply({ content: 'Geçersiz renk kodu. Lütfen `#RRGGBB` formatında bir HEX kodu girin.', ephemeral: true });
            }
        } else {
            embed.setColor('#0099ff'); // Varsayılan renk
        }
        
        if (imageUrl) {
             try {
                const url = new URL(imageUrl);
                embed.setImage(imageUrl);
            } catch (error) {
                return interaction.reply({ content: 'Geçersiz resim URL\'si. Lütfen geçerli bir URL girin.', ephemeral: true });
            }
        }

        if (footerText) embed.setFooter({ text: footerText });

        embed.setTimestamp();

        try {
            await targetChannel.send({ embeds: [embed] });
            await interaction.reply({ content: `Embed mesajınız başarıyla ${targetChannel} kanalına gönderildi.`, ephemeral: true });
        } catch (error) {
            console.error('Embed gönderme hatası:', error);
             if (error.code === 50013) { // Missing Permissions
                 await interaction.reply({ content: `\`${targetChannel.name}\` kanalına mesaj gönderme yetkim yok.`, ephemeral: true });
            } else {
                await interaction.reply({ content: 'Embed mesajı gönderilirken bir hata oluştu.', ephemeral: true });
            }
        }
    },
};