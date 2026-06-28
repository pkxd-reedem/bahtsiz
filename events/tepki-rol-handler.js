const { Events } = require('discord.js');
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

async function handleReaction(reaction, user) {
    if (user.bot) return; // Botların tepkilerini yoksay
    if (!reaction.message.guild) return; // DM'lerde çalışma

    // Mesajın partial olup olmadığını kontrol et. Eğer öyleyse, fetch et.
    if (reaction.message.partial) {
        try {
            await reaction.message.fetch();
        } catch (error) {
            console.error('Mesaj fetch edilirken hata oluştu:', error);
            return;
        }
    }

    const config = getConfig();
    if (!config.tepkiRoller) return;

    const reactionRole = config.tepkiRoller.find(
        (rr) => rr.messageId === reaction.message.id && rr.emoji === reaction.emoji.name
    );

    if (!reactionRole) return; // Ayarlanmış bir tepki-rol değil

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return; // Üye sunucudan ayrılmış olabilir

    const role = guild.roles.cache.get(reactionRole.roleId);
    if (!role) return; // Rol silinmiş olabilir
    
    return { member, role }; // Rol ve üyeyi sonraki adıma döndür
}


module.exports = {
    name: Events.ClientReady, // Birden fazla event dinlemek için bu sadece başlangıç noktası
    once: true,
    async execute(client) {

        client.on(Events.MessageReactionAdd, async (reaction, user) => {
            const result = await handleReaction(reaction, user);
            if (result && result.member && result.role) {
                if (!result.member.roles.cache.has(result.role.id)) {
                    result.member.roles.add(result.role).catch(console.error);
                }
            }
        });

        client.on(Events.MessageReactionRemove, async (reaction, user) => {
            const result = await handleReaction(reaction, user);
            if (result && result.member && result.role) {
                if (result.member.roles.cache.has(result.role.id)) {
                    result.member.roles.remove(result.role).catch(console.error);
                }
            }
        });

        console.log('Tepki-Rol dinleyicileri aktif.');
    },
};