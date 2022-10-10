import { Client, Message } from "discord.js";

export default {
    name: 'echo',
    description: 'Repeat the message you want the bot to say',
    category: 'fun',
    aliases: ['say'],
    usage: 'echo <message>',
    async execute(message: Message, args: string[], client: Client) {
        if(!args[0]) {
            message.reply(`⚠ Incorrect usage`);
            return;
        }

        await message.reply(`${args.join(' ')}\n*Message sent from ${message.author}*`);
        await message.delete();
    }
}