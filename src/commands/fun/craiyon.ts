import { SlashCommandBuilder } from '@discordjs/builders';
const generate = require('text-to-img-craiyon-scrapper');

export default {
    data: new SlashCommandBuilder()
        .setName('craiyon')
        .setDescription('Use the Craiyon AI to generate an image')
        .addStringOption(opt =>
            opt
                .setName('prompt')
                .setDescription('The prompt to give the AI')
                .setRequired(true)
        ),
    execute: async (interaction: any) => {
        interaction.reply({
            content: 'Generating the image, please wait...',
            ephemeral: false
        });

        const res = await generate(interaction.options.getString('prompt'));
        const image = Buffer.from(res, 'base64');

        interaction.followUp({
            content: `${interaction.member}, I've generated your image! Here you go:`,
            files: [{
                attachment: image,
                name: 'craiyon.png'
            }],
            ephemeral: false
        });
    }
}