import {LogFunctionFunction, Severity} from "../Types";

/** Default log formatter. */
export function defaultFormat(severity: Severity, message: string, data?: any) {
    const date = (new Date()).toISOString().replace("T", " ").substr(0, 19);
    return `[${date}] ${severity} ${message}` + (data ? " " + JSON.stringify(data) : "");

}

/** Default log function */
export const defaultLog: LogFunctionFunction = () => (severity, message, data) => {
    process.stdout.write(defaultFormat(severity, message, data) + "\n");
};
