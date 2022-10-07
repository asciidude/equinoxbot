import { SlashCommandBuilder } from '@discordjs/builders';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import replaceOptions from '../../utils/replaceOptions';
import { config } from '../..';
import fs from 'fs';

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('[Utilities] Access the server config (`Administrator` permission required)')

        // Welcome message
        .addSubcommand(sub => 
            sub
                .setName('welcome')
                .setDescription('Set the server\'s welcome message')
                .addStringOption(opt =>
                    opt
                        .setName('message')
                        .setDescription('The welcome message, set to "disable" to disable the welcome message')
                        .setRequired(true)
                )
                .addChannelOption(opt =>
                    opt
                        .setName('channel')
                        .setDescription('The channel to send the welcome message to')
                        .setRequired(false)
                )
                .addBooleanOption(opt =>
                    opt
                        .setName('dm')
                        .setDescription('Set whether you want to DM the message instead')
                        .setRequired(false)
                )
        )

        // Auto-role
        .addSubcommand(sub => 
            sub
                .setName('autorole')
                .setDescription('Set the server\'s auto role (role provided on join)')
                .addBooleanOption(opt =>
                    opt
                        .setName('enabled')
                        .setDescription('Enable/disable auto-role')
                        .setRequired(true)
                )
                .addRoleOption(opt =>
                    opt
                        .setName('role')
                        .setDescription('The role to give a person on joining')
                        .setRequired(false)
                )
        )

        // Triggers
        .addSubcommand(sub => 
            sub
                .setName('add_trigger')
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
                .setName('remove_trigger')
                .setDescription('Remove a trigger by ID')
                .addIntegerOption(opt =>
                    opt
                        .setName('id')
                        .setDescription('The trigger message ID to remove')
                        .setRequired(true)
                )
        )

        // Prefix
        .addSubcommand(sub => 
            sub
                .setName('prefix')
                .setDescription('Set the bot prefix for text-commands')
                .addStringOption(opt =>
                    opt
                        .setName('prefix')
                        .setDescription('The prefix to use')
                        .setRequired(true)
                )
        )

        // Test config
        .addSubcommand(sub => 
            sub
                .setName('test')
                .setDescription('Test a config option')
                .addStringOption(opt =>
                    opt
                        .setName('option')
                        .setDescription('The option to use')
                        .setRequired(true)

                        .addChoices(
                            { name: '🙋 Welcome Configuration', value: 'welcome' },
                            { name: '🦺 Auto-role Configuration', value: 'autorole' },
                            { name: '👂 View Prefix', value: 'prefix' },
                            { name: '💬 View Triggers', value: 'triggers' },
                        )
                )
        )

        // Option getter
        .addSubcommand(sub =>
            sub
                .setName('get_options')
                .setDescription('Get the available options for messages (like {USER.MENTION})')
        ),
    execute: async (interaction: any) => {
        if(interaction.member.id !== '801469073535139860' && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({
            content: 'You need the `Administrator` permission to run this command',
            ephemeral: true
        });

        switch(interaction.options.getSubcommand()) {
            /////////////
            // Welcome //
            /////////////
            case 'welcome':
                if(interaction.options.getString('message').toLowerCase() == 'disable') {
                    config['welcome']['enabled'] = false;
                    fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                    interaction.reply({
                        content: '✅ Disabled the server\'s welcome message!',
                        ephemeral: true
                    });

                    break;
                }

                if(interaction.options.getChannel('channel')) {
                    config['welcome']['enabled'] = true;
                    config['welcome']['channel'] = interaction.options.getChannel('channel').id;
                    config['welcome']['message'] = interaction.options.getString('message');

                    fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                    interaction.reply({
                        content: `Set the welcome message and set it to use <#${interaction.options.getChannel('channel').id}>, check the message with \`/config test\``,
                        ephemeral: true
                    });
                } else if(interaction.options.getBoolean('dm')) {
                    config['welcome']['enabled'] = true;
                    config['welcome']['channel'] = 'dm';
                    config['welcome']['message'] = interaction.options.getString('message');

                    fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                    interaction.reply({
                        content: `Set the welcome message and set it to use DMs, check the message with \`/config test\``,
                        ephemeral: true
                    });
                } else {
                    interaction.reply({
                        content: 'Oops! Have a look in the optional parameters to set to DM the user or use a channel.',
                        ephemeral: true
                    });
                }

                break;
            
            ///////////////
            // Auto-Role //
            ///////////////
            case 'autorole':
                if(!interaction.options.getBoolean('enabled')) {
                    config['autoRole']['enabled'] = false;
                    fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                    interaction.reply({
                        content: '✅ Disabled the server\'s auto-role!',
                        ephemeral: true
                    });

                    break;
                }

                if(!interaction.options.getRole('role')) {
                    interaction.reply({
                        content: 'Oops! Check the optional parameters to set the role',
                        ephemeral: true
                    })
                } else {
                    config['autoRole']['role'] = interaction.options.getRole('role').id;
                    fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                    interaction.reply({
                        content: `✅ Set the server's auto-role to ${interaction.options.getRole('role')}`,
                        ephemeral: true
                    })
                }

                break;

            ////////////
            // Prefix //
            ////////////
            case 'prefix':
                config['prefix'] = interaction.options.getString('prefix');
                fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                interaction.reply({
                    content: `✅ Set the server's prefix to \`${interaction.options.getString('prefix')}\``,
                    ephemeral: true
                })

                break;

            //////////////
            // Triggers //
            //////////////
            case 'add_trigger':
                config['triggers'].push({
                    "trigger": interaction.options.getString('trigger'),
                    "response": interaction.options.getString('response'),
                    "delete": interaction.options.getBoolean('delete'),
                    "id": Date.now()
                });

                fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));
    
                interaction.reply({
                    content: `Added trigger \`${interaction.options.getString('trigger')}\`, check with \`/config triggers\``,
                    ephemeral: true
                });
    
                break;
            
            case 'remove_trigger':
                for (let i = 0; i < config['triggers'].length; i++) {
                    if (config['triggers'][i].id == interaction.options.getInteger('id')) {
                        config['triggers'].splice(i, 1);
                    }
                }
    
                fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));
        
                interaction.reply({
                    content: `Removed trigger \`${interaction.options.getInteger('id')}\``,
                    ephemeral: true
                });
    
                break;

            //////////
            // Test //
            //////////
            case 'test':
                switch(interaction.options.getString('option').toLowerCase()) {
                    case 'welcome':
                        interaction.reply({
                            content: `**Welcome**` +
                                     `\nEnabled: ${config['welcome']['enabled'] === true ? '✅' : '⛔'}` +
                                     `\nChannel: ${(config['welcome']['channel'] == 'dm' ? 'dm' : '<#' + config['welcome']['channel'] + '>') || 'none'}` +
                                     `\nMessage: ${await replaceOptions(config['welcome']['message'], interaction.member, interaction.guild) || 'none'}`,
                            ephemeral: true
                        });

                        break;

                    case 'autorole':
                        interaction.reply({
                            content: `**Auto-role**` +
                                     `\nEnabled: ${config['autoRole']['enabled'] === true ? '✅' : '⛔'}` +
                                     `\nRole: ${'<@&' + config['autoRole']['role'] + '>' || 'none'}`,
                            ephemeral: true
                        });
        
                        break;
                    
                    

                    case 'prefix':
                        interaction.reply({
                            content: `This server's prefix is \`${config['prefix']}\``,
                            ephemeral: true
                        });
        
                        break;
                    
                    
                    case 'triggers':
                        if(config['triggers'].length <= 0) {
                            interaction.reply({
                                content: '⚠ No triggers found',
                                ephemeral: true
                            });

                            break;
                        }

                        let triggers_list = '';
                            
                        for (let i = 0; i < config['triggers'].length; i++) {
                            let obj = config['triggers'][i];

                            triggers_list
                            += `**Trigger:** ${obj['trigger']}`
                            + `\n**Response:** ${obj['response']}`
                            + `\n**Delete Message:** ${obj['delete'] === true ? '✅' : '⛔'}`
                            + `\n**Trigger ID:** \`${obj['id']}\``
                            + `\n\n`;
                        }
                    
                        interaction.reply({
                            content: triggers_list,
                            ephemeral: true
                        });
    
                        break;
                }

                break;

            //////////////////
            // End of Tests //
            //////////////////

            case 'get_options':
                const optionsEmbed = new EmbedBuilder()
                    .setTitle('Config Options')
                    .addFields(
                        {
                            name: 'USER',
                            value: '.MENTION | Mention the user' +
                                   '\n.NAME | Get the username of the user' +
                                   '\n.DISCRIMINATOR | Get the user\'s discriminator' +
                                   '\n.ID | Get the user\'s identifier' +
                                   '\n.AVATAR | Get the user\'s avatar URL',
                            inline: true
                        },
                        {
                            name: 'GUILD',
                            value: '.NAME | The guild\'s name',
                            inline: true
                        }
                    )
                    .setColor('Blurple')
                    .setThumbnail(process.env.ICON_URL!)
                    .setFooter({ text: interaction.member.user.username, iconURL: interaction.member.user.avatarURL()! })
                    .setTimestamp();
    
                interaction.reply({
                    embeds: [optionsEmbed],
                    content: `⚠ Options are surrounded in curly braces (like this: {CATEGORY.OPTION}), also keep in mind that the options are case sensitive` +
                             '\nUse \\n to make a new line if you need!',
                    ephemeral: false
                });

                break;

            default:
                interaction.reply({
                    content: 'Please provide a subcommand for config',
                    ephermal: true
                })
    
                break;
        }
    }
}