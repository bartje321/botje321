import {ChannelHandler} from "Twitch/ChannelHandler";
import {ChannelUser} from "Model/ChannelUser";
import {ChatClient} from "twitch-chat-client";
import {Logger} from "Logger/Logger";
import {Chatter} from "Model/Chatter";
import {Module} from "Twitch/Module/Module";
import {ShoutoutModule} from "Twitch/Module/ShoutoutModule";
import {GreeterModule} from "Twitch/Module/GreeterModule";
import * as NodeCache from "node-cache";
import {BotUser} from "Twitch/BotUser";
import {TwitchPrivateMessage} from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import {PubSubClient} from "twitch-pubsub-client";
import {PubSubListener} from "twitch-pubsub-client/lib/PubSubListener";
import {PubSubRedemptionMessage} from "twitch-pubsub-client/lib/Messages/PubSubRedemptionMessage";
import {QueueModule} from "Twitch/Module/QueueModule";
import {EchoCommandModule} from "Twitch/Module/EchoCommandModule";

/** Chat bot handler */
export class BotHandler {

    /** True if connected. */
    private connected: boolean = false;

    /** The chat client. */
    private chatClient: ChatClient;

    /** The pub sub client. */
    private pubSubClient: PubSubClient;

    /** redemtion listener. */
    private redemptionListener?: PubSubListener;

    /** Loaded bot modules. */
    private modules: Module[] = [];

    /** Bla */
    private chatterCache = new NodeCache({stdTTL: 900, useClones: false});

    /** True if destroyed */
    private destroyed: boolean = false;

    /** Create a handler */
    public constructor(
        private readonly channelHandler: ChannelHandler,
        private readonly chatUser: ChannelUser,
    ) {
        const chatAuthProvider = chatUser.getAuth()!;
        const chatClient = new ChatClient(chatAuthProvider, {channels: [channelHandler.getChannel().name]});
        chatClient.connect().then(this.onChatConnected.bind(this));
        this.chatClient = chatClient;

        const pubSubClient = new PubSubClient();
        pubSubClient.registerUserListener(channelHandler.getTwitchApi())
            .then(this.onPubSubConnected.bind(this, pubSubClient))
            .catch((e) => Logger.error(e));
        this.pubSubClient = pubSubClient;

        this.modules.push(new GreeterModule(channelHandler, chatClient));
        this.modules.push(new ShoutoutModule(channelHandler, chatClient));
        this.modules.push(new QueueModule(channelHandler, chatClient));
        this.modules.push(new EchoCommandModule(channelHandler, chatClient));
    }


    /**
     * Close and destroy the object.
     */
    public destroy(): void {
        if (this.destroyed) {
            return;
        }
        this.chatClient.quit();
        if (this.redemptionListener) {
            this.redemptionListener.remove();
            this.redemptionListener = undefined;
        }
        this.destroyed = true;
    }

    /** Gets called on connected */
    private onChatConnected() {
        this.connected = true;
        setTimeout(() => {
            this.chatClient.say(this.channelHandler.getChannel().name, "Hello World. I just woke up.")

        }, 5000);
        this.chatClient.onMessage(this.onMessage.bind(this));
    }

    /** Gets called on connected */
    private async onPubSubConnected(pubSubClient: PubSubClient) {
        if (this.destroyed) {
            return;
        }
        try {
            const redemptionListener = await pubSubClient.onRedemption(this.channelHandler.getChannel().twitchId, this.onRedemption.bind(this));
            if (this.destroyed) {
                redemptionListener.remove();
            } else {
                this.redemptionListener = redemptionListener;
            }
        } catch (e) {
            Logger.error(e);
        }
    }

    /** On message */
    private async onMessage(channelName: string, userName: string, message: string, msg: TwitchPrivateMessage): Promise<void> {
        this.validateChannel(channelName);
        // todo bot killer
        const chatUser = await this.getUser(msg.userInfo.userId!, {
            displayName: msg.userInfo.displayName,
            isMod: msg.userInfo.isMod || msg.userInfo.isBroadcaster
        });
        Logger.info(chatUser.getName() + ": " + message);

        for (const module of this.modules) {
            module.onMessage(chatUser, message);
        }

        const match = /^!([^\s]+)(?:\s+(.*))?/i.exec(message);
        if (match) {
            const [, command, args = ""] = match;
            for (const module of this.modules) {
                if (await module.onCommand.call(module, chatUser, command.toLowerCase(), ...(args.split(/\s/)))) {
                    break;
                }
            }
        }
    }

    /** On redemption */
    private async onRedemption(message: PubSubRedemptionMessage): Promise<void> {
        // const chatUser = await this.getUser(message.);
        const chatUser = await this.getUser(message.userId, {
            displayName: message.userDisplayName
        });

        Logger.info(chatUser.getName() + " redeemed " + message.rewardName + (message.message ? (" with input " + message.message) : ""));

        for (const module of this.modules) {
            if (module.onRedemption(chatUser, message)) {
                break;
            }
        }
    }

    /**
     * Validate a channel, throw an error when the cannel is invalid.
     * @param channelName The channel name to validate.
     */
    private validateChannel(channelName: string): void | never {
        const channel = this.channelHandler.getChannel();
        if (channelName.replace(/^#/, "") !== channel.name) {
            Logger.error(new Error(`onMessage triggered on wrong channel. expected: "${this.channelHandler.getChannel().name}", received: "${channelName}"`));
            return;
        }
    }

    /**
     * Get a chatter for an user name.
     * @param twitchId The user id or the chat user object.
     * @param userData The data to update the user with.
     * @param updateTimestamp True to update the last active.
     */
    private async getUser(twitchId: string, userData: {displayName: string, isMod?: boolean}, updateTimestamp: boolean = true): Promise<BotUser> {
        if (this.chatterCache.has(twitchId)) {
            this.chatterCache.ttl(twitchId);
            const botUser = this.chatterCache.get<BotUser>(twitchId)!;
            if (updateTimestamp) {
                const model = botUser.getModel();
                model.lastActive = new Date();
                await model.save();
            }
            if (userData.isMod !== undefined) {
                botUser.setMod(userData.isMod);
            }
            return botUser;
        }
        const model = (await Chatter.findOne({where: {
                channel: this.channelHandler.getChannel(),
                twitchId: twitchId
            }})) || new Chatter();
        if (!model.hasId()) {
            model.channel = this.channelHandler.getChannel();
            model.twitchId = twitchId;
        }
        model.name = userData.displayName || model.name || "";

        const botUser = new BotUser(model);
        if (userData.isMod !== undefined) {
            botUser.setMod(userData.isMod);
        }
        if (updateTimestamp) {
            model.lastActive = new Date();
        }
        await model.save();

        this.chatterCache.set(twitchId, botUser);
        return botUser;
    }
}
