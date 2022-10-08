import { GuildMember, PermissionFlagsBits } from "discord.js";
import findPermission from './findPermission';

export default async (command: string, member: GuildMember) => {
    const permission: any = await findPermission(command);

    if(permission) {
        if(permission['administratorOverride']) {
            if(
                member.permissions.has(PermissionFlagsBits.Administrator)
                || member.roles.cache.some(r => permission['roles'].includes(r.id))
                || member.user.id === process.env.DEVELOPER_ID // Need a developer override for testing 🤷‍♂️
            ) {
                return true;
            } else {
                return false;
            }
        } else {
            if(
                member.roles.cache.some(r => permission['roles'].includes(r.id))
                || member.user.id === process.env.DEVELOPER_ID
            ) {
                return true;
            } else {
                return false;
            }
        }
    } else {
        return true;
    }
}