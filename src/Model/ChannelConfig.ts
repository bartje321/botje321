import {BaseEntity, Column, Entity, ManyToOne, PrimaryColumn} from "typeorm";
import {Channel} from "Model/Channel";

/** Channel config. */
@Entity()
export class ChannelConfig extends BaseEntity {

    /** The channel id. */
    @PrimaryColumn()
    private channelId!: number;

    /** The channel for the config. */
    @ManyToOne(() => Channel, (channel) => channel.configs, {nullable: false, cascade: true})
    public channel!: Promise<Channel> | Channel;

    /** Config key */
    @PrimaryColumn({type: "varchar"})
    public key!: string;

    /** Config value */
    @Column({type: "text"})
    public value!: string;
}
