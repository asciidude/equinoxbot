import { client } from "..";

export default async (command: any) => {
    if(client.commands.get(command) || client.textCommands.get(command)) {
        return true;
    } else {
        return false;
    }
}