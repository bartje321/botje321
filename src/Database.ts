import {Env} from "Env";
import {createConnection} from "typeorm";
import {Connection} from "typeorm/connection/Connection";

/**
 * Setup a database connection.
 */
export async function connectDatabase(): Promise<Connection> {
    return createConnection({
        type: "mysql",
        host: Env.string("DATABASE_HOST", "127.0.0.1"),
        port: Env.number("DATABASE_PORT", 3306),
        username: Env.string("DATABASE_USER", "root"),
        password: Env.string("DATABASE_PASS", "") || undefined,
        database: Env.string("DATABASE_NAME", "twitchbot"),
        entities: [
            __dirname + "/Model/*.ts",
            __dirname + "/Model/*.js"
        ],
        synchronize: true,
        logging: false
    });
}
