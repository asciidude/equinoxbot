import {
	Client,
	EmbedBuilder,
	Message,
	ActionRowBuilder,
	SelectMenuBuilder,
	SelectMenuOptionBuilder,
	ComponentType
} from "discord.js";
import Server from "../../models/Server.model";

export default {
    name: 'help',
    description: 'Get a help menu',
    category: 'utilities',
    aliases: [],
    usage: 'help',
    async execute(message: Message, args: string[], client: Client) {
        const guild = await Server.findOne({ guild_id: message.guild!.id });

        const embed = new EmbedBuilder()
			.setColor('Blurple')
			.setTitle('Help')
			.setDescription('Click the menu below for the help menu, this embed will change accordingly')
			.setFooter({
                text: message.member!.displayName,
                iconURL: message.member!.displayAvatarURL()
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
		
		const msg = await message.reply({
			embeds: [embed],
			components: [row]
		});

		const collector = msg.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 5 * 60 * 1000 });

		collector.on('collect', async (interaction: any) => {
			if(interaction.member!.user.id !== message.author.id) return;

            embed.setFields();
            const categories = client.textCommands.filter(cmd => cmd.category === interaction.values[0]);
			
			for(const command of categories) {
				embed.addFields({
                        name: `${command[1].name} | \`${guild!.prefix + command[1].usage}\``,
                        value: `*${command[1].description}*`
                             + `\n**Aliases:** ${command[1].aliases[0] ? command[1].aliases.join(', ') : 'none'}`,
                        inline: true
                });
			}

			await interaction.deferUpdate();

			await msg.edit({
				embeds: [embed]
			});
		});

		collector.on('end', collection => {
			try {
				msg.delete();
			} catch (err) {
				console.log(err);
			}
		});
	}
}