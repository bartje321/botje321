import {Module} from "WebServer/Server";
import * as Express from "express";
import * as Querystring from "querystring";
import * as Url from "url";
import * as Https from "https";
import {Env} from "Env";
import {ChannelUser, ChannelUserType} from "Model/ChannelUser";
import {Channel} from "Model/Channel";
import {keygen} from "Keygen";
import * as NodeCache from "node-cache";

const clientId = Env.string("TWITCH_CLIENT_ID")
const secret = Env.string("TWITCH_SECRET")
const host = "http://localhost:8050/" // TODO env or something


const redirectUri = host + "twitch/auth/callback";

/**
 * Twitch auth state params.
 */
interface TwitchAuthState {
    id: string;
    channel: Channel;
    type: ChannelUserType;
}


/**
 * Class for handling twitch requests
 */
export class Twitch implements Module {

    /** Current auth state requests. */
    private static authState = new NodeCache({stdTTL: 900, useClones: false});

    /**
     * Start an auth request.
     * @param channel The channel to auth.
     * @param type The type to auth.
     * @return The url to redirect to.
     */
    public static startAuthRequest(channel: Channel, type: ChannelUserType): string {
        const id = keygen();
        Twitch.authState.set<TwitchAuthState>(id, {
            id: id,
            channel: channel,
            type: type,
        });
        return host + "twitch/auth?state=" + id;
    }

    /**
     * Get a state param
     * @param id
     * @private
     */
    private static getState(id: string | undefined): TwitchAuthState | undefined {
        if (!id) {
            return;
        }
        return Twitch.authState.get(id);
    }

    /**
     * Apply the configuration to express.
     * @param app Express app.
     */
    public apply(app: Express.Express): void {
        app.get("/twitch/startchat", async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
            res.redirect(Twitch.startAuthRequest((await Channel.findOne())!, ChannelUserType.CHAT));
        });
        app.get("/twitch/startuser", async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {

            res.redirect(Twitch.startAuthRequest((await Channel.findOne())!, ChannelUserType.CHANNEL));
        });
        app.get("/twitch/auth", this.twitchAuth.bind(this));
        app.get("/twitch/auth/callback", this.twitchAuthCallback.bind(this));

    }

    /** Start twitch auth flow */
    private async twitchAuth(req: Express.Request, res: Express.Response, next: Express.NextFunction): Promise<void> {
        const state = Twitch.getState(req.query.state as any);
        if (!state) {
            res.sendStatus(500).end();
            return;
            // TODO error
        }

        const scope = state.type === ChannelUserType.CHAT ? [
            "channel:moderate",
            "bits:read",
            "chat:read",
            "chat:edit",
            "whispers:read",
            "whispers:edit",
        ] : [
            "analytics:read:extensions",
            "analytics:read:games",
            "bits:read",
            "channel:edit:commercial",
            "channel:manage:broadcast",
            "channel:read:hype_train",
            "channel:read:stream_key",
            "channel:read:subscriptions",
            "channel:read:redemptions",
            "clips:edit",
            "user:edit",
            "user:edit:follows",
            "user:read:broadcast",
            "user:read:email",
        ]

        const qs = new URLSearchParams({
            client_id: clientId, // TODO env,
            redirect_uri: redirectUri, // TODO get correct path
            response_type: "code",
            scope: scope.join(" "),
            state: state.id,
        });
        res.redirect("https://id.twitch.tv/oauth2/authorize?" + qs.toString());
    }

    /** Callback for the auth request */
    private async twitchAuthCallback(req: Express.Request, res: Express.Response, next: Express.NextFunction): Promise<void> {
        const code = req.query.code as string;
        if (!code) {
            // TODO error
            res.sendStatus(500).end();
            return;
        }

        const state = Twitch.getState(req.query.state as any);
        if (!state) {
            res.sendStatus(500).end();
            return;
            // TODO error
        }

        const postData = Querystring.stringify({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: secret,
        });

        const ssoUrl = Url.parse("https://id.twitch.tv/oauth2");
        const postReq = Https.request({
            host: ssoUrl.hostname,
            port: ssoUrl.port,
            path: ssoUrl.path + "/token",
            method: "POST",
            headers: {
                "Content-type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(postData),
            },
        }, (postRes) => {
            let buffer = "";
            postRes.on("data", (chunk) => {
                buffer += chunk.toString();
            });
            postRes.on("end", async () => {
                const data = JSON.parse(buffer);

                const channelUser = (await ChannelUser.findOne({where: {channel: state.channel, type: state.type}})) || new ChannelUser();
                channelUser.channel = state.channel;
                channelUser.type = state.type;
                channelUser.accessToken = data.access_token;
                channelUser.refreshToken = data.refresh_token;
                await channelUser.save();

                res.sendStatus(200).end();
            });
        });
        postReq.write(postData);
        postReq.end();
    }
}
