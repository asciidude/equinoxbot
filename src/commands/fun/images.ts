import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
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
            const image = res[random]['image'];

            const embed = new EmbedBuilder()
                .setTitle('📸 Snap!')
                .setDescription(`**Source:** ${image}`
                              + `\n**Search Terms:** ${interaction.options.getString('query')}`
                              + `\n**Requested by:** ${interaction.member}`)
                .setColor('Blurple')
                .setFooter({
                    text: interaction.member!.displayName,
                    iconURL: interaction.member!.user.avatarURL()!
                })
                .setImage(image)
                .setTimestamp()
    
            interaction.reply({
                embeds: [embed],
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