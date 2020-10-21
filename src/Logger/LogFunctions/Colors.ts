import {LogFunctionFunction, Severity} from "../Types";
import {defaultFormat} from "./Default";

const colors: {[K in Severity]: string} = {
    [Severity.DEBUG]: "32",
    [Severity.INFO]: "34",
    [Severity.WARNING]: "33",
    [Severity.ERROR]: "31",
    [Severity.FATAL]: "35",
};

/** Colors log function */
export const colorsLog: LogFunctionFunction = () => (severity, message, data) => {
    process.stdout.write("\x1b[" + colors[severity] + "m" + defaultFormat(severity, message, data) + "\x1b[0m" + "\n");
};
