import { Client, EmbedBuilder, Message } from "discord.js";

export default {
    name: 'invite',
    description: 'Get the bot\'s invite link',
    category: 'utilities',
    aliases: [],
    usage: 'invite',
    async execute(message: Message, args: string[], client: Client) {
        message.reply(`Add me to your server through this link: ${process.env.INVITE_LINK}`);
    }
}