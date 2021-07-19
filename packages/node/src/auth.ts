import * as api from './api';

export abstract class CloudDirectorDefaultHeaders implements api.Authentication {

    protected actAsId: string;

    constructor(
        public username: string,
        public org: string,
        public authorizationKey?: string
    ) { }

    applyToRequest(requestOptions: any): void {
        requestOptions.headers['accept'] = 'application/json;version=35.0';
        requestOptions.strictSSL = false;
        if (this.actAsId) {
            requestOptions.headers['x-vmware-vcloud-tenant-context'] = this.actAsId;
        }
    }

    actAs(id: string){
        this.actAsId = id;
    }

    abstract clone(): CloudDirectorDefaultHeaders
}

export class BasicAuth extends CloudDirectorDefaultHeaders {
    constructor(
        username: string,
        org: string,
        private password: string
    ) { 
        super(username, org, null);
    }

    applyToRequest(requestOptions: any): void {
        super.applyToRequest(requestOptions)
        const authString = `${this.username}@${this.org}:${this.password}`;
        requestOptions.headers["Authorization"] = `Basic ${Buffer.from(authString).toString('base64')}`;
    }

    clone(): CloudDirectorDefaultHeaders {
        let result = new BasicAuth(this.username, this.org, this.password)
        result.actAs(this.actAsId);
        return result;
    }
}

export class CloudDirectorAuthentication extends CloudDirectorDefaultHeaders {
    constructor(
        username: string,
        org: string,
        authorizationKey: string
    ) { 
        super(username, org, authorizationKey)
    }

    applyToRequest(requestOptions: any): void {
        super.applyToRequest(requestOptions)
        requestOptions.headers["Authorization"] = `Bearer ${this.authorizationKey}`;
    }

    clone(): CloudDirectorDefaultHeaders {
        let result = new CloudDirectorAuthentication(this.username, this.org, this.authorizationKey)
        result.actAs(this.actAsId);
        return result;
    }
}