import {
	EmbedBuilder,
	ActionRowBuilder,
	SlashCommandBuilder,
	ComponentType,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import Server from "../../models/Server.model";
import { encode } from 'js-base64'

export default {
    data: new SlashCommandBuilder()
        .setName('triggers')
        .setDescription('The trigger options for this server')
        .addSubcommand(sub => 
            sub
                .setName('search')
                .setDescription('Get a menu to view the list of triggers on this server')
                .addStringOption(opt =>
                    opt
                        .setName('query')
                        .setDescription('Search for a specific trigger using search terms based off of the trigger-message')
                )
        )

        .addSubcommand(sub => 
            sub
                .setName('add')
                .setDescription('A list of trigger-words to reply to')
                .addStringOption(opt =>
                    opt
                        .setName('trigger')
                        .setDescription('The trigger message')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt
                        .setName('response')
                        .setDescription('The reponse to the message')
                        .setRequired(true)
                )
                .addBooleanOption(opt =>
                    opt
                        .setName('delete')
                        .setDescription('Enable/disable deletion of the message')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub => 
            sub
                .setName('remove')
                .setDescription('Remove a trigger by ID')
                .addStringOption(opt =>
                    opt
                        .setName('id')
                        .setDescription('The trigger message ID to remove')
                        .setRequired(true)
                )
        ),
    execute: async (interaction: any) => {
        const guild = await Server.findOne({ guild_id: interaction.guild.id });

        if(interaction.options.getSubcommand() === 'add') {
            // Add triggers
            const triggers = guild!.triggers.filter((e: any) => e.trigger === interaction.options.getString('trigger'));
            
            if(triggers.length > 0) {
                interaction.reply({
                    content: `⚠ The trigger \`${interaction.options.getString('trigger')}\` already exists. Please try a new one, or re-add the old one with the new content`,
                    ephemeral: true
                });

                return;
            }

            await Server.updateOne(
                { guild_id: interaction.guild.id },
                {
                    $push: {
                        triggers: {
                            trigger: interaction.options.getString('trigger'),
                            response: interaction.options.getString('response'),
                            delete: interaction.options.getBoolean('delete'),
                            id: encode(String(Date.now()))
                        }
                    }
                }
            );

            interaction.reply({
                content: `Added trigger \`${interaction.options.getString('trigger')}\``,
                ephemeral: true
            });
        } else if(interaction.options.getSubcommand() === 'remove') {
            // Remove triggers
            if(guild!.triggers.length <= 0) {
                interaction.reply({
                    content: '⚠ Triggers have not been setup on this server',
                    ephemeral: true
                });
        
                return;
            }

            if(!guild!.triggers.some((e: any) => e['id'] === interaction.options.getString('id'))) {
                interaction.reply({
                    content: '⚠ No triggers found',
                    ephemeral: true
                });
    
                return;
            }

            await Server.updateOne(
                { guild_id: interaction.guild.id },
                {
                    $pull: {
                        triggers: {
                            id: interaction.options.getString('id')
                        }
                    }
                }
            );
    
            interaction.reply({
                content: `Removed trigger \`${interaction.options.getString('id')}\``,
                ephemeral: true
            });
        } else if(interaction.options.getSubcommand() === 'search') {
            // Search for triggers
            if(guild!.triggers.length <= 0) {
                interaction.reply({
                    content: '⚠ Triggers have not been setup on this server',
                    ephemeral: true
                });
        
                return;
            }

            if(interaction.options.getString('query')) {
                // Search by query
                const trigger = guild!.triggers.filter((t: any) => t.trigger.includes(interaction.options.getString('query')))[0];

                if(!trigger) {
                    interaction.reply({
                        content: '⚠ No triggers found with your search query',
                        ephemeral: true
                    });
            
                    return;
                }

                interaction.reply({
                    content: 
                      `**Trigger:** ${trigger.trigger}`
                    + `\n**Response:** ${trigger.response}`
                    + `\n**Delete original message? ${trigger.delete ? '✅' : '⛔'}**`
                    + `\n**Trigger ID:** ${trigger.id}`,
                    ephemeral: false
                })
            } else {
                // Search by menu
                let currentIndex: number = -1;
    
                const embed = new EmbedBuilder()
                    .setColor('Blurple')
                    .setTitle('Triggers')
                    .setDescription('Find the triggers by using the button below!')
                    .setFooter({
                        text: interaction.member!.displayName,
                        iconURL: interaction.member!.displayAvatarURL()
                    })
                    .setTimestamp()
    
                const row = new ActionRowBuilder<ButtonBuilder>()
                    .setComponents(
                        new ButtonBuilder()
                            .setCustomId('trigger_far_left')
                            .setEmoji('⏮')
                            .setStyle(ButtonStyle.Primary),
                        
                        new ButtonBuilder()
                            .setCustomId('trigger_left')
                            .setEmoji('◀')
                            .setStyle(ButtonStyle.Primary),
    
                        
                        new ButtonBuilder()
                            .setCustomId('trigger_right')
                            .setEmoji('▶')
                            .setStyle(ButtonStyle.Primary),
    
                        new ButtonBuilder()
                            .setCustomId('trigger_far_right')
                            .setEmoji('⏭')
                            .setStyle(ButtonStyle.Primary)
                    );
                
                const msg = await interaction.reply({
                    embeds: [embed],
                    components: [row]
                });
    
                const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 5 * 60 * 1000 });
    
                collector.on('collect', async (collectedInteraction: any) => {
                    if(collectedInteraction.member!.user.id !== interaction.member.user.id) return;
                    let trigger: any;
    
                    embed.setFields();
    
                    switch(collectedInteraction.customId) {
                        case 'trigger_far_left':
                            currentIndex = 0;
                            trigger = guild!.triggers[0];
                            setTriggerDescription(embed, trigger);
    
                            break;
    
                        case 'trigger_left':
                            if(!guild!.triggers[currentIndex - 1]) {
                                trigger = guild!.triggers[currentIndex];
                                setTriggerDescription(embed, trigger);
                                
                                break;
                            }
    
                            currentIndex--;
                            trigger = guild!.triggers[currentIndex];
    
                            setTriggerDescription(embed, trigger);
                            
                            break;
    
                        case 'trigger_right':
                            if(!guild!.triggers[currentIndex + 1]) {
                                trigger = guild!.triggers[currentIndex];
                                setTriggerDescription(embed, trigger);
                                
                                break;
                            }
    
                            currentIndex++;
                            trigger = guild!.triggers[currentIndex];
                            setTriggerDescription(embed, trigger);
                            
                            break;
    
                        case 'trigger_far_right':
                            currentIndex = guild!.triggers.length - 1;
                            trigger = guild!.triggers[currentIndex];
                
                            embed.setDescription(
                                `**Trigger:** ${trigger.trigger}`
                            + `\n**Response:** ${trigger.response}`
                            + `\n**Delete original message? ${trigger.delete ? '✅' : '⛔'}**`
                            + `\n**Trigger ID:** ${trigger.id}`
                            );
    
                            break;
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
    }
}

const setTriggerDescription = (embed: any, trigger: any) => {
    embed.setDescription(
        `**Trigger:** ${trigger.trigger}`
      + `\n**Response:** ${trigger.response}`
      + `\n**Delete original message? ${trigger.delete ? '✅' : '⛔'}**`
      + `\n**Trigger ID:** ${trigger.id}`
    );
}