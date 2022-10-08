import { SlashCommandBuilder } from '@discordjs/builders';
import { imgur } from '../..';

export default {
    data: new SlashCommandBuilder()
        .setName('imgur')
        .setDescription('Get a random image from Imgur!'),
    execute: async (interaction: any) => {
        const res = await imgur.getGallery({
            section: 'hot',
            sort: 'viral',
            mature: false,
        });

        interaction.reply({
            content: res['data'][0]['link'],
            ephemeral: false
        })
    }
}