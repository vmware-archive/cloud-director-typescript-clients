import { LegacyApiClient } from './legacy.api.client'
import {CloudDirectorAuthentication} from "./auth";
import * as nock from "nock";
import {QueryResultOrgRecordType} from "@vcd/bindings/vcloud/api/rest/schema_v1_5";
import {AdminOrgType} from "@vcd/bindings/vcloud/api/rest/schema_v1_5/AdminOrgType";

describe('Legacy API client tests', () => {
    it('Makes a GET call', async () => {
        const id = '0fe62f82-13e8-4275-92f9-7ea0c25a3434';
        const sampleGetResponse = '{\n' +
            '    "_type" : "QueryResultOrgRecordType",\n' +
            '    "link" : [],\n' +
            '    "metadata" : null,\n' +
            '    "href" : "https://my.vcd.com/api/org/f8e44321-2471-46e4-9f70-b9cbc0a75aa1",\n' +
            `    "id" : "${id}",\n` +
            '    "type" : null,\n' +
            '    "otherAttributes" : {\n' +
            '      "numberOfRunningVMs" : "0",\n' +
            '      "site" : "https://my.vcd.com",\n' +
            '      "locationId" : "0fe62f82-13e8-4275-92f9-7ea0c25a3434@0fe62f82-13e8-4275-92f9-7ea0c25a3434",\n' +
            '      "siteName" : "my.vcd.com"\n' +
            '    },\n' +
            '    "canPublishCatalogs" : false,\n' +
            '    "deployedVMQuota" : 100,\n' +
            '    "displayName" : "test",\n' +
            '    "isEnabled" : true,\n' +
            '    "isReadOnly" : false,\n' +
            '    "name" : "test",\n' +
            '    "numberOfCatalogs" : 1,\n' +
            '    "numberOfDisks" : 0,\n' +
            '    "numberOfGroups" : 0,\n' +
            '    "numberOfVApps" : 2,\n' +
            '    "numberOfVdcs" : 1,\n' +
            '    "storedVMQuota" : 1000\n' +
            '  }';
        const path = '/api/query?type=organization';
        const client = getClient();
        const scope = nock('https://my.vcd.com', {
            reqheaders: {
                'Authorization': 'Bearer testKey',
            }
        }).get(path)
            .reply(200, sampleGetResponse);

        const org = await client.get<QueryResultOrgRecordType>(path);
        expect(org.id).toBe(id);
        expect(scope.isDone()).toBeTrue();
    });

    it('Makes a POST call', async () => {
        await createOrg();
    });
    it('Updates an existing entity', async () => {
        let createdOrg = await createOrg();
        createdOrg.name = 'new name';
        const expectedResponse = '{\n' +
            '    "_type" : "QueryResultOrgRecordType",\n' +
            '    "link" : [],\n' +
            '    "metadata" : null,\n' +
            '    "href" : "https://my.vcd.com/api/org/f8e44321-2471-46e4-9f70-b9cbc0a75aa1",\n' +
            `    "id" : "${createdOrg.id}",\n` +
            '    "type" : null,\n' +
            '    "otherAttributes" : {\n' +
            '      "numberOfRunningVMs" : "0",\n' +
            '      "site" : "https://my.vcd.com",\n' +
            '      "locationId" : "0fe62f82-13e8-4275-92f9-7ea0c25a3434@0fe62f82-13e8-4275-92f9-7ea0c25a3434",\n' +
            '      "siteName" : "my.vcd.com"\n' +
            '    },\n' +
            '    "canPublishCatalogs" : false,\n' +
            '    "deployedVMQuota" : 100,\n' +
            '    "displayName" : "test",\n' +
            '    "isEnabled" : true,\n' +
            '    "isReadOnly" : false,\n' +
            `    "name" : "${createdOrg.name}",\n` +
            '    "numberOfCatalogs" : 1,\n' +
            '    "numberOfDisks" : 0,\n' +
            '    "numberOfGroups" : 0,\n' +
            '    "numberOfVApps" : 2,\n' +
            '    "numberOfVdcs" : 1,\n' +
            '    "storedVMQuota" : 1000\n' +
            '  }';
        const updatePath: string = `/admin/org/${createdOrg.id}`

        const scope = nock('https://my.vcd.com', {
            reqheaders: {
                'Authorization': 'Bearer testKey',
            }
        }).put(updatePath)
            .reply(200, expectedResponse);

        const client = getClient();
        const updatedOrg = await client.put<AdminOrgType>(updatePath, createdOrg);
        expect(updatedOrg.name).toBe(createdOrg.name);
    });
    it('Deletes an exinsting entity', async () => {
        let createdOrg = await createOrg();
        const deletePath: string = `/admin/org/${createdOrg.id}`
        const scope = nock('https://my.vcd.com', {
            reqheaders: {
                'Authorization': 'Bearer testKey',
            }
        }).delete(deletePath)
            .reply(204);

        let legacyApiClient = getClient();
        await legacyApiClient.delete(deletePath);
        expect(scope.isDone()).toBeTrue();
    });
    it('Throws an exception if result is bigger than 400', async () => {
        const wrongPath: string = '/api/test';
        const scope = nock('https://my.vcd.com', {
            reqheaders: {
                'Authorization': 'Bearer testKey',
            }
        }).get(wrongPath)
            .reply(400);

        let legacyApiClient = getClient();
        await legacyApiClient.get(wrongPath).catch(error => {
            expect(error).toBe('Something went wrong. Status code: 400');
        });
    });

    async function createOrg(): Promise<QueryResultOrgRecordType> {
        const createReq: AdminOrgType = {
            name: 'testFromNodeClient',
            description: 'test',
            fullName: 'testFromNodeClient',
            isEnabled: true,
            settings: {}
        };

        const expectedResponse = '{\n' +
            '    "_type" : "QueryResultOrgRecordType",\n' +
            '    "link" : [],\n' +
            '    "metadata" : null,\n' +
            '    "href" : "https://my.vcd.com/api/org/f8e44321-2471-46e4-9f70-b9cbc0a75aa1",\n' +
            '    "id": "testid",\n' +
            '    "type" : null,\n' +
            '    "otherAttributes" : {\n' +
            '      "numberOfRunningVMs" : "0",\n' +
            '      "site" : "https://my.vcd.com",\n' +
            '      "locationId" : "0fe62f82-13e8-4275-92f9-7ea0c25a3434@0fe62f82-13e8-4275-92f9-7ea0c25a3434",\n' +
            '      "siteName" : "my.vcd.com"\n' +
            '    },\n' +
            '    "canPublishCatalogs" : false,\n' +
            '    "deployedVMQuota" : 100,\n' +
            `    "displayName" : "${createReq.fullName}",\n` +
            `    "isEnabled" : "${createReq.isEnabled}",\n` +
            '    "isReadOnly" : false,\n' +
            `    "name" : "${createReq.name}",\n` +
            '    "numberOfCatalogs" : 1,\n' +
            '    "numberOfDisks" : 0,\n' +
            '    "numberOfGroups" : 0,\n' +
            '    "numberOfVApps" : 2,\n' +
            '    "numberOfVdcs" : 1,\n' +
            '    "storedVMQuota" : 1000\n' +
            '  }';
        const path = '/api/admin/orgs';
        const client = getClient();

        const scope = nock('https://my.vcd.com', {
            reqheaders: {
                'Authorization': 'Bearer testKey',
            }
        }).post(path)
            .reply(200, expectedResponse);

        const adminOrgType = await client.post<QueryResultOrgRecordType>(path, createReq);
        expect(adminOrgType.name).toBe(createReq.name);
        expect(adminOrgType.displayName).toBe(createReq.fullName);
        return adminOrgType;
    }

    function getClient(): LegacyApiClient {
        return new LegacyApiClient('https://my.vcd.com',
            new CloudDirectorAuthentication('test', 'testOrg', 'testKey'),
            false);
    }
})