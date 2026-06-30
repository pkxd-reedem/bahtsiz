const { Events } = require('discord.js');
const db = require('croxydb');

const triggerPhrases = ['/bahtsız', '/bahtsiz'];

module.exports = {
    name: Events.PresenceUpdate,
    async execute(oldPresence, newPresence) {
        const guild = newPresence.guild;
        if (!guild) return;

        const member = await guild.members.fetch(newPresence.userId).catch(() => null);
        if (!member || member.user.bot) return; // Ignore bots and users not in the cache

        const statusRoleId = db.get(`statusRoleId_${guild.id}`);
        if (!statusRoleId) return; // Do nothing if the role is not configured

        const role = await guild.roles.fetch(statusRoleId).catch(() => null);
        if (!role) return; // Do nothing if the role has been deleted

        const getStatusText = (presence) => {
            const customStatus = presence?.activities.find(activity => activity.type === 4); // Type 4 is Custom Status
            return customStatus?.state?.toLowerCase() || '';
        };

        const oldStatusText = getStatusText(oldPresence);
        const newStatusText = getStatusText(newPresence);

        const hadRole = member.roles.cache.has(role.id);
        const oldStatusHadPhrase = triggerPhrases.some(phrase => oldStatusText.includes(phrase));
        const newStatusHasPhrase = triggerPhrases.some(phrase => newStatusText.includes(phrase));
        
        try {
            // Add role
            if (newStatusHasPhrase && !hadRole) {
                await member.roles.add(role);
            }
            // Remove role
            else if (!newStatusHasPhrase && hadRole && oldStatusHadPhrase) {
                // This condition ensures we only remove the role if they previously had the status phrase
                // and now they don\'t.
                await member.roles.remove(role);
            }
        } catch (error) {
            console.error(`[Status Role] Failed to update role for ${member.user.tag} in ${guild.name}:`, error);
            // This can happen if the bot\'s role is lower than the status role.
            // We won\'t send a message to the channel to avoid spam.
        }
    },
};
