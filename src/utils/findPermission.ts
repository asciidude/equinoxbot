import { config } from "..";

export default async (command: string) => {
    const permission = config['permissions'].filter((e: any) => e.commandName === command)[0];

    if(permission) {
        return permission;
    } else {
        return false;
    }
}