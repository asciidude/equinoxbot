import { SlashCommandBuilder } from '@discordjs/builders';
import { Tenor } from '../..';

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
        const q = await Tenor.Search.Query(interaction.options.getString('query'), '1');

        interaction.reply({
            content: q[0].url,
            ephemeral: false
        });
    }
}