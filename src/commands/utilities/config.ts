import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import replaceOptions from '../../utils/replaceOptions';
import findPermission from '../../utils/findPermission';
import commandExists from '../../utils/commandExists';
import { config } from '../..';
import fs from 'fs';

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Access the server config')

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

        // Goodbye message
        .addSubcommand(sub => 
            sub
                .setName('goodbye')
                .setDescription('Set the server\'s goodbye message')
                .addStringOption(opt =>
                    opt
                        .setName('message')
                        .setDescription('The goodbye message, set to "disable" to disable the goodbye message')
                        .setRequired(true)
                )
                .addChannelOption(opt =>
                    opt
                        .setName('channel')
                        .setDescription('The channel to send the goodbye message to')
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

        // Cleverbot
        .addSubcommand(sub => 
            sub
                .setName('cleverbot_channel')
                .setDescription('Set the channel for Cleverbot usage')
                .addChannelOption(opt =>
                    opt
                        .setName('channel')
                        .setDescription('The channel to use')
                        .setRequired(true)
                )
        )

        // Permissions
        .addSubcommand(sub => 
            sub
                .setName('rm_permissions_req')
                .setDescription('Remove permission requirement from a command')
                .addStringOption(opt =>
                    opt
                        .setName('command')
                        .setDescription('The command to change (do not include the /)')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub => 
            sub
                .setName('set_admin_override')
                .setDescription('Set the admin override for a command')
                .addStringOption(opt =>
                    opt
                        .setName('command')
                        .setDescription('The command to change (do not include the /)')
                        .setRequired(true)
                )
                .addBooleanOption(opt =>
                    opt
                        .setName('enabled')
                        .setDescription('Enable/disable the admin override')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub => 
            sub
                .setName('set_permission_role')
                .setDescription('Add/remove a role permission for a command')
                .addStringOption(opt =>
                    opt
                        .setName('command')
                        .setDescription('The command to change (do not include the /)')
                        .setRequired(true)
                )
                .addRoleOption(opt =>
                    opt
                        .setName('role')
                        .setDescription('The role to add or remove to the permissions for the command')
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
                            { name: '😢 Goodbye Configuration', value: 'goodbye' },
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
        let permission;

        if(interaction.options.getString('command')) {
            permission = await findPermission(interaction.options.getString('command'));
        }

        switch(interaction.options.getSubcommand()) {
            /////////////////
            // Permissions //
            /////////////////
            case 'rm_permissions_req':
                if(!permission) {
                    interaction.reply({
                        content: `⛔ Unable to find permissions for \`${interaction.options.getString('command')}\``,
                        ephemeral: true
                    });

                    break;
                }

                for (let i = 0; i < config['permissions'].length; i++) {
                    if (config['permissions'][i].commandName == interaction.options.getString('command')) {
                        config['permissions'].splice(i, 1);
                    }
                }

                fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                interaction.reply({
                    content: `Removed permissions requirement from \`${interaction.options.getString('command')}\``,
                    ephemeral: true
                });

                break;
                
            case 'set_admin_override':
                if(!permission) {
                    if(await commandExists(interaction.options.getString('command'))) {
                        config['permissions'].push({
                            commandName: interaction.options.getString('command'),
                            roles: [],
                            administratorOverride: interaction.options.getBoolean('enabled')
                        });

                        fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                        interaction.reply({
                            content: `Set administrator override for \`${interaction.options.getString('command')}\` to \`${interaction.options.getBoolean('enabled')}\``,
                            ephemeral: true
                        });

                        break;
                    } else {
                        interaction.reply({
                            content: `⛔ Unable to find command \`${interaction.options.getString('command')}\``,
                            ephemeral: true
                        });
        
                        break;
                    }
                }

                permission['administratorOverride'] = interaction.options.getBoolean('enabled');
                fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                interaction.reply({
                    content: `Set administrator override for \`${interaction.options.getString('command')}\` to \`${permission['administratorOverride']}\``,
                    ephemeral: true
                });

                break;
                
            case 'set_permission_role':
                if(!permission) {
                    if(await commandExists(interaction.options.getString('command'))) {
                        config['permissions'].push({
                            commandName: interaction.options.getString('command'),
                            roles: [interaction.options.getRole('role').id],
                            administratorOverride: true
                        });

                        fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                        interaction.reply({
                            content: `Added permissions for ${interaction.options.getRole('role')} to \`${interaction.options.getString('command')}\``,
                            ephemeral: true
                        });

                        break;
                    } else {
                        interaction.reply({
                            content: `⛔ Unable to find command \`${interaction.options.getString('command')}\``,
                            ephemeral: true
                        });
        
                        break;
                    }
                }
                    
                let addedRolePerm = false;

                if(!permission['roles'].includes(interaction.options.getRole('role').id)) {
                    permission['roles'].push(interaction.options.getRole('role').id);
                    addedRolePerm = true;
                } else {
                    for (let i = 0; i < permission['roles'].length; i++) {
                        if(permission['roles'][i] == interaction.options.getRole('role').id) {
                            permission['roles'].splice(i, 1);
                        }
                    }

                    addedRolePerm = false;
                }

                fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                interaction.reply({
                    content: `${addedRolePerm ? 'Added' : 'Removed'}` + 
                             ` permissions for ${interaction.options.getRole('role')}`
                             + ` ${addedRolePerm ? 'to' : 'from'}` +
                             ` \`${interaction.options.getString('command')}\``,
                    ephemeral: true
                });

                break;

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
            
            /////////////
            // Goodbye //
            /////////////
            case 'goodbye':
                if(interaction.options.getString('message').toLowerCase() == 'disable') {
                    config['goodbye']['enabled'] = false;
                    fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                    interaction.reply({
                        content: '✅ Disabled the server\'s goodbye message!',
                        ephemeral: true
                    });

                    break;
                }

                if(interaction.options.getChannel('channel')) {
                    config['goodbye']['enabled'] = true;
                    config['goodbye']['channel'] = interaction.options.getChannel('channel').id;
                    config['goodbye']['message'] = interaction.options.getString('message');

                    fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                    interaction.reply({
                        content: `Set the goodbye message and set it to use <#${interaction.options.getChannel('channel').id}>, check the message with \`/config test\``,
                        ephemeral: true
                    });
                } else if(interaction.options.getBoolean('dm')) {
                    config['goodbye']['enabled'] = true;
                    config['goodbye']['channel'] = 'dm';
                    config['goodbye']['message'] = interaction.options.getString('message');

                    fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));

                    interaction.reply({
                        content: `Set the goodbye message and set it to use DMs, check the message with \`/config test\``,
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

            ///////////////
            // Cleverbot //
            ///////////////
            case 'cleverbot_channel':
                config['cleverbot']['channel'] = interaction.options.getChannel('channel').id;
                fs.writeFileSync(process.env.CONFIG_PATH!, JSON.stringify(config, null, 4));
    
                interaction.reply({
                    content: `✅ Set the Cleverbot channel to ${interaction.options.getChannel('channel')}`,
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
                    content: `Added trigger \`${interaction.options.getString('trigger')}\`, check with \`/config test\``,
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

                    case 'goodbye':
                        interaction.reply({
                            content: `**Goodbye**` +
                                     `\nEnabled: ${config['goodbye']['enabled'] === true ? '✅' : '⛔'}` +
                                     `\nChannel: ${(config['goodbye']['channel'] == 'dm' ? 'dm' : '<#' + config['goodbye']['channel'] + '>') || 'none'}` +
                                     `\nMessage: ${await replaceOptions(config['goodbye']['message'], interaction.member, interaction.guild) || 'none'}`,
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