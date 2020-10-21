import {BaseEntity, Column, Entity, Index, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {ChannelUser} from "Model/ChannelUser";
import {ChannelConfig} from "Model/ChannelConfig";
import {Chatter} from "Model/Chatter";
import {ConfigHelper} from "Model/ConfigHelper";

/** Single channel. */
@Entity()
export class Channel extends BaseEntity {

    /** Primary id. */
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    /** Name of the channel */
    @Column({type: "varchar"})
    @Index({ unique: true })
    public name!: string;

    /** Id given by twitch */
    @Column({type: "varchar"})
    @Index({ unique: true })
    public twitchId!: string;

    /** The channelUsers for this channel. */
    @OneToMany(() => ChannelUser, (channelUser) => channelUser.channel)
    public channelUsers!: Promise<ChannelUser[]>;

    /** The channelUsers for this channel. */
    @OneToMany(() => Chatter, (chatter) => chatter.channel)
    public chatters!: Promise<Chatter[]>;

    /** The configs for this channel. */
    @OneToMany(() => ChannelConfig, (channelConfig) => channelConfig.channel)
    public configs!: Promise<ChannelConfig[]>;

    /** Class for managing config properties */
    public readonly config = new ConfigHelper(this, ChannelConfig, "channel");

    /** Find a chatter. */
    public async findChatter(name: string): Promise<Chatter | undefined> {
        return Chatter.findOne({where: {channel: this, name: name}})
    }

}
