// Setup
import 'dotenv/config';

import fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import Discord, { Collection, TextChannel, GuildMember, Interaction, ActivityType, GatewayIntentBits, Guild, EmbedBuilder, MessageType, ChannelType } from 'discord.js';
import replaceOptions from './utils/replaceOptions';
import cleverbot from 'cleverbot-free';
import chokidar from 'chokidar';
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

// Imgur
import { ImgurClient } from 'imgur';
export const imgur = new ImgurClient({
    clientId: process.env.IMGUR_ID,
    clientSecret: process.env.IMGUR_SECRET,
    //refreshToken: process.env.IMGUR_REFRESH_TOKEN
});

// Tenor
const tenor = require('tenorjs');
export const Tenor = tenor.client({
    "Key": process.env.TENOR_API_KEY!,
    "Filter": process.env.TENOR_FILTER_STATUS,
    "Locale": process.env.TENOR_LOCALE,
    "MediaFilter": "basic",
    "DateFormat": "D/MM/YYYY - H:mm:ss A"
});

export let config = JSON.parse(fs.readFileSync(process.env.CONFIG_PATH!, 'utf-8'));

// Config Watch
chokidar.watch(process.env.CONFIG_PATH!).on('change', (path: string) => {
    config = JSON.parse(fs.readFileSync(process.env.CONFIG_PATH!, 'utf-8'));
});

import hasPermission from './utils/hasPermission';

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

client.once('ready', async () => {
    console.log(`${client.user!.username} is now ready!`);
    const guild = client.guilds.cache.get(process.env.GUILD_ID!)!;

    client.user!.setPresence({
        activities: [{ name: `over ${guild.memberCount} users`, type: ActivityType.Watching }],
        status: 'dnd'
    });

    setInterval(() => {
        client.user!.setPresence({
            activities: [{ name: `over ${guild.memberCount} users`, type: ActivityType.Watching }],
            status: 'dnd'
        });
    }, 30 * 1000)

    // Register commands
    const rest = new REST({
        version: '9'
    }).setToken(process.env.TOKEN!);

    (async() => {
        try {
            await rest.put(Routes.applicationGuildCommands(client.user!.id, process.env.GUILD_ID!), {
                body: commands
            });

            console.log(`Registered slash commands successfully (type: guildCommands, ${process.env.GUILD_ID})`);
        } catch(err) {
            if(err) console.log(err);
            else console.log('Failed to register slash commands, no error provided');
        }
    })();
});

try {
    client.on('interactionCreate', async (interaction: any) => {
        if(interaction.isCommand() == false) return;
    
        if(!(await hasPermission(interaction.commandName, interaction.member))) {
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
client.on('messageCreate', async (message: any) => {
    if(message.author.bot && message.channel.type != ChannelType.DM) return;

    // Triggers
    const trigger = config['triggers'].filter((e: any) => e.trigger === message.content)[0];
    
    if(trigger != null) {
        try {
            message.reply(await replaceOptions(trigger['response'], message.member, message.guild));
        } catch(err) {
            console.log(
                `Unable to send message`
                + '\n↳' + err
            );
        }

        if(trigger['delete']) {
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
    if(message.channel.id == config['cleverbot']['channel']) {
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
    
    const cmd = args_cmd[0].slice(config['prefix'].length).toLowerCase();
    const args = args_cmd.slice(config['prefix'].length);

    if(!message.content.startsWith(config['prefix'])) return;

    if(!(await hasPermission(cmd, message.member!))) {
        return message.reply('⛔ You do not have permission to use this command!');
    }

    const textCommand = client.textCommands.get(cmd) || client.textAliases.get(cmd);
    if(!textCommand) return message.reply('⚠ Command not found');

    try {
        await textCommand.execute(message, args, client);
    } catch(err) {
        if(err) console.log(err);
        else console.log(`Failed to execute text command (${cmd}), no error provided`);

        message.channel!.send(`Error in text command \`${cmd}\`! <@${process.env.DEVELOPER_ID}>, please have a look at my code!`);
    }
});

client.on('guildMemberAdd', async (member) => {
    if(member.user.bot) return;
    const guild = client.guilds.cache.get(process.env.GUILD_ID!) as Guild;

    if(config['autoRole']['enabled']) {
        try {
            member.roles.add(guild.roles.cache.get(config['autoRole']['role'])!, 'Auto-role');
        } catch (err) {
            console.log(
                `Unable to add role to ${member.user.username}`
                + '\n↳' + err
            );
        }
    }

    if(config['welcome']['enabled']) {
        if(config['welcome']['channel'] == 'dm') {
            try {
                member.send(await replaceOptions(config['welcome']['message'], member, guild));
            } catch (err) {
                console.log(
                    `Unable to DM ${member.user.username}`
                    + '\n↳' + err
                );
            }
        } else {
            const channel = guild!.channels.cache.get(config['welcome']['channel']) as TextChannel;
            channel.send(await replaceOptions(config['welcome']['message'], member, guild));
        }
    }
});

client.on('guildMemberRemove', async (member) => {
    if(member.user.bot) return;
    const guild = client.guilds.cache.get(process.env.GUILD_ID!) as Guild;

    if(config['goodbye']['enabled']) {
        if(config['goodbye']['channel'] == 'dm') {
            try {
                member.send(await replaceOptions(config['goodbye']['message'], member, guild));
            } catch (err) {
                console.log(
                    `Unable to DM ${member.user.username}`
                    + '\n↳' + err
                );
            }
        } else {
            const channel = guild!.channels.cache.get(config['goodbye']['channel']) as TextChannel;
            channel.send(await replaceOptions(config['goodbye']['message'], member, guild));
        }
    }
});

client.login(process.env.TOKEN);