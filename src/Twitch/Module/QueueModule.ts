import {Module} from "Twitch/Module/Module";
import {BotUser} from "Twitch/BotUser";
import {Chatter} from "Model/Chatter";

/***/
interface Entry {
    twitchId: string;
    name: string;
    code: string;
}

let open = true;
let current: Entry | undefined;
const list: Entry[] = [];

/** Module for shoutouts. */
export class QueueModule extends Module {

    /**
     * Called on received message.
     * @param chatUser The chatter.
     * @param message The message.
     */
    public async onMessage(chatUser: BotUser, message: string): Promise<void> {

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
        switch (command) {
            case "add": {
                if (!open) {
                    this.say("Sorry, the queue is closed.");
                    return true;
                }
                const code = args.join(" ");
                // TODO validate code.
                if (!code) {
                    this.say("Use \"!add LEV-ELC-ODE\" to add your level.");
                    return true;
                }
                if (list.find((v) => v.twitchId === chatUser.getTwitchId())) {
                    this.say("You already have an entry in the queue, use replace to change your current entry.");
                    return true;
                }
                this.say("The code has been added. Don't forget to use !leave if you are going away or you end up on the naughty list.");
                list.push({
                    twitchId: chatUser.getTwitchId(),
                    name: chatUser.getName(),
                    code: code,
                });
                return true;
            }
            case "leave":
                if (list.removeAllFunc((v) => v.twitchId === chatUser.getTwitchId()) === 0) {
                    this.say("You didn't had a level in the queue. Hope to see you back soon.");
                    return true;
                }
                this.say("Your level has been removed from the queue. Hope to see you back soon.");
                return true;
            case "replace": {
                const code = args.join(" ");
                // TODO validate code.
                if (!code) {
                    this.say("Use \"!replace LEV-ELC-ODE\" to replace your level.");
                    return true;
                }
                const entry = list.find((v) => v.twitchId === chatUser.getTwitchId());
                if (entry) {
                    entry.code = code;
                    this.say("You entry has been replaced.");
                    return true;
                }
                this.say("You dont have an entry in the queue. The code has been added instead. Don't forget to use !leave if you are going away or you end up on the naughty list.");
                list.push({
                    twitchId: chatUser.getTwitchId(),
                    name: chatUser.getName(),
                    code: code,
                });
                return true;
            } case "list":
                if (!list.length) {
                    this.say("The list is empty.");
                    return true;
                }
                this.say("{number} users in queue: {list}", {number: list.length, list: list.map((v) => v.name).join(", ")});
                return true;
            case "position":
                const index = list.findIndex((v) => v.twitchId === chatUser.getTwitchId());
                if (index === -1) {
                    this.say("You dont have an entry in the queue.");
                    return true;
                }
                this.say("You are in position {position}.", {position: index + 1});
                return true;
            case "current":
                if (!current) {
                    this.say("No current level.");
                    return true;
                }
                this.say("Current level is \"{code}\" by {user}.", {code: current.code, user: current.name});
                return true;
            case "open":
                if (!this.isModOrError(chatUser)) {
                    return true;
                }
                open = true;
                this.say("The queue is now open.");
                return true;
            case "close":
                if (!this.isModOrError(chatUser)) {
                    return true;
                }
                open = false;
                this.say("The queue is now closed.");
                return true;
            case "next":
                if (!this.isModOrError(chatUser)) {
                    return true;
                }
                current = list.shift();
                if (!current) {
                    this.say("No current level.");
                    return true;
                }
                this.say("Current next level is \"{code}\" by {user}.", {code: current.code, user: current.name});
                return true;
            case "clear":
                if (!this.isModOrError(chatUser)) {
                    return true;
                }
                list.clear();
                this.say("The queue has been cleared");
                return true;
        }
        return false;
    }
}
