import * as https from 'https';
import { VCloudExtensibleType } from '@vcd/bindings/vcloud/api/rest/schema_v1_5';
import {CloudDirectorAuthentication} from "./auth";

export class LegacyApiClient {

    private readonly basePath: string;

    constructor(basePath: string,
                private cloudDirectorAuthentication: CloudDirectorAuthentication,
                private rejectUnauthorized: boolean) {
        this.basePath = new URL(basePath).host;
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
                if (res.statusCode < 200 || res.statusCode > 299) {
                    res.on('data', e => console.error(e));
                    reject('Something went wrong. Status code: ' + res.statusCode);
                }

                res.setEncoding('UTF8');
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        // empty body, usually result of a delete operation
                        if (data === '') {
                            resolve();
                        }
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
        requestOptions.headers['accept'] = 'application/*+json;version=35.0';
        return requestOptions;
    }
}