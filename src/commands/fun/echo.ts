import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Repeat your message'),
    execute: async (interaction: any) => {
        interaction.reply({
            content: '⚠ This command has been migrated to a text-command: `;echo`',
            ephemeral: false
        });
    }
}