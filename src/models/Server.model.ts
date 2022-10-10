import { Schema, model } from "mongoose";

export interface Server {
    guild_id: string;
    prefix: string;

    /**
     * Welcome object
     * {
     *  enabled: boolean;
     *  message: string;
     *  channel: string; // Channel ID
     * }
     */
    welcome: {
        enabled: boolean,
        message: string,
        channel: string // Channel ID
    };

    /**
     * Goodbye object
     * {
     *  enabled: boolean;
     *  message: string;
     *  channel: string; // Channel ID
     * }
     */
    goodbye: {
        enabled: boolean,
        message: string,
        channel: string // Channel ID
    };

    /**
     * Auto-role object
     * {
     *  enabled: boolean;
     *  role: string; // Role ID
     * }
     */
    autoRole: {
        enabled: boolean,
        role: string // Role ID
    };

    /**
     * Permissions object
     * {
     *  commandName: string;
     *  roles: string[]; // Array of role IDs
     *  administratorOverride: boolean;
     * }
     */
    permissions: any[];

    /**
     * Cleverbot object
     * {
     *  enabled: boolean;
     *  channel: string; // Channel ID
     * }
     */
    cleverbot: {
        enabled: string;
        channel: string // Channel ID
    };

    /**
     * Triggers objects
     * {
     *  trigger: string;
     *  response: string;
     *  delete: boolean;
     *  id: string;
     * }
     */
    triggers: any[];
}

const serverSchema = new Schema<Server>({
    guild_id: String,
    prefix: String,

    welcome: Object,
    goodbye: Object,
    autoRole: Object,

    permissions: Array,
    cleverbot: Object,
    triggers: Object
});

export default model<Server>('Server', serverSchema);