import {BaseEntity} from "typeorm";

/***/
type ConstructorReturn<T extends new (...args: any) => any> = T extends new (...args: any) => infer P ? P : never;

/**  Helper class for classes with key value config */
export class ConfigHelper<
    MODEL extends BaseEntity & {configs: Promise<Array<ConstructorReturn<CONFIG_CLASS>>>},
    CONFIG_CLASS extends typeof BaseEntity & (new() => (BaseEntity & {key: string, value: string})),
    THIS_FIELD extends keyof ConstructorReturn<CONFIG_CLASS>,
> {


    /** Map for cached configs */
    private configCache: {[K: string]: string | undefined} = {};

    /***/
    public constructor(
        private readonly model: MODEL,
        private readonly configClass: CONFIG_CLASS,
        private readonly thisField: THIS_FIELD
    ) {
    }

    /**
     * Get a config string value.
     * @param key The config key.
     * @return The config value if set, otherwise undefined.
     */
    public async getString(key: string): Promise<string | undefined> {
        if (this.configCache.hasOwnProperty(key)) {
            return this.configCache[key];
        }
        const config = await this.configClass.findOne({where: {[this.thisField]: this.model, key: key}});
        return this.configCache[key] = config ? config.value : undefined;
    }

    /**
     * Get a config int value.
     * @param key The config key.
     * @return The config value if set, otherwise undefined.
     */
    public async getInt(key: string): Promise<number | undefined> {
        const value = await this.getString(key);
        if (value) {
            return Number.parseInt(value, 10);
        }
        return undefined;
    }

    /**
     * Get a config boolean value.
     * @param key The config key.
     * @return The config value if set, otherwise undefined.
     */
    public async getBool(key: string): Promise<boolean | undefined> {
        const value = await this.getString(key);
        if (value) {
            return value !== "false";
        }
        return undefined;
    }

    /**
     * Set a config value.
     * @param key The config key
     * @param value The config value to set.
     */
    public async set(key: string, value: string | boolean | number | undefined): Promise<void> {

        const stringValue = this.getStringValue(value);

        if (this.configCache.hasOwnProperty(key) && this.configCache[key] === value) {
            return;
        }
        this.configCache[key] = stringValue;
        let config = await this.configClass.findOne({where: {[this.thisField]: this.model, key: key}});
        if (stringValue === undefined) {
            if (config) await config.remove();
            return;
        }
        if (!config) {
            config = new this.configClass();
            // @ts-ignore
            config[this.thisField] = this.model;
            config.key = key;
        }
        config.value = stringValue;
        await config.save();
    }

    /**
     * Get the string value for a value.
     * @param value
     * @private
     */
    private getStringValue(value: string | boolean | number | undefined): string | undefined {
        switch (typeof value) {
            case "boolean":
                return value ? "true" : "false"
            case "number":
                return `${value}`;
        }
        return value;
    }
}
