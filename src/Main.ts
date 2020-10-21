// tslint:disable-next-line:no-var-requires
require("Global");

import {Severity} from "Logger/Types";
import {ChannelHandler} from "Twitch/ChannelHandler";
import {connectDatabase} from "Database";
import {Logger} from "Logger/Logger";
import {Terminator} from "Terminator";
import {Server} from "WebServer/Server";
import {Twitch} from "WebServer/Twitch";
import {Channel} from "Model/Channel";
import {colorsLog} from "Logger/LogFunctions/Colors";


/** Run the application */
async function run(): Promise<void> {
    Logger.init();
    Logger.add(Severity.INFO, colorsLog());

    const connection = await connectDatabase();
    await connection.synchronize();
    Logger.info("Database up to date");


    const server = new Server(8050, false, [
        new Twitch(),
    ]);


    const channels = await Channel.find();
    const channelHandlers: ChannelHandler[] = [];
    for (const channel of channels) {
        ChannelHandler.create(channel).then((channelHandler) => {
            if (channelHandler) {
                channelHandlers.push(channelHandler);
            }
        })
    }

    Terminator.add(() => {
        connection.close();
        server.destroy();
        channelHandlers.destroy();
    });
}

run();
