import {Module} from "Twitch/Module/Module";
import {BotUser} from "Twitch/BotUser";
import {Chatter} from "Model/Chatter";

const shoutouts = [
    "Go check out {user}, who is an awesome streamer playing {game} at {url}",
]

/** Module for shoutouts. */
export class ShoutoutModule extends Module {

    /**
     * Called on received message.
     * @param chatUser The chatter.
     * @param message The message.
     */
    public async onMessage(chatUser: BotUser, message: string): Promise<void> {
        const lastTimestamp = await chatUser.config.getInt("shoutout.timestamp") || 0;
        if (lastTimestamp < Date.now() - 7200000) { // 2 * 60 * 60 * 1000
            if (chatUser.getTwitchId() && !await chatUser.config.getBool("shoutout.disabled") && await this.isStreamer(chatUser)) {
                this.shoutout(chatUser.getModel());
            }
            await chatUser.config.set("shoutout.timestamp", Date.now());
        }
    }

    /**
     * Called on received message.
     * @param chatUser The chatter.
     * @param command The command.d
     * @param args The params.
     * @return true if handled.
     */
    public async onCommand(chatUser: BotUser, command: string, ...args: string[]): Promise<boolean> {
        // Override me
        if (command === "so") {
            if (!this.isModOrError(chatUser)) {
                return true;
            }
            if (!(await this.handleSoCommand(args))) {
                this.say("/me can only understand one of the following: set <user> <[message]>, disable <user>, enable <user>, <user>");
            }
            return true;
        }
        return false;
    }

    /**
     * Check if a chat user is a streamer.
     * @param chatUser The chatuser.
     * @return true if the user is a streamer.
     */
    private async isStreamer(chatUser: BotUser): Promise<boolean>{
        if (!chatUser.getTwitchId()) {
            return false;
        }
        const videos = (await this.getHelix().videos.getVideosByUser(chatUser.getTwitchId())).data;

        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        for (const video of videos) {
            if (video.creationDate > date) {
                return true;
            }
        }
        return false;
    }

    /**
     * Function for a shoutoud.
     * @param chatter The chatter model.
     * @private
     */
    private async shoutout(chatter: Chatter): Promise<void> {

        const user = await this.getKraken().users.getUser(chatter.twitchId);
        const channel = await user?.getChannel();
        if (!channel) {
            return;
        }
        this.say((await chatter.config.getString("shoutout.custom") || shoutouts.random()!), {
            user: chatter.name,
            game: channel.game,
            url: channel.url,
        });
    }

    /**
     * Handle the so command.
     * @param args The args
     * @return true if successfull
     */
    private async handleSoCommand(args: string[]): Promise<boolean> {
        if (args.length <= 0) {
            return false;
        }

        const name = args.length === 1 ? args[0] : args[1];
        const chatter = await this.getChannel().findChatter(name);
        if (!chatter) {
            this.say("/me couldn't find someone named " + name + " on this channel");
            return true;
        }

        if (args.length === 1) {
            this.shoutout(chatter);
            await chatter.config.set("shoutout.timestamp", Date.now());
            return true;
        }

        switch (args[0]) {
            case "set":
                if (args.length === 2) {
                    chatter.config.set("shoutout.custom", undefined);
                    this.say("/me has removed the custom shoutout for " + args[1]);
                } else {
                    chatter.config.set("shoutout.custom", args.slice(2).join(" "));
                    this.say("/me has set a custom shoutout for " + args[1]);
                    this.shoutout(chatter);
                }
                return true;
            case "disable":
                chatter.config.set("shoutout.disabled", true);
                this.say("/me has disabled shoutouts for  " + args[1]);
                return true;
            case "enable":
                chatter.config.set("shoutout.disabled", false);
                this.say("/me has enabled shoutouts for " + args[1]);
                return true;
        }
        return false;
    }
}
