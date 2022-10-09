import {
	EmbedBuilder,
	ActionRowBuilder,
	SlashCommandBuilder,
	ComponentType,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { config } from "../..";

export default {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Get the prefix for this server'),
    execute: async (interaction: any) => {
        interaction.reply({
            content: `This server's prefix for text-commands is \`${config['prefix']}\``,
            ephemeral: false
        });
    }
}