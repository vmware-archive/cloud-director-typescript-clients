import * as fs from 'fs';
import * as https from 'https';
import * as debug from 'debug';
import { URL } from 'url';
import {CloudDirectorDefaultHeaders} from './auth';

const log = debug('vcd:api-client:transfer')

export class TransferClient {
    constructor(
        private authentication: CloudDirectorDefaultHeaders,
        private rejectUnauthorized: boolean = true) {
    }

    public async upload(url: string, filePath: string, contentType: string) {
        const urlObj = new URL(url);

        const options: https.RequestOptions = {
            protocol: urlObj.protocol,
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            rejectUnauthorized: this.rejectUnauthorized,
            method: "PUT",
            headers: {
                'Content-Type': contentType,
                Authorization: `Bearer ${this.authentication.authorizationKey}`
            }
        }

        if (this.authentication.getActAsId()) {
            options.headers['x-vmware-vcloud-tenant-context'] = this.authentication.getActAsId();
        }

        log('Sending request with options: ', options)
        return new Promise<any>((resolve, reject) => {
            const req = https.request(options, (res) => {
                if (res.statusCode < 200 || res.statusCode > 299) {
                    log(`received http error response: ${res}`)
                    reject({ res, body: null });
                }
                const chunks = [];
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                res.on('end', () => {
                    const body = Buffer.concat(chunks);
                    log(`received response: ${body.toString()}`)
                    resolve({ res, body })
                });
            });
            req.on('error', (e) => {
                log(`problem with request: ${e.message}`);
                reject(e)
            });
            const data = fs.createReadStream(filePath);
            data.on('close', function () {
                req.end();
            });
            data.pipe(req);
        })
    }
}