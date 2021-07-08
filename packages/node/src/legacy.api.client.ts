import * as https from 'https';
import { CloudDirectorAuthentication } from './auth';
import { VCloudExtensibleType } from '@vcd/bindings/vcloud/api/rest/schema_v1_5';


export class LegacyApiClient {

    private readonly doubleSlash = '//';
    private readonly basePath: string;

    constructor(basePath: string,
                private cloudDirectorAuthentication: CloudDirectorAuthentication,
                private rejectUnauthorized: boolean) {
        // remove the http protocol
        let path: string;
        if (basePath.startsWith('http')) {
            path = basePath.substr(basePath.indexOf(this.doubleSlash) + this.doubleSlash.length);
        }

        // remove the /cloudApi suffix
        if (path.indexOf('/cloudapi') >=0) {
            path = path.substr(0, path.indexOf('/cloudapi'));
        }

        this.basePath = path;
    }

    public get<T extends VCloudExtensibleType>(path: string): Promise<T> {
        const requestOptions = this.generateRequestOptions('GET', path);
        return this.send<T>(requestOptions);
    }

    public post<T extends VCloudExtensibleType>(path: string, body: any): Promise<T> {
        const requestOptions = this.generateRequestOptions('POST', path);
        return this.send<T>(requestOptions, body);
    }

    public put<T extends VCloudExtensibleType>(path: string, body: any): Promise<T> {
        const requestOptions = this.generateRequestOptions('PUT', path);
        return this.send<T>(requestOptions, body);
    }

    public delete(path: string): Promise<any> {
        const requestOptions = this.generateRequestOptions('DELETE', path);
        return this.send(requestOptions);
    }

    private send<T extends VCloudExtensibleType>(requestOptions: any, body?: any) : Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const clientRequest = https.request(requestOptions, res => {
                res.setEncoding('UTF8');
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData: T = JSON.parse(data);
                        resolve(parsedData);
                    } catch (e) {
                        reject(e.message);
                    }
                });

            }).on('error', err => {
                reject(err.message);
            });

            if (body) {
                clientRequest.write(JSON.stringify(body));
            }

            clientRequest.end()
        });
    }

    private generateRequestOptions(method: string, path: string) {
        const headers = {
            'Content-Type': 'application/*+json'
        };

        const requestOptions = {
            host: this.basePath,
            port: '443',
            path: path,
            method: method,
            headers: headers,
            rejectUnauthorized: this.rejectUnauthorized
        };

        this.cloudDirectorAuthentication.applyToRequest(requestOptions);
        requestOptions.headers['Accept'] = 'application/*+json;version=35.0';
        return requestOptions;
    }

}