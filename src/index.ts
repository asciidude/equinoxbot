// Setup
import 'dotenv/config';

import fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import Discord, { Collection, TextChannel, GuildMember, Interaction, ActivityType, GatewayIntentBits, Guild } from 'discord.js';
import replaceOptions from './utils/replaceOptions';
import path from 'path';

declare module "discord.js" {
    export interface Client {
        commands: Collection<unknown, any>
    }
}

const client = new Discord.Client({
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

const config = JSON.parse(fs.readFileSync(process.env.CONFIG_PATH!, 'utf-8'));

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

const commandFiles: String[] = recursive(`${__dirname}/commands`, []).filter((f: any) => f.endsWith('.ts'));
const commands: Object[] = [];
client.commands = new Collection();

for (const file of commandFiles) {
    let command = require(file as string);
    if (command.default) command = command.default;

    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
    console.log(`${client.user!.username} is now ready!`);
    client.user!.setPresence({
        activities: [{ name: `hot guys doing the splits`, type: ActivityType.Watching }],
        status: 'dnd'
    });

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

client.on('interactionCreate', async (interaction: any) => {
    if(interaction.isCommand() == false) return;

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

        interaction.channel!.send(`Error in command \`${interaction.commandName}\`! <@801469073535139860>, please have a look at my code!`);
    }
});

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    const trigger = config['triggers'].filter((e: any) => e.trigger == message.content)[0];
    
    if(trigger != null && message.content.includes(trigger['trigger'])) {
        message.reply(trigger['response'])
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

client.login(process.env.TOKEN);