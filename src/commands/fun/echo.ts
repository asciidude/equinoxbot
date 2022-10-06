import { SlashCommandBuilder } from '@discordjs/builders';

export default {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('[Fun] Repeat your message (pointless command)')
        .addStringOption((opt) =>
            opt
                .setName('text')
                .setDescription('The text to repeat')
                .setRequired(true)
        ),
    execute: async (interaction: any) => {
        interaction.reply({
            content: interaction.options.getString('text'),
            ephemeral: false
        })
    }
}