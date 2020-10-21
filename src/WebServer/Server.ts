import * as Express from "express";
import * as BodyParser from "body-parser";
import * as Http from "http";
import {Logger} from "Logger/Logger";

/**
 * Interface for server modules.
 */
export interface Module {
    apply: (app: Express.Express) => void;
    destroy?: () => void;
}

/**
 * Express server.
 */
export class Server {

    /** Reference to the express server. */
    private readonly server: Http.Server;

    /**
     * Create a new server.
     * @param port The port.
     * @param secure True to use ssh
     * @param modules The modules to use.
     */
    public constructor(port: number, secure: boolean, private readonly modules: Module[]) {
        const app = Express();
        app.use(BodyParser.json());
        app.use(this.log.bind(this));

        for (const module of modules) {
            module.apply(app);
        }

        app.use(this.defaultHandler.bind(this, undefined));
        app.use(this.defaultHandler.bind(this));
        Logger.info("Server #" + port + " starting up.");
        this.server = Http.createServer(app).listen(port, () => {
            Logger.info("Server #" + port + " ready for connections.");
        });
    }

    /**
     * Close the server.
     */
    public destroy() {
        this.server.close();
        this.modules.destroy();
    }

    /**
     * Log the request.
     * @param {Express.Request} req Request object.
     * @param {Express.Response} res Response object.
     * @param {Express.NextFunction} next Next function.
     */
    private log(req: Express.Request, res: Express.Response, next: Express.NextFunction): void {
        Logger.debug([
            (req.header("x-forwarded-for") || req.ip),
            req.url,
            JSON.stringify(req.body)
        ].join(" "));
        next();

    }

    /**
     * Api call not found.
     * @param err The error.
     * @param req Request object.
     * @param res Response object.
     * @param next Next function.
     */
    private defaultHandler(err: Error | undefined, req: Express.Request, res: Express.Response, next: Express.NextFunction): void {
        if (err) {
            Logger.error(err);
        }
        res.sendStatus(err ? 500 : 404).end();
    }
}
