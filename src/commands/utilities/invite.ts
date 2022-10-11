import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the bot invite link'),
    execute: async (interaction: any) => {
        interaction.reply({
            content: `Add me to your server through this link: ${process.env.INVITE_LINK}`,
            ephemeral: false
        });
    }
}