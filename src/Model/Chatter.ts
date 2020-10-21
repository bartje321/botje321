import {BaseEntity, Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Channel} from "Model/Channel";
import {ChatterConfig} from "Model/ChatterConfig";
import {ConfigHelper} from "Model/ConfigHelper";

/** Single chatter on chanel. */
@Entity()
@Index(["channel", "twitchId"], { unique: true })
export class Chatter extends BaseEntity {

    /** Primary id. */
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    /** The channelUsers for this channel. */
    @ManyToOne(() => Channel, (channel) => channel.chatters)
    public channel!: Promise<Channel[]> | Channel;

    /** Name of the channel. */
    @Column({type: "varchar"})
    public name!: string;

    /** Id given by twitch */
    @Column({type: "varchar"})
    @Index({ unique: true })
    public twitchId!: string;

    /** Last active date */
    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    public lastActive!: Date;

    /** The configs for this channel. */
    @OneToMany(() => ChatterConfig, (chatterConfig) => chatterConfig.chatter)
    public configs!: Promise<ChatterConfig[]>;

    /** Class for managing config properties */
    public readonly config = new ConfigHelper(this, ChatterConfig, "chatter");
}
