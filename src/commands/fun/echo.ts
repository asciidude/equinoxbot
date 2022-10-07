import { SlashCommandBuilder } from '@discordjs/builders';

export default {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('[Fun] Repeat your message (pointless command)'),
    execute: async (interaction: any) => {
        interaction.reply({
            content: '⚠ This command has been migrated to a text-command: `;echo`',
            ephemeral: false
        })
    }
}