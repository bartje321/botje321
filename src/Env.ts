import ProcessEnv = NodeJS.ProcessEnv;
import * as Dotenv from "dotenv";

Dotenv.config();

/**
 * Class for getting env vars.
 */
export class Env {

    /**
     * Get an env var as string or throw an error if no fallback is set.
     * @param {string} name The name of the env var.
     * @param {string} fallback The fallback value.
     * @return {string} The value.
     */
    public static string(name: keyof ProcessEnv, fallback?: string): string | never {
        if (!process.env[name]) {
            if (fallback !== undefined) {
                return fallback;
            }
            throw new Error("Enviroment variable " + name + " not set");
        }
        return process.env[name]!;
    }

    /**
     * Get an env var as number or throw an error if no fallback is set.
     * @param {string} name The name of the env var.
     * @param {number} fallback The fallback value.
     * @return {number} The value.
     */
    public static number(name: keyof ProcessEnv, fallback?: number): number | never {
        if (!process.env[name]) {
            if (fallback !== undefined) {
                return fallback;
            }
            throw new Error("Enviroment variable " + name + " not set");
        }
        if (isNaN(Number(process.env[name]))) {
            throw new Error("Enviroment variable " + name + " is not a number");
        }
        return Number(process.env[name]);
    }

    /**
     * Get an env var as json or throw an error if no fallback is set.
     * @param {string} name The name of the env var.
     * @param {*} fallback The fallback value.
     * @return {*} The value.
     */
    public static json<T>(name: keyof ProcessEnv, fallback?: T): T | never {
        if (!process.env[name]) {
            if (fallback !== undefined) {
                return fallback;
            }
            throw new Error("Enviroment variable " + name + " not set");
        }
        // JSON.parse will throw it's own error when not parseable.
        return JSON.parse(process.env[name]!);
    }
}
