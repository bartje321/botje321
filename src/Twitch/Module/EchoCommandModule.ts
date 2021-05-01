import {Module} from "Twitch/Module/Module";
import {BotUser} from "Twitch/BotUser";
import {EchoCommand} from "Model/EchoCommand";

/** Module for greetings */
export class EchoCommandModule extends Module {

    /**
     * Called on received message.
     * @param chatUser The chatter.
     * @param command The command.d
     * @param args The params.
     * @return true if handled.
     */
    public async onCommand(chatUser: BotUser, command: string, ...args: string[]): Promise<boolean> {
        // Override me
        if (command === "command") {
            if (!this.isModOrError(chatUser)) {
                return true;
            }
            if (!(await this.handleCommand(args))) {
                this.say("/me can only understand one of the following: add <command> <value>, remove <command>");
            }
            return true;
        }

        const echoCommand = await EchoCommand.findOne({where: {
            channel: this.getChannel(),
            command: command
        }});
        if (echoCommand) {
            const replaces: {[K: string]: string} = {
                user: chatUser.getName()
            }
            for (const [i, v] of args.entries()) {
                replaces["" + i] = v;
            }
            this.say(echoCommand.value, replaces);
            return true;
        }

        return false;
    }


    /**
     * Handle the command.
     * @param args The args
     * @return true if successfull
     */
    private async handleCommand(args: string[]): Promise<boolean> {
        if (args.length <= 1) {
            return false;
        }

        const [action, command, ...params] = args;

        const model = (await EchoCommand.findOne({where: {
                channel: this.getChannel(),
                command: command
            }})) || new EchoCommand();
        if (!model.hasId()) {
            model.channel = this.getChannel();
            model.command = command;
        }

        switch (action) {
            case "add":
                model.value = params.join(" ");
                await model.save();
                this.say("/me has added or changed the command " + command);
                return true;
            case "remove":
                await model.remove();
                this.say("/me has removed the command " + command);
                return true;
        }
        return false;
    }
}
