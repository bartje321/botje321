import {Chatter} from "Model/Chatter";
import {ChatUser} from "twitch-chat-client";

/** Class for chat user */
export class BotUser {

    /** Shortcut to config class. */
    public readonly config = this.model.config

    /** True if is mod. */
    private mod: boolean = false;

    /**
     * Create a chat user.
     * @param name The username.
     * @param model The database model.
     * @param chatUser The chat user.
     */
    public constructor(
        private readonly model: Chatter,
    ) {
    }

    /** Get user name */
    public getName(): string {
        return this.model.name;
    }
    /** Get user twitch id */
    public getTwitchId(): string {
        return this.model.twitchId;
    }

    /** Get if user is mod, may not be acurate */
    public isMod(): boolean {
        return this.mod;
    }

    /**
     * @private
     */
    public getModel(): Chatter {
        return this.model;
    }

    /**
     * @private
     */
    public setMod(mod: boolean): void {
        this.mod = mod;
    }
}
