import {ChannelHandler} from "Twitch/ChannelHandler";
import {ChatClient} from "twitch-chat-client";
import {BotUser} from "Twitch/BotUser";
import {Channel} from "Model/Channel";
import {KrakenApiGroup} from "twitch/lib/API/Kraken/KrakenApiGroup";
import {HelixApiGroup} from "twitch/lib/API/Helix/HelixApiGroup";
import {PubSubRedemptionMessage} from "twitch-pubsub-client/lib/Messages/PubSubRedemptionMessage";

/**
 * Base module class.
 */
export abstract class Module {

    /** Create a new module. */
    public constructor(
        private readonly channelHandler: ChannelHandler,
        private readonly chatClient: ChatClient,
    ) {
    }

    /**
     * Called on received message.
     * @param chatUser The chatter.
     * @param message The message.
     */
    public async onMessage(chatUser: BotUser, message: string): Promise<void | false> {
        // Override me
    }

    /**
     * Called on received message.
     * @param chatUser The chatter.
     * @param command The command.
     * @param args The params.
     * @return true if handled.
     */
    public async onCommand(chatUser: BotUser, command: string, ...args: string[]): Promise<boolean> {
        // Override me
        return false;
    }

    /**
     * Called on reward redemtion.
     * @param chatUser The chatter.
     * @param message The message.
     * @return true if handled.
     */
    public async onRedemption(chatUser: BotUser, message: PubSubRedemptionMessage): Promise<boolean> {
        // Override me
        return false;
    }

    /**
     * Cheack if an user is a mod
     * @param chatUser The chatter.
     * @protected True if the user is a mod.
     */
    protected isModOrError(chatUser: BotUser): boolean {
        if (chatUser.isMod()) {
            return true;
        }
        this.say("/me knows you don't have enough rights for that {user}!", {user: chatUser.getName()});
        return false;

    }

    /**
     * Say something.
     * @param message The message to say.
     * @param replaces The fields to replace.
     */
    protected say(message: string, replaces?: {[K: string]: string | number}): void {
        if (replaces) {
            for (const key in replaces) {
                if (replaces.hasOwnProperty(key)) {
                    message = message.replace("{" + key + "}", "" + replaces[key]);
                }
            }
        }
        this.chatClient.say(this.getChannelName(), message);
    }

    /**
     * Shortcut to get the channel.
     * @return The channel.
     */
    protected getChannel(): Channel {
        return this.channelHandler.getChannel();
    }

    /**
     * Shortcut to get the channel name.
     * @return The channel name.
     */
    protected getChannelName(): string {
        return this.channelHandler.getChannel().name;
    }

    /**
     * Shortcut to the kraken twitch api.
     * @deprecated
     * @return The kraken twitch api.
     */
    protected getKraken(): KrakenApiGroup {
        return this.channelHandler.getTwitchApi().kraken;
    }

    /**
     * Shortcut to the helix twitch api.
     * @return The helix twitch api.
     */
    protected getHelix(): HelixApiGroup {
        return this.channelHandler.getTwitchApi().helix;
    }
}
