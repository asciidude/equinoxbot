import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';

export default {
    data: new SlashCommandBuilder()
        .setName('tenor')
        .setDescription('Get a GIF from Tenor!')
        .addStringOption(opt =>
            opt
                .setName('query')
                .setDescription('The query to search')
                .setRequired(true)
        ),
    execute: async (interaction: any) => {
        const res = await axios.get(
            'https://tenor.googleapis.com/v2/search' +
            `?q=${interaction.options.getString('query')}` +
            `&key=${process.env.TENOR_API_KEY}` +
            '&limit=50' +
            '&country=US' +
            `&locale=${process.env.TENOR_LOCALE}` +
            `&contentfilter=${process.env.TENOR_FILTER_STATUS}` +
            '&media_filter=gif,tinygif,mp4,tinymp4'
        );

        const random = Math.floor(Math.random() * res.data.results.length);

        interaction.reply({
            content: res.data.results[random].url,
            ephemeral: false
        });
    }
}