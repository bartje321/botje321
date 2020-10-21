import {defaultLog} from "./LogFunctions/Default";
import {LogFunction, LogOptions, LogType, Severity} from "./Types";

const level: {[K in Severity]: number} = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    FATAL: 4,
};

/**
 * Class for logging.
 */
export class Logger {

    /** The logging functions. */
    private static funcs: Array<{severity: Severity, func: LogFunction}> = [];

    /** True to overwrite the default console. */
    private static overrideConsole: boolean = false;

    /** Origional concole functions. */
    private static orgConsole?: Partial<Console>;

    /**
     * Add a function to the logger.
     * @param {Severity} severity The severity to listen on.
     * @param {LogFunction} func The log function.
     */
    public static add(severity: Severity, func: LogFunction) {
        Logger.funcs.push({
            severity: severity,
            func: func,
        });
    }

    /**
     * Log debug
     * @param {* | function} value The value or function to log.
     */
    public static debug(value: LogType): void {return Logger.log(Severity.DEBUG, value); }

    /**
     * Log info
     * @param {* | function} value The value or function to log.
     */
    public static info(value: LogType): void {return Logger.log(Severity.INFO, value); }

    /**
     * Log warning
     * @param {* | function} value The value or function to log.
     */
    public static warn(value: LogType): void {return Logger.log(Severity.WARNING, value); }

    /**
     * Log warning
     * @param {* | function} value The value or function to log.
     */
    public static warning(value: LogType): void {return Logger.log(Severity.WARNING, value); }

    /**
     * Log error
     * @param {* | function} value The value or function to log.
     */
    public static error(value: Error): void {return Logger.log(Severity.ERROR, value); }

    /**
     * Log error
     * @param {* | function} value The value or function to log.
     */
    public static fatal(value: Error): never {return Logger.log(Severity.FATAL, value); }

    /** Overload */
    public static log(severity: Severity.FATAL, value: LogType): never;
    /** Overload */
    public static log(severity: Severity, value: LogType): void;

    /**
     * Log a single value or object if active.
     * @param {string} severity The project of logging.
     * @param {* | function} value The value or function to log.
     */
    public static log(severity: Severity, value: LogType): void | never {
        severity = severity.toUpperCase() as Severity;
        if (!Logger.has(severity)) {
            return;
        }
        if (typeof value === "function") {
            return Logger.log(severity, value());
        } else if (value instanceof Error) {
            if (value.stack) {
                Logger.logVar(severity, value.name + ": " + value.message, value.stack.split("\n"), value);
            } else {
                Logger.logVar(severity, value.name + ": " + value.message, undefined, value);
            }
        } else if (typeof value === "string") {
            Logger.logVar(severity, value);
        } else if (value === undefined) {
            Logger.logVar(severity, "undefined", value);
        } else if (Number.isNaN(value)) {
            Logger.logVar(severity, "NaN", value);
        } else {
            Logger.logVar(severity, JSON.stringify(value).substr(0, 128).split("\n")[0], value);
        }

        if (severity === Severity.FATAL) {
            return process.exit(-1);
        }
    }

    /**
     * Has log debug
     * @return {boolean} True if the logger reports this.
     */
    public static hasDebug(): boolean {return Logger.has(Severity.DEBUG); }

    /**
     * Has log info
     * @return {boolean} True if the logger reports this.
     */
    public static hasInfo(): boolean {return Logger.has(Severity.INFO); }

    /**
     * Has log warning
     * @return {boolean} True if the logger reports this.
     */
    public static hasWarn(): boolean {return Logger.has(Severity.WARNING); }

    /**
     * Has log warning
     * @return {boolean} True if the logger reports this.
     */
    public static hasWarning(): boolean {return Logger.has(Severity.WARNING); }

    /**
     * Has log error
     * @return {boolean} True if the logger reports this.
     */
    public static hasError(): boolean {return Logger.has(Severity.ERROR); }

    /**
     * Check if the logger rapports this project.
     * @param {string} severity The severity.
     * @return {boolean} True if the logger reports this.
     */
    public static has(severity: Severity): boolean {
        if (!Logger.funcs.length) {
            return true;
        }
        for (const func of Logger.funcs) {
            if (level[func.severity] <= level[severity]) {
                return true;
            }
        }
        return false;
    }

    /**
     * Init the logger, get the file handler.
     * @param {*} options The log options.
     */
    public static init(options: LogOptions = {}): void {
        Logger.overrideConsole = options.overrideConsole !== false;
        if (options.exceptionHandler !== false) {
            process.on("uncaughtException", Logger.fatal);
            // @ts-ignore
            process.on("unhandledRejection", Logger.fatal);
            process.on("warning", Logger.warning);
            process.on("exit", Logger.exit);
        }
        Logger.overrideConsoleFunctions();
    }

    /**
     * Log a far using the log function.
     * @param {Severity} severity The severity.
     * @param {string} message The message.
     * @param {stack} data The stack value.// TODO stack
     * @param {error} error The error igf any.
     */
    private static logVar(severity: Severity, message: string, data?: any, error?: Error) {
        Logger.restoreConsoleFunctions();
        if (!Logger.funcs.length) {
            defaultLog()(severity, message, data);
        } else {
            for (const func of Logger.funcs) {
                if (level[func.severity] <= level[severity]) {
                    func.func(severity, message, data, error);
                }
            }
        }
        Logger.overrideConsoleFunctions();
    }

    /**
     * Override the concole functions.
     */
    private static overrideConsoleFunctions() {
        if (!Logger.overrideConsole) {
            return;
        }
        if (!Logger.orgConsole) {
            Logger.orgConsole = {
                debug: console.debug,
                error: console.error,
                info: console.info,
                log: console.log,
                warn: console.warn,
            };
        }
        const overrider = (func: (value: LogType) => void) => {
            return (message?: any, ...optionalParams: any[]) => {
                // Do not pass function to logger.
                func(typeof message === "function" ? message.toString() : message);
                for (const optionalParam of optionalParams) {
                    func(typeof optionalParam === "function" ? optionalParam.toString() : optionalParam);
                }
            };
        };

        console.debug = overrider(Logger.debug);
        console.error = overrider(Logger.error);
        console.info = overrider(Logger.info);
        console.log = overrider(Logger.info); // Note: info, not log
        console.warn = overrider(Logger.warn);
    }

    /**
     * Restore the concole functions.
     */
    private static restoreConsoleFunctions() {
        if (Logger.orgConsole) {
            console.debug = Logger.orgConsole.debug!;
            console.error = Logger.orgConsole.error!;
            console.info = Logger.orgConsole.info!;
            console.log = Logger.orgConsole.log!;
            console.warn = Logger.orgConsole.warn!;
        }
    }

    /**
     * Exit the application, destroy with delay.
     */
    private static exit(): void {
        process.removeListener("exit", Logger.exit);
        setImmediate(() => {
            setImmediate(() => {
               Logger.destroy();
            });
        });
    }

    /**
     * Destroy the object. Close the file handler
     */
    private static destroy(): void {
        process.removeListener("uncaughtException", Logger.fatal);
        process.removeListener("unhandledRejection", Logger.fatal);
        process.removeListener("warning", Logger.warning);
        Logger.restoreConsoleFunctions();
        Logger.funcs = [];
        return;
    }
}
