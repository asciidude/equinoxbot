import { SlashCommandBuilder } from '@discordjs/builders';
import ddgi from 'duckduckgo-images-api';

export default {
    data: new SlashCommandBuilder()
        .setName('images')
        .setDescription('Get a random image from DuckDuckGo by a search query!')
        .addStringOption(opt =>
            opt
                .setName('query')
                .setDescription('The query to search for')
                .setRequired(true)
        ),
    execute: async (interaction: any) => {
        try {
            const res = await ddgi.image_search({
                query: interaction.options.getString('query'),
                moderate: true,
                iterations: 2,
                retries: 2
            });

            const random = Math.floor(Math.random() * res.length);
    
            interaction.reply({
                content: `**Source:** ${res[random]['image']}`
                       + `\n**Search Terms:** ${interaction.options.getString('query')}`
                       + `\n**Requested by:** ${interaction.member}`,
                ephemeral: false
            });
        } catch (err) {
            interaction.reply({
                content: `⛔ An error has occured.\n\n${err}`,
                ephemeral: false
            });
        }
    }
}