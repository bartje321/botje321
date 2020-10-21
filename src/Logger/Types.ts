/** Different severities. */
export const enum Severity {
    /** DEBUG. */
    DEBUG = "DEBUG",
    /** INFO. */
    INFO = "INFO",
    /** WARNING. */
    WARNING = "WARNING",
    /** ERROR. */
    ERROR = "ERROR",
    /** FATAL. */
    FATAL = "FATAL",
}

/** The available log value types. */
export type LogType = any | (() => any);

/** The available logoptions. */
export interface LogOptions {
    /** Override the default concole functions. Default true */
    overrideConsole?: boolean;
    /** Handle uncought exceptions. Default true */
    exceptionHandler?: boolean;
}

/** The log function project. */
export type LogFunctionFunction = (...args: any[]) => LogFunction;

/** The log function project. */
export type LogFunction = (severity: Severity, message: string, data?: any, error?: Error) => void | string;
