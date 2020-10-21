import {BaseEntity, Column, Entity, ManyToOne, PrimaryColumn} from "typeorm";
import {Chatter} from "Model/Chatter";

/** Chatter config. */
@Entity()
export class ChatterConfig extends BaseEntity {

    /** The chatter id. */
    @PrimaryColumn()
    private chatterId!: number;

    /** The chatter for the config. */
    @ManyToOne(() => Chatter, (chatter) => chatter.configs, {nullable: false, cascade: true})
    public chatter!: Promise<Chatter> | Chatter;

    /** Config key */
    @PrimaryColumn({type: "varchar"})
    public key!: string;

    /** Config value */
    @Column({type: "text"})
    public value!: string;
}
