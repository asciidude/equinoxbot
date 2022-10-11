import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import fs from 'fs';

export default {
    data: new SlashCommandBuilder()
        .setName('imgur')
        .setDescription('Get a random image from Imgur!'),
    execute: async (interaction: any) => {
        const res = await axios.get(
            'https://api.imgur.com/3/gallery/hot/viral/top/1' +
            `?mature=false` +
            `&showViral=true`,
            {
                headers: {
                    Authorization: `Client-ID ${process.env.IMGUR_ID}`
                }
            }
        );

        const random = Math.floor(Math.random() * res.data.data.length);

        interaction.reply({
            content: res.data.data[random].link,
            ephemeral: false
        });
    }
}