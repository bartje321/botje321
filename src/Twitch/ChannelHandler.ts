import {Channel} from "Model/Channel";
import {ChannelUser, ChannelUserType} from "Model/ChannelUser";
import {ApiClient} from "twitch";
import {BotHandler} from "Twitch/BotHandler";

/**
 * Class for handling a channel.
 */
export class ChannelHandler {

    /**
     * Create a new channel handler.
     * @param channel The channel to make the handler for.
     */
    public static async create(channel: Channel): Promise<ChannelHandler | undefined> {
        const chatUser = await ChannelUser.findOne({where: {channel: channel, type: ChannelUserType.CHAT}});
        const channelUser = await ChannelUser.findOne({where: {channel: channel, type: ChannelUserType.CHANNEL}});
        if (
            !chatUser || !chatUser.accessToken || !chatUser.refreshToken
            || !channelUser || !channelUser.accessToken || !chatUser.refreshToken
        ) {
            return undefined;
        }
        const channelAuthProvider = channelUser.getAuth()!;
        await channelAuthProvider.refresh();
        const twitchApi = new ApiClient({authProvider: channelAuthProvider});
        return new ChannelHandler(channel, twitchApi, chatUser);
    }

    /** The bot. */
    private bot: BotHandler;

    /**
     * Create a new channel handler.
     */
    public constructor(
        private channel: Channel,
        private twitchApi: ApiClient,
        chatUser: ChannelUser,
    ) {
        this.bot = new BotHandler(this, chatUser)
    }

    /**
     * Get the channel.
     * @return The channel model.
     */
    public getChannel(): Channel {
        return this.channel;
    }

    /**
     * Get the twitch api.
     * @return the twitch api.
     */
    public getTwitchApi(): ApiClient {
        return this.twitchApi;
    }

    /**
     * Close and destroy the object.
     */
    public destroy(): void {
        this.bot.destroy();
    }
}
