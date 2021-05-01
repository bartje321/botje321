import {BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Channel} from "Model/Channel";

/** Single chatter on chanel. */
@Entity()
export class EchoCommand extends BaseEntity {

    /** Primary id. */
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    /** The channel for this command. */
    @ManyToOne(() => Channel, (channel) => channel.chatters)
    public channel!: Promise<Channel[]> | Channel;

    /** Name of the command. */
    @Column({type: "varchar"})
    public command!: string;

    /** The value to echo. */
    @Column({type: "text"})
    public value!: string;

}
