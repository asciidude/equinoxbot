import Server from '../models/Server.model'

export default async (guild_id: string) => {
    return await Server.create({
        guild_id: guild_id,
        prefix: ';',
    
        welcome: {
            enabled: false,
            message: '',
            channel: ''
        },
    
        goodbye: {
            enabled: false,
            message: '',
            channel: ''
        },
    
        autoRole: {
            enabled: false,
            role: ''
        },
    
        permissions: [
            {
                commandName: 'config',
                roles: [],
                administratorOverride: true
            },
            {
                commandName: 'triggers',
                roles: [],
                administratorOverride: true
            },
        ],
    
        cleverbot: {
            enabled: false,
            channel: ''
        },
    
        triggers: []
    });
}