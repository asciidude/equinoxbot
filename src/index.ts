// Setup
import 'dotenv/config';

import fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import Discord, {
    Collection,
    TextChannel,
    ActivityType,
    GatewayIntentBits,
    Guild,
    MessageType,
    ChannelType,
    Channel
} from 'discord.js';
import replaceOptions from './utils/replaceOptions';
import cleverbot from 'cleverbot-free';
import path from 'path';

declare module 'discord.js' {
    export interface Client {
        commands: Collection<unknown, any>
        textCommands: Collection<unknown, any>
        textAliases: Collection<unknown, any>
    }
}

export const client = new Discord.Client({
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

// Mongoose
import mongoose from 'mongoose';
mongoose.connect(
    process.env.MONGO_URI!,
    () => console.log('Connected to MongoDB')
);

import Server from './models/Server.model';

import hasPermission from './utils/hasPermission';
import createServerModel from './utils/createServerModel';

// Initialize command handler
const recursive = function(dir: string, arr: any) {
    const files = fs.readdirSync(dir);
  
    for(const file of files) {
        if (fs.statSync(dir + "/" + file).isDirectory()) {
            arr = recursive(dir + "/" + file, arr);
        } else {
            arr.push(path.join(dir, "/", file));
        }
    }
  
    return arr;
}

// Slash Commands
const commandFiles: String[] = recursive(`${__dirname}/commands`, []).filter((f: any) => f.endsWith('.ts'));
const commands: Object[] = [];
client.commands = new Collection();

for (const file of commandFiles) {
    let command = require(file as string);
    if(command.default) command = command.default;

    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

// Text Commands
const textCommandFiles: String[] = recursive(`${__dirname}/textCommands`, []).filter((f: any) => f.endsWith('.ts'));
const textCommands: Object[] = [];
client.textCommands = new Collection();
client.textAliases = new Collection();

for (const file of textCommandFiles) {
    let command = require(file as string);
    if(command.default) command = command.default;

    if(command.aliases) {
        for(const alias of command.aliases) {
            client.textAliases.set(alias, command);
        }
    }

    textCommands.push(command);
    client.textCommands.set(command.name, command);
}

let intro: string;
client.once('ready', async () => {
    intro! = await fs.readFileSync(__dirname + '/intro.txt', 'utf8');
    console.log(`${client.user!.username} is now ready!`);

    client.user!.setPresence({
        activities: [{ name: 'slash commands and /help for text-commands', type: ActivityType.Watching }],
        status: 'online'
    });

    // Register commands
    const rest = new REST({
        version: '9'
    }).setToken(process.env.TOKEN!);

    (async() => {
        try {
            if(process.env.NODE_ENV === 'development') {
                await rest.put(Routes.applicationGuildCommands(client.user!.id, process.env.GUILD_ID!), {
                    body: commands
                });
    
                console.log(`Registered slash commands successfully (type: guildCommands, ${process.env.GUILD_ID})`);
            } else {
                await rest.put(Routes.applicationCommands(client.user!.id), {
                    body: commands
                });

                console.log('Registered slash commands successfully (type: globalCommands)');
            }
        } catch(err) {
            if(err) console.log(err);
            else console.log('Failed to register slash commands, no error provided');
        }
    })();
});

client.on('guildCreate', async (guild: any) => {
    //const channel = guild.channels.cache.find((c: Channel) => c.type === ChannelType.GuildText && c.permissionsFor(guild.me).has(PermissionFlagsBits.SendMessages))
    const channel = guild.channels.cache.filter((c: Channel) => c.type === ChannelType.GuildText).find((x: any) => x.position === 0);

    if(channel && intro) {
        try {
            channel.send(await replaceOptions(intro, client, guild));
        } catch (err) {
            console.log(
                `Unable to send introduction message`
                + '\n↳' + err
            );
        }
    }
});

try {
    client.on('interactionCreate', async (interaction: any) => {
        const guild = await Server.findOne({ guild_id: interaction.guild.id });
    
        if(!guild) {
            await createServerModel(interaction.guild.id);
            while(!guild) return;
        }

        if(interaction.isCommand() == false) return;
    
        if(!(await hasPermission(interaction.commandName, interaction.member, interaction.guild.id))) {
            return interaction.reply({
                content: '⛔ You do not have permission to use this command!',
                ephemeral: true
            });
        }
    
        const command = client.commands.get(interaction.commandName);
        if(!command) return interaction.reply({
            content: 'Command not found, contact the host to let them know they\'re running two instances of me!',
            ephemeral: true
        });
    
        try {
            await command.execute(interaction);
        } catch(err) {
            if(err) console.log(err);
            else console.log(`Failed to execute slash command (${interaction.commandName}), no error provided`);
    
            interaction.channel!.send(`Error in command \`${interaction.commandName}\`! <@${process.env.DEVELOPER_ID}>, please have a look at my code!`);
        }
    });
} catch(err) {
    console.log(err);
}

let context: any[] = []; // Instance-dependent contexts :D

// Clear context every 5 hours
setInterval(async () => {
    context = [];
}, 5 * 3600 * 1000);

try {
    client.on('messageCreate', async (message: any) => {
        if(message.author.bot && message.channel.type != ChannelType.DM) return;
        const guild = await Server.findOne({ guild_id: message.guild.id });
    
        if(!guild) {
            await createServerModel(message.guild.id);
            while(!guild) return;
        }
    
        // Triggers
        const trigger = guild!.triggers.filter((e: any) => e.trigger === message.content)[0];
        
        if(trigger) {
            try {
                message.reply(await replaceOptions(trigger.response, message.member, message.guild));
                return;
            } catch(err) {
                console.log(
                    `Unable to send message`
                    + '\n↳' + err
                );
            }
    
            if(trigger.delete) {
                if(!message.deletable) {
                    message.channel.send('⚠ Cannot delete trigger-message due to not enough permissions');
                    return;
                }
    
                try {
                    await message.delete();
                } catch (err) {
                    message.channel.send('⚠ Cannot delete trigger-message due to 2FA being enabled');
                }
            }
        }
    
        // Cleverbot
        if(guild!.cleverbot.enabled && message.channel.id == guild!.cleverbot.channel) {
            const getUser = () => context.filter((e: any) => e.id == message.author.id)[0];
    
            let user = getUser();
            if(!user) {
                context.push({
                    id: message.author.id,
                    context_list: []
                });
    
                user = getUser();
            }
            
            try {
                if(process.env.NODE_ENV !== 'development') {
                    if(message.type == MessageType.Reply) {
                        const replyParent = await message.channel.messages.cache.get(message.reference!.messageId!)!;
            
                        if(replyParent.author.id === client.user!.id) {
                            user['context_list'].push(message.content);
                            const cleverResponse = await cleverbot(message.content, user['context_list']);
                            user['context_list'].push(cleverResponse);
                
                            message.reply(cleverResponse);
                        }
                    } else if(message.content.startsWith(`<@${client.user!.id}>`)) {
                        user['context_list'] = []; // Reset the context list
    
                        user['context_list'].push(message.content.slice(2 + message.author.id.length + 3)); // Remove the beginning "<@id> "
                        const cleverResponse = await cleverbot(message.content, user['context_list']);
                        user['context_list'].push(cleverResponse);
    
                        message.reply(cleverResponse);
                    }
                }
            } catch (err) {
                message.reply('😓 Sorry, I couldn\'t figure out what to say. Try again!')
            }
        }
    
        const args_cmd = message.content.trim().split(/ +/g);
        
        const cmd = args_cmd[0].slice(guild!.prefix.length).toLowerCase();
        const args = args_cmd.slice(guild!.prefix.length);
    
        if(!message.content.startsWith(guild!.prefix)) return;
        
        if(cmd === 'test' && message.author.id === process.env.DEVELOPER_ID) {
            client.emit('guildMemberAdd', message.member);
        }

        if(cmd === 'restart' && message.author.id === process.env.DEVELOPER_ID) {
            await client.user!.setPresence({
                activities: [{ name: 'Restarting bot, please wait...', type: ActivityType.Playing }],
                status: 'online'
            });
    
            await message.reply('> 👋 Restarting bot...');
            fs.utimesSync(__filename, new Date(), new Date());
    
            return;
        }
    
        if(!(await hasPermission(cmd, message.member!, message.guild.id))) {
            return message.reply('⛔ You do not have permission to use this command!');
        }
    
        const textCommand = client.textCommands.get(cmd) || client.textAliases.get(cmd);
        if(!textCommand) return;
    
        try {
            await textCommand.execute(message, args, client);
        } catch(err) {
            if(err) console.log(err);
            else console.log(`Failed to execute text command (${cmd}), no error provided`);
    
            message.channel!.send(`Error in text command \`${cmd}\`! <@${process.env.DEVELOPER_ID}>, please have a look at my code!`);
        }
    });
} catch (err) {
    console.log(
        `Error in text commands, please look at my code.`
        + '\n↳' + err
    );
}

client.on('guildMemberAdd', async (member) => {
    try {
        if(member.user.bot) return;
        const curr_guild = client.guilds.cache.get(process.env.GUILD_ID!) as Guild;
        const guild = await Server.findOne({ guild_id: curr_guild.id });

        if(guild!.autoRole.enabled) {
            try {
                const role = curr_guild.roles.cache.get(guild!.autoRole.role);
                if(!role) return;

                if(member.manageable || role.editable) {
                    member.roles.add(role, 'Auto-role');
                }
            } catch (err) {
                console.log(
                    'Error in guildMemberAdd:addRole'
                    + '\n↳' + err
                );
            }
        }

        if(guild!.welcome.enabled) {
            if(guild!.welcome.channel == 'dm') {
                try {
                    member.send(await replaceOptions(guild!.welcome.message, member, curr_guild));
                } catch (err) {
                    console.log(
                        `Unable to DM ${member.user.username}`
                        + '\n↳' + err
                    );
                }
            } else {
                try {
                    const channel = curr_guild!.channels.cache.get(guild!.welcome.channel) as TextChannel;
                    channel.send(await replaceOptions(guild!.welcome.message, member, curr_guild));
                } catch (err) {
                    console.log(
                        `Unable to send welcome message`
                        + '\n↳' + err
                    );
                }
            }
        }
    } catch (err) {
        console.log(
            'Error in guildMemberAdd'
            + '\n↳' + err
        );
    }
});

client.on('guildMemberRemove', async (member) => {
    if(member.user.bot) return;
    const curr_guild = client.guilds.cache.get(process.env.GUILD_ID!) as Guild;
    const guild = await Server.findOne({ guild_id: curr_guild.id });

    if(guild!.goodbye.enabled) {
        if(guild!.goodbye.channel == 'dm') {
            try {
                member.send(await replaceOptions(guild!.goodbye.message, member, curr_guild));
            } catch (err) {
                console.log(
                    `Unable to DM ${member.user.username}`
                    + '\n↳' + err
                );
            }
        } else {
            try {
                const channel = curr_guild!.channels.cache.get(guild!.goodbye.channel) as TextChannel;
                channel.send(await replaceOptions(guild!.goodbye.message, member, curr_guild));
            } catch (err) {
                console.log(
                    `Unable to send goodbye message`
                    + '\n↳' + err
                );
            }
        }
    }
});

// Restart every 24 hours
setInterval(async () => {
    await client.user!.setPresence({
        activities: [{ name: 'Restarting bot, please wait...', type: ActivityType.Playing }],
        status: 'online'
    });

    fs.utimesSync(__filename, new Date(), new Date());
}, 24 * 3600 * 1000);

client.login(process.env.TOKEN);