import { Client, Message } from "discord.js";
import { config } from "../..";

export default {
    name: 'echo',
    description: 'Pong!',
    category: 'fun',
    aliases: ['say'],
    usage: 'echo <message>',
    async execute(message: Message, args: string[], client: Client) {
        if(!args[0]) {
            message.reply(`⚠ Incorrect usage, please use: \`${config['prefix']}echo <message>\``);
            return;
        }

        await message.reply(`${args.join(' ')}\n*Message sent from ${message.author}*`);
        await message.delete();
    }
}