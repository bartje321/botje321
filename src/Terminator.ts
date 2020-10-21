/**
 * Compare 2 arrays.
 * @param {any[]} a First array
 * @param {any[]} b Second array.
 * @return {boolean} True if they are the same.
 */
function compareArray(a: any[], b: any[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Remova an element from an array.
 * @param {any[]} a The array.
 * @param v The element to remove
 */
function removeFromArray(a: any[], v: any) {
    const index = a.indexOf(v);
    if (index !== -1) {
        a.splice(index, 1);
    }
}

/**
 * Class for keeping tack of functions to call on closing and running those functions.
 */
export abstract class Terminator {

    /** Array of functions to run on close. */
    private static readonly functions: Array<() => void> = [];

    /** Timer to use for exit debugging */
    private static timerId?: NodeJS.Timer;

    /** Last requests */
    private static lastRequests: Array<{}> = [];

    /** Last handles */
    private static lastHandles: Array<{}> = [];

    /** Timeout for force shutdown in milliseconds */
    private static timeout: number = 60000;

    /**
     * Add a function to the closer.
     * @param {() => void} func
     */
    public static add(func: () => void) {
        Terminator.functions.push(func);
    }

    /**
     * Remove a function from the closer.
     * @param {() => void} func
     */
    public static remove(func: () => void) {
        removeFromArray(Terminator.functions, func);
    }

    /**
     * Set the force exit timeout.
     * @param {number} timeout The timeout in milliseconds.
     */
    public static setTimeout(timeout: number): void {
        Terminator.timeout = timeout;
    }

    /**
     * Run the closer and close all functions.
     */
    public static run(): void {
        if (!Terminator.functions) {
            // Already ran
            return;
        }
        // tslint:disable-next-line
        console.info("Closing application");
        process.removeListener("exit", Terminator.run);
        process.removeListener("SIGTERM", Terminator.run);
        process.removeListener("SIGINT", Terminator.run);
        let func;
        while (func = Terminator.functions.shift()) {
            func();
        }
        (Terminator.functions as any) = undefined;
        process.emit("exit", process.exitCode || 0);

        setTimeout(Terminator.abort, Terminator.timeout).unref();
        Terminator.timerId = setTimeout(Terminator.waitTillClosed, 200);
        Terminator.timerId.unref();
    }

    /**
     * Hard terminate the process.
     */
    private static abort() {
        process.abort();
    }

    /**
     * Wait till closed and run debug
     */
    private static waitTillClosed(): void {
        if (Terminator.timerId) {
            clearTimeout(Terminator.timerId);
        }
        const requests = ((process as any)._getActiveRequests() as any[]).slice();
        const handles = ((process as any)._getActiveHandles() as any[]).slice();

        removeFromArray(handles, process.stdin);
        removeFromArray(handles, process.stderr);
        removeFromArray(handles, process.stdout);

        if (requests.length + handles.length) {
            if (!compareArray(requests, Terminator.lastRequests)
                || !compareArray(handles, Terminator.lastHandles)
            ) {
                // tslint:disable-next-line
                console.log(`Waiting on open requests: ${requests.length} and handles: ${handles.length}`);
                for (const request of requests) {
                    // tslint:disable-next-line
                    console.debug(request);
                }
                for (const handle of handles) {
                    if (handle && handle._list) {
                        const first = handle._list as any;
                        let next = first;
                        while ((next = next._idleNext) !== first) {
                            // tslint:disable-next-line
                            console.debug(`Timeout ${next._idleTimeout} ${next._onTimeout.toString()}`);
                        }
                        continue;
                    }
                    // tslint:disable-next-line
                    console.debug((handle as any));
                }
            }

            Terminator.lastRequests = requests;
            Terminator.lastHandles = handles;

            Terminator.timerId = setTimeout(Terminator.waitTillClosed, 250);
            Terminator.timerId.unref();
        }
    }
}

process.on("exit", Terminator.run);
process.on("SIGTERM", Terminator.run);
process.on("SIGINT", Terminator.run);
