import { SlashCommandBuilder } from '@discordjs/builders';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import replaceOptions from '../../utils/replaceOptions';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync(process.env.CONFIG_PATH!, 'utf-8'));

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

        // Test config
        .addSubcommand(sub => 
            sub
                .setName('test')
                .setDescription('Test a config option')
                .addStringOption(opt =>
                    opt
                        .setName('option')
                        .setDescription('Available: welcome, autorole')
                        .setRequired(true)
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

                    default:
                        interaction.reply({
                            content: 'That option doesn\'t exist! Please use one from the list in the command description',
                            ephermal: true
                        })

                        break;
                }

                break;

            case 'get_options':
                const embed = new EmbedBuilder()
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
                    .setFooter({ text: interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
                    .setTimestamp();
    
                interaction.reply({
                    embeds: [embed],
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