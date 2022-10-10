import Server from "../models/Server.model";

export default async (command: string, guildId: string) => {
    const guild = await Server.findOne({ guild_id: guildId });
    const permission = guild!.permissions.filter((e: any) => e.commandName === command)[0];

    if(permission) {
        return permission;
    } else {
        return false;
    }
}