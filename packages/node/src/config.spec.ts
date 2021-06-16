import { } from 'jasmine';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as nock from 'nock';
import { CloudDirectorConfig } from './config';
import { AccessControlsApi } from './api';

describe('Config Tests', () => {
    it('Throws an error if config is not initialized', () => {
        spyOn(fs, 'existsSync').and.returnValue(false)
        const readConfigSpy = spyOn(fs, 'readFileSync');
        expect(() => CloudDirectorConfig.fromDefault()).toThrow();
        expect(readConfigSpy).not.toHaveBeenCalled()
    });
    it('Can created config from default location', () => {
        spyOn(fs, 'existsSync').and.returnValue(true)
        spyOn(jwt, 'decode').and.returnValue({exp: new Date(3000, 4).getTime() / 1000})
        const readConfigSpy = spyOn(fs, 'readFileSync').and.returnValue(`{
            "current": "test",
            "test": {
                "basePath": "https://mock.host.com/cloudapi",
                "authorized":true,
                "username": "administrator",
                "org": "System",
                "authorizationKey": "testKey"
            }
        }`);
        CloudDirectorConfig.fromDefault();
        expect(readConfigSpy).toHaveBeenCalled()
    });
    it('Can created config from params and saves the config', () => {
        spyOn(fs, 'existsSync').and.returnValues(true, false)
        const writeConfigSpy = spyOn(fs, 'writeFileSync')
        const config = CloudDirectorConfig.fromParams('http://www.example.com',
            { authorized: true },
            'administrator',
            "system",
            "testKey")
        config.saveConfig('test', '/test/file/location')
        expect(writeConfigSpy).toHaveBeenCalledWith('/test/file/location', JSON.stringify({
            "test": {
                "basePath": "http://www.example.com",
                "authorized": true,
                "username": "administrator",
                "org": "system",
                "authorizationKey": "testKey"
            },
            "current": "test"
        }))
    });
    it('Can update current config', () => {
        spyOn(fs, 'existsSync').and.returnValues(true, false)
        const writeConfigSpy = spyOn(fs, 'writeFileSync')
        CloudDirectorConfig.use('testNew', '/test/file/location')
        expect(writeConfigSpy).toHaveBeenCalledWith('/test/file/location', JSON.stringify({
            "current": "testNew"
        }))
    });
    it('Throws when client is unauthorized', async () => {
        const config = CloudDirectorConfig.fromParams('http://www.example.com',
            { authorized: false },
            'administrator',
            "system",
            "testKey")
        expect(() => {
            const client = config.makeApiClient(AccessControlsApi)
        }).toThrow();
    });
    it('Can create authenticated client', async () => {
        const scope = nock('http://www.example.com', {
            reqheaders: {
                'authorization': 'Bearer testKey'
            }
        })
            .post('/1.0.0/entities/test/accessControls')
            .reply(200, { id: '123ABC' })
        const config = CloudDirectorConfig.fromParams('http://www.example.com',
            { authorized: true },
            'administrator',
            "system",
            "testKey")
        const client = config.makeApiClient(AccessControlsApi)
        await client.createEntityAccessControlGrant("test", { accessLevelId: "", grantType: "", id: "", objectId: "test" })
        expect(scope.isDone()).toBeTrue()
    });
    it('create config with username and password provider login', async () => {
        const scope = nock('http://www.example.com', {
            reqheaders: {
                'authorization': 'Basic YWRtaW5pc3RyYXRvckBzeXN0ZW06cGFzcw=='
            }
        })
            .post('/1.0.0/sessions/provider')
            .reply(200, { id: '123ABC' })
        await CloudDirectorConfig.withUsernameAndPassword(
            'http://www.example.com',
            'administrator',
            "system",
            "pass")
        expect(scope.isDone()).toBeTrue()
    });
    it('create config with username and password provider login uppercase', async () => {
        const scope = nock('http://www.example.com', {
            reqheaders: {
                'authorization': 'Basic YWRtaW5pc3RyYXRvckBTWVNURU06cGFzcw=='
            }
        })
            .post('/1.0.0/sessions/provider')
            .reply(200, { id: '123ABC' })
        await CloudDirectorConfig.withUsernameAndPassword(
            'http://www.example.com',
            'administrator',
            "SYSTEM",
            "pass")
        expect(scope.isDone()).toBeTrue()
    });
    it('create config with username and password tenant login', async () => {
        const scope = nock('http://www.example.com', {
            reqheaders: {
                'authorization': 'Basic YWRtaW5pc3RyYXRvckB0ZXN0b3JnOnBhc3M='
            }
        })
            .post('/1.0.0/sessions')
            .reply(200, { id: '123ABC' })
        await CloudDirectorConfig.withUsernameAndPassword(
            'http://www.example.com',
            'administrator',
            "testorg",
            "pass")
        expect(scope.isDone()).toBeTrue()
    });
})