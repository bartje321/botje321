import {Module} from "Twitch/Module/Module";
import {BotUser} from "Twitch/BotUser";
import {PubSubRedemptionMessage} from "twitch-pubsub-client/lib/Messages/PubSubRedemptionMessage";

const greetings = [
    "Hello {user}",
    "Hi {user}",
    "Welcome {user}",
]

/** Module for greetings */
export class GreeterModule extends Module {

    /**
     * Called on received message.
     * @param chatUser The chatter.
     * @param message The message.
     */
    public async onMessage(chatUser: BotUser, message: string): Promise<void> {
        const lastTimestamp = await chatUser.config.getInt("greeter.timestamp") || 0;
        if (lastTimestamp < Date.now() - 7200000) { // 2 * 60 * 60 * 1000
            this.say((await chatUser.config.getString("greeter.custom") || greetings.random()!), {user: chatUser.getName()});
        }
        await chatUser.config.set("greeter.timestamp", Date.now());
    }

    /**
     * Called on reward redemtion.
     * @param chatUser The chatter.
     * @param message The message.
     * @return true if handled.
     */
    public async onRedemption(chatUser: BotUser, message: PubSubRedemptionMessage): Promise<boolean> {
        // TODO remove this test.
        if (message.rewardId === "813358ed-8687-4e1a-a209-b5d4b59a7edd") {
            this.say("Oh no! :O {user} used the test reward", {user: chatUser.getName()})

            return true;
        }
        return false;
    }

}
