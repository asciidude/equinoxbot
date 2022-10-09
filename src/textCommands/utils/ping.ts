import { Client, EmbedBuilder, Message } from "discord.js";

export default {
    name: 'ping',
    description: 'Get the server\'s ping',
    category: 'utilities',
    aliases: [],
    usage: 'ping',
    async execute(message: Message, args: string[], client: Client) {
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`Host Latency: \`${Date.now() - message.createdTimestamp}ms\``
                          + `\nAPI Latency:\`${client.ws.ping}ms\``)
            .setColor('DarkRed')
            .setFooter({
                text: message.member!.displayName,
                iconURL: message.author.avatarURL()!
            })
            .setTimestamp()

        message.reply({
            embeds: [embed]
        });
    }
}