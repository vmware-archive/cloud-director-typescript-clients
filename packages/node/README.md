# VMware Cloud Director Client bindings for NodeJS

> **ATTENTION:** This repository soon will be Archived, please refer to our new central point repository for Cloud Director Extensibility [Cloud Director Extension Standard Library](https://github.com/vmware/cloud-director-extension-standard-library)

The Javascript clients for VMware Cloud Director is implemented in
[typescript](https://typescriptlang.org), but can be called from either
Javascript or Typescript.

The client is implemented for server-side use with node
using the `request` library.

# Installation

```console
npm install @vcd/node-client
```

# Example code

## Login and save configuration

```typescript
import * as vcd from '@vcd/node-client'

const vcdConfig = new vcd.CloudDirectorConfig();
const config = await vcd.CloudDirectorConfig.withUsernameAndPassword(
    "https://<host>[:<port>]/cloudapi",
    "myusername",
    "System", // for Provider login use System as organization name
    "myfakepassword"
)
config.saveConfig("alias")

```

## List all orgs

```typescript
import * as vcd from '@vcd/node-client'

const vcdConfig = CloudDirectorConfig.fromDefault()

const orgApi: vcd.OrgApi = vcdConfig.makeApiClient(vcd.OrgApi)

orgApi.queryOrgs(1, 128).then((res) => {
    console.log(res.body);
});
```
