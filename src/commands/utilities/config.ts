import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import replaceOptions from '../../utils/replaceOptions';
import findPermission from '../../utils/findPermission';
import commandExists from '../../utils/commandExists';
import Server from '../../models/Server.model';

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
                .setName('cleverbot')
                .setDescription('Cleverbot configuration')
                .addBooleanOption(opt =>
                    opt
                        .setName('enabled')
                        .setDescription('Enable/disable Cleverbot')
                        .setRequired(true)
                )
                .addChannelOption(opt =>
                    opt
                        .setName('channel')
                        .setDescription('The channel to use')
                        .setRequired(false)
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
                            { name: '🦺 Auto-role Configuration', value: 'autorole' }
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
        const guild = await Server.findOne({ guild_id: interaction.guild.id });

        let permission;

        if(interaction.options.getString('command')) {
            permission = await findPermission(interaction.options.getString('command'), interaction.guild.id);
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

                await Server.updateOne(
                    { guild_id: interaction.guild.id },
                    {
                        $pull: {
                            permissions: {
                                commandName: interaction.options.getString('command')
                            }
                        }
                    }
                );

                interaction.reply({
                    content: `Removed permissions requirement from \`${interaction.options.getString('command')}\``,
                    ephemeral: true
                });

                break;
                
            case 'set_admin_override':
                if(!permission) {
                    if(await commandExists(interaction.options.getString('command'))) {
                        await Server.updateOne(
                            { guild_id: interaction.guild.id },
                            {
                                $push: {
                                    permissions: {
                                        commandName: interaction.options.getString('command'),
                                        roles: [],
                                        administratorOverride: interaction.options.getBoolean('enabled')
                                    }
                                }
                            }
                        );

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

                interaction.reply({
                    content: `Set administrator override for \`${interaction.options.getString('command')}\` to \`${permission['administratorOverride']}\``,
                    ephemeral: true
                });

                break;
                
            case 'set_permission_role':
                if(!permission) {
                    if(await commandExists(interaction.options.getString('command'))) {
                        await Server.updateOne(
                            { guild_id: interaction.guild.id },
                            {
                                $push: {
                                    permissions: {
                                        commandName: interaction.options.getString('command'),
                                        roles: [interaction.options.getRole('role').id],
                                        administratorOverride: true
                                    }
                                }
                            }
                        );

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
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                welcome: {
                                    enabled: false
                                }
                            }
                        }
                    );

                    interaction.reply({
                        content: '✅ Disabled the server\'s welcome message!',
                        ephemeral: true
                    });

                    break;
                }

                if(interaction.options.getChannel('channel')) {
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                welcome: {
                                    enabled: true,
                                    channel: interaction.options.getChannel('channel').id,
                                    message: interaction.options.getString('message')
                                }
                            }
                        }
                    );

                    interaction.reply({
                        content: `Set the welcome message and set it to use <#${interaction.options.getChannel('channel').id}>, check the message with \`/config test\``,
                        ephemeral: true
                    });
                } else if(interaction.options.getBoolean('dm')) {
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                welcome: {
                                    enabled: true,
                                    channel: 'dm',
                                    message: interaction.options.getString('message')
                                }
                            }
                        }
                    );

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
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                goodbye: {
                                    enabled: false
                                }
                            }
                        }
                    );

                    interaction.reply({
                        content: '✅ Disabled the server\'s goodbye message!',
                        ephemeral: true
                    });

                    break;
                }

                if(interaction.options.getChannel('channel')) {
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                goodbye: {
                                    enabled: true,
                                    channel: interaction.options.getChannel('channel').id,
                                    message: interaction.options.getString('message')
                                }
                            }
                        }
                    );

                    interaction.reply({
                        content: `Set the goodbye message and set it to use <#${interaction.options.getChannel('channel').id}>, check the message with \`/config test\``,
                        ephemeral: true
                    });
                } else if(interaction.options.getBoolean('dm')) {
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                goodbye: {
                                    enabled: true,
                                    channel: 'dm',
                                    message: interaction.options.getString('message')
                                }
                            }
                        }
                    );

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
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                autoRole: {
                                    enabled: false
                                }
                            }
                        }
                    );

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
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                autoRole: {
                                    enabled: true,
                                    role: interaction.options.getRole('role').id
                                }
                            }
                        }
                    );

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
                await Server.updateOne(
                    { guild_id: interaction.guild.id },
                    {
                        $set: {
                            prefix: interaction.options.getString('prefix')
                        }
                    }
                );

                interaction.reply({
                    content: `✅ Set the server's prefix to \`${interaction.options.getString('prefix')}\``,
                    ephemeral: true
                })

                break;

            ///////////////
            // Cleverbot //
            ///////////////
            case 'cleverbot':
                if(!interaction.options.getBoolean('enabled')) {
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                cleverbot: {
                                    enabled: false
                                }
                            }
                        }
                    );

                    interaction.reply({
                        content: '✅ Disabled the server\'s cleverbot functionality!',
                        ephemeral: true
                    });

                    break;
                }

                if(!interaction.options.getChannel('channel')) {
                    interaction.reply({
                        content: 'Oops! Check the optional parameters to set the Cleverbot channel',
                        ephemeral: true
                    })
                } else {
                    await Server.updateOne(
                        { guild_id: interaction.guild.id },
                        {
                            $set: {
                                cleverbot: {
                                    enabled: true,
                                    channel: interaction.options.getChannel('channel').id
                                }
                            }
                        }
                    );
        
                    interaction.reply({
                        content: `✅ Set the Cleverbot channel to ${interaction.options.getChannel('channel')}`,
                        ephemeral: true
                    })
                }
    
                break;

            //////////
            // Test //
            //////////
            case 'test':
                switch(interaction.options.getString('option').toLowerCase()) {
                    case 'welcome':
                        interaction.reply({
                            content: `**Welcome**` +
                                     `\nEnabled: ${guild!.welcome.enabled === true ? '✅' : '⛔'}` +
                                     `\nChannel: ${(guild!.welcome.channel == 'dm' ? 'dm' : '<#' + guild!.welcome.channel + '>') || 'none'}` +
                                     `\nMessage: ${await replaceOptions(guild!.welcome.message, interaction.member, interaction.guild) || 'none'}`,
                            ephemeral: true
                        });

                        break;

                    case 'goodbye':
                        interaction.reply({
                            content: `**Goodbye**` +
                                     `\nEnabled: ${guild!.goodbye.enabled === true ? '✅' : '⛔'}` +
                                     `\nChannel: ${(guild!.goodbye.channel == 'dm' ? 'dm' : '<#' + guild!.goodbye.channel + '>') || 'none'}` +
                                     `\nMessage: ${await replaceOptions(guild!.goodbye.message, interaction.member, interaction.guild) || 'none'}`,
                            ephemeral: true
                        });
    
                        break;

                    case 'autorole':
                        interaction.reply({
                            content: `**Auto-role**` +
                                     `\nEnabled: ${guild!.autoRole.enabled === true ? '✅' : '⛔'}` +
                                     `\nRole: ${'<@&' + guild!.autoRole.role + '>' || 'none'}`,
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