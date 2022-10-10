import {
	EmbedBuilder,
	ActionRowBuilder,
	SlashCommandBuilder,
	ComponentType,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import Server from "../../models/Server.model";

export default {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Get the prefix for this server'),
    execute: async (interaction: any) => {
        const guild = await Server.findOne({ guild_id: interaction.guild.id });

        interaction.reply({
            content: `This server's prefix for text-commands is \`${guild!.prefix}\``,
            ephemeral: false
        });
    }
}