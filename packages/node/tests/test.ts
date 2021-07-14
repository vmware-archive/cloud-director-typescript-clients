import { CloudDirectorConfig, DefinedEntityApi, DefinedEntityTypeApi, DefinedInterfaceBehaviorsApi, AccessControlsApi } from '../src'
import {UserApi} from "../lib";
import { AdminOrgType } from "@vcd/bindings/vcloud/api/rest/schema_v1_5/AdminOrgType";
const apiConfig = CloudDirectorConfig.fromDefault()

const deApi: DefinedEntityApi = apiConfig.makeApiClient(DefinedEntityApi)
const behApi: DefinedInterfaceBehaviorsApi = apiConfig.makeApiClient(DefinedInterfaceBehaviorsApi)
const detApi: DefinedEntityTypeApi = apiConfig.makeApiClient(DefinedEntityTypeApi)
const aclApi: AccessControlsApi = apiConfig.makeApiClient(AccessControlsApi)
const SCALE_GROUP_VERSION: string = '1.0.0';


export async function types() {
    const resp = await detApi.getDefinedEntityTypes(1, 100)
    resp.body.values.forEach(de => {
        console.log(JSON.stringify(de))
    })
}

export function subscribe(topic: string) {
    apiConfig.makeMQTTClient((client) => {
        console.log("connected")
        client.on('message', (t, message) => {console.log(`${t}: ${message}`)})
        client.subscribe(topic)
    })
}

export function getUsersFromTenant() {
    let actAsApiConfig = apiConfig.actAs('63d98607-9362-4c24-b3ca-bb004da22487');
    let userApi = actAsApiConfig.makeApiClient(UserApi);
    userApi.queryUsers(1,10)
        .then(value => console.log(value.body))
        .catch(console.error);
}

export async function createOrg() {
    const legacyApiClient = apiConfig.makeLegacyApiClient();
    const orgType: AdminOrgType = {
        name: 'testFromNodeClie3nt',
        description: 'test',
        fullName: 'testFromNode3Client',
        isEnabled: true,
        settings: {}
    };

    const org = await legacyApiClient.post<AdminOrgType>('/api/admin/orgs', orgType);
    console.log(org);
}