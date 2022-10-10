import {
	EmbedBuilder,
	ActionRowBuilder,
	SelectMenuBuilder,
	SelectMenuOptionBuilder,
	SlashCommandBuilder,
	ComponentType
} from "discord.js";
import Server from "../../models/Server.model";

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get a help menu for text commands only'),
    execute: async (interaction: any) => {
        const guild = await Server.findOne({ guild_id: interaction.guild.id });

        const embed = new EmbedBuilder()
			.setColor('Blurple')
			.setTitle('Help')
			.setDescription('Click the menu below for the help menu, this embed will change accordingly')
			.setFooter({
                text: interaction.member!.displayName,
                iconURL: interaction.member!.displayAvatarURL()
            })
			.setTimestamp();
		
		const row = new ActionRowBuilder<SelectMenuBuilder>()
			.setComponents(
				new SelectMenuBuilder()
					.setCustomId('help')
					.setMaxValues(1)
					.setMinValues(1)
					.setPlaceholder('🤔 Make a selection...')
					.setOptions([
						new SelectMenuOptionBuilder({
							label: '🎉 Fun',
							description: 'Show a list of fun commands',
							value: 'fun'
						}),
						new SelectMenuOptionBuilder({
							label: '🧐 Utilities',
							description: 'Show a list of commands to utilize',
							value: 'utilities',
						}),
					])
			);
		
		const msg = await interaction.reply({
			embeds: [embed],
			components: [row]
		});

		const collector = msg.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 5 * 60 * 1000 });

		collector.on('collect', async (collectedInteraction: any) => {
			if(collectedInteraction.member!.user.id !== interaction.member.user.id) return;

            embed.setFields();
            const categories = interaction.client.textCommands.filter((cmd: any) => cmd.category === collectedInteraction.values[0]);
			
			for(const command of categories) {
				embed.addFields({
                        name: `${command[1].name} | \`${guild!.prefix + command[1].usage}\``,
                        value: `*${command[1].description}*`
                             + `\n**Aliases:** ${command[1].aliases[0] ? command[1].aliases.join(', ') : 'none'}`,
                        inline: true
                });
			}
			
			await collectedInteraction.deferUpdate();
			
			await interaction.editReply({
				embeds: [embed]
			});
		});

		collector.on('end', (collection: any) => {
			try {
				interaction.deleteReply();
			} catch (err) {
				console.log(err);
			}
		});
    }
}