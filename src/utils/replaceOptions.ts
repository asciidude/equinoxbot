export default async (message: any, member: any, guild: any) => {
    return message
        .replaceAll('{GUILD.NAME}', guild.name)
        .replaceAll('{GUILD.OWNER}', await guild.fetchOwner())
        .replaceAll('{USER.MENTION}', member)
        .replaceAll('{USER.NAME}', member.user.username)
        .replaceAll('{USER.DISCRIMINATOR}', member.user.discriminator)
        .replaceAll('{USER.ID}', member.user.id)
        .replaceAll('{USER.AVATAR}', member.user.avatarURL())
        .replaceAll('\\n', '\n');
}