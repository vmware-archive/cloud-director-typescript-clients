import * as fs from "fs";
import * as path from "path";
import * as debug from 'debug';
import * as api from './api';
import { BasicAuth, CloudDirectorAuthentication } from './auth';
import * as mqtt from "mqtt";
import * as tls from 'tls';
import * as WS from 'ws';
import { TransferClient } from "./transfer";


const log = debug('vcd:api-client')

export interface ApiType {
    setDefaultAuthentication(config: api.Authentication): void;
}

type ApiConstructor<T extends ApiType> = new (basePath: string) => T;

const DEFAULT_CONFIG_LOCATION = path.join(findHomeDir(), '.vcd', 'config')

const loadConfig = (fileName: string) => {
    if (fs.existsSync(fileName)) {
        const fileContent = fs.readFileSync(fileName).toString();
        const config = JSON.parse(fileContent);
        return config
    }
    return null
}

const readConfig = (fileLocation?: string) => {
    fileLocation = fileLocation || DEFAULT_CONFIG_LOCATION
    const dirName = path.dirname(fileLocation)
    if (!fs.existsSync(dirName)) {
        log(`Config location doesn't exists. Creating: ${dirName}`)
        fs.mkdirSync(dirName)
    }
    return loadConfig(fileLocation) || {}
}

const updateConfig = (configMutation: (config: any) => void, fileLocation?: string) => {
    fileLocation = fileLocation || DEFAULT_CONFIG_LOCATION
    const config = readConfig(fileLocation)
    configMutation(config)
    fs.writeFileSync(fileLocation, JSON.stringify(config))
}



function findHomeDir(): string | null {
    if (process.env.HOME) {
        try {
            fs.accessSync(process.env.HOME);
            return process.env.HOME;
            // tslint:disable-next-line:no-empty
        } catch (ignore) { }
    }
    if (process.platform !== 'win32') {
        return null;
    }
    if (process.env.HOMEDRIVE && process.env.HOMEPATH) {
        const dir = path.join(process.env.HOMEDRIVE, process.env.HOMEPATH);
        try {
            fs.accessSync(dir);
            return dir;
            // tslint:disable-next-line:no-empty
        } catch (ignore) { }
    }
    if (process.env.USERPROFILE) {
        try {
            fs.accessSync(process.env.USERPROFILE);
            return process.env.USERPROFILE;
            // tslint:disable-next-line:no-empty
        } catch (ignore) { }
    }
    return null;
}

export interface ConnectionAuth {
    authorized: boolean;
    authorizationError?: string;
    certificate?: any;
}
export class CloudDirectorConfig {
    private constructor(
        public basePath: string,
        public connectionAuth: ConnectionAuth,
        private authentication: api.Authentication
    ) { }

    public get token(): string {
        return this.authentication['authorizationKey'];
    }

    public makeApiClient<T extends ApiType>(apiClientType: ApiConstructor<T>) {
        if (!this.connectionAuth.authorized) {
            throw new Error("Connection not authorized, please login again and accept and auth errors.");
        }
        const apiClient = new apiClientType(this.basePath);
        apiClient.setDefaultAuthentication(this.authentication);

        return apiClient;
    }

    public makeTransferClient(url: string) {
        if (!this.connectionAuth.authorized) {
            throw new Error("Connection not authorized, please login again and accept and auth errors.");
        }
        return new TransferClient(url, this.authentication['authorizationKey'], false);
    }

    public makeMQTTClient(onConnect: (client: mqtt.MqttClient) => void) {
        if (!this.connectionAuth.authorized) {
            throw new Error("Connection not authorized, please login again and accept and auth errors.");
        }
        const url = new URL(this.basePath);
        const urlString = `wss://${url.host}/messaging/mqtt`;
        const socket = new WS(urlString, ['mqtt'], { rejectUnauthorized: false })
        socket.binaryType = 'arraybuffer'
        socket.onopen = () => {
            const client = mqtt.connect(
                urlString,
                {
                    transformWsUrl: () => socket,
                    username: `${this.authentication['username']}@${this.authentication['org']}`,
                    password: this.authentication['authorizationKey'],
                    clientId: "js_mqtt_" + Math.random().toString(16).substr(2, 8),
                    rejectUnauthorized: false
                });
            client.on('error', (e) => console.error(e))
            client.on('connect', onConnect.bind(null, client))
        }
    }

    public saveConfig(alias: string, fileLocation?: string): void {
        updateConfig((config) => {
            config[alias] = {
                basePath: this.basePath,
                authorized: this.connectionAuth.authorized,
                username: this.authentication['username'],
                org: this.authentication['org'],
                authorizationKey: this.authentication['authorizationKey']
            }
            config.current = alias
        }, fileLocation)
    }

    static getConfigurations(fileLocation?: string) {
        const config = readConfig(fileLocation);
        return {
            current: config.current,
            configurations: Object.keys(config)
                .filter(key => key !== 'current')
                .map(key => {
                    return {
                        key,
                        basePath: config[key].basePath,
                        username: config[key].username,
                        org: config[key].org || 'System'
                    }
                })
        }
    }

    static use(alias: string, fileLocation?: string): void {
        updateConfig((config) => { config.current = alias }, fileLocation)
    }

    static async withUsernameAndPassword(basePath: string, username: string, org: string, password: string): Promise<CloudDirectorConfig> {
        const tmp = new CloudDirectorConfig(basePath, { authorized: true }, new BasicAuth(username, org, password))
        const sessionsApi: api.SessionsApi = tmp.makeApiClient(api.SessionsApi)
        let sessionResponse = null
        try {
            if ("system" === org.toLowerCase()) {
                sessionResponse = await sessionsApi.providerLogin("")
            } else {
                sessionResponse = await sessionsApi.login("")
            }
        } catch (e) {
            log(e)
            throw new Error('Error logging in: ' + e.body.message);
        }
        let certificate = null;
        if (!sessionResponse.response.socket.authorized) {
            certificate = await new Promise<any>((resolve, reject) => {
                const urlObj = new URL(basePath);
                const port = Number(urlObj.port) > 0 ? Number(urlObj.port) : 443;
                const tlsSocket = tls.connect(port, urlObj.hostname, { rejectUnauthorized: false });
                tlsSocket.on("secureConnect", () => resolve(tlsSocket.getPeerCertificate(false)));
            })
        }
        const authorizationKey = <string>sessionResponse.response.headers['x-vmware-vcloud-access-token']
        return new CloudDirectorConfig(
            basePath,
            {
                authorized: sessionResponse.response.socket.authorized,
                authorizationError: sessionResponse.response.socket.authorizationError,
                certificate
            },
            new CloudDirectorAuthentication(username, org, authorizationKey))
    }

    static fromDefault(): CloudDirectorConfig {
        return this.fromFile(DEFAULT_CONFIG_LOCATION)
    }

    static fromFile(fileName: string): CloudDirectorConfig {
        const config = loadConfig(fileName)
        if (config) {
            const current = config[config.current]
            return this.fromParams(current.basePath, {
                authorized: current.authorized !== undefined ? current.authorized : false,
            }, current.username, current.org, current.authorizationKey)
        }
        throw new Error(`Config file missing at ${fileName}. Try logging in first.`)
    }

    static fromParams(basePath: string, connectionAuth: ConnectionAuth, username: string, org: string, authorizationKey: string): CloudDirectorConfig {
        return new CloudDirectorConfig(basePath, connectionAuth, new CloudDirectorAuthentication(username, org, authorizationKey))
    }
}
