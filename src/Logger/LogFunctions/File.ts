import * as FS from "fs";
import {LogFunctionFunction} from "../Types";
import {defaultFormat} from "./Default";

/** Default log function */
export const fileLog: LogFunctionFunction = (file: string) => {
    return (severity, message, data) => {
        FS.appendFileSync(file, defaultFormat(severity, message, data) + "\n");
    };
};
