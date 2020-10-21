import {BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Channel} from "Model/Channel";
import {Env} from "Env";
import {AccessToken, RefreshableAuthProvider, StaticAuthProvider} from "twitch-auth";

/***
 * ChannelUser types.
 */
export enum ChannelUserType {
    /** Channel type user */
    CHANNEL = "channel",
    /** Chat type user */
    CHAT = "chat",
}

/** Channel user model. Manages authentication for channelUsers */
@Entity()
@Index(["channel", "type"], { unique: true })
export class ChannelUser extends BaseEntity {

    /** Primary id. */
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    /** The channel for the user. */
    @ManyToOne(() => Channel, (channel) => channel.channelUsers, {nullable: false, cascade: true, lazy: true})
    public channel!: Promise<Channel> | Channel;

    /** The user type */
    @Column({type: "enum", enum: ChannelUserType})
    public type!: ChannelUserType;

    /** Users accept token */
    @Column({type: "varchar", nullable: true})
    public accessToken!: string | null

    /** Users refresh token */
    @Column({type: "varchar", nullable: true})
    public refreshToken!: string | null

    /**
     * Geth auth class for twitch api.
     * @return The auth class.
     */
    public getAuth(): undefined | RefreshableAuthProvider {
        if (!this.accessToken || !this.refreshToken) {
            return;
        }
        const clientId = Env.string("TWITCH_CLIENT_ID")
        const secret = Env.string("TWITCH_SECRET")
        return new RefreshableAuthProvider(new StaticAuthProvider(clientId, this.accessToken), {
            clientSecret: secret,
            refreshToken: this.refreshToken,
            onRefresh: (token) => {
                this.accessToken = token.accessToken;
                this.refreshToken = token.refreshToken;
                this.save();
            }
        });
    }
}
