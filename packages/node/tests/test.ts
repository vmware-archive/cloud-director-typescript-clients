import { CloudDirectorConfig, DefinedEntityApi, DefinedEntityTypeApi, DefinedInterfaceBehaviorsApi, AccessControlsApi } from '../src'
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