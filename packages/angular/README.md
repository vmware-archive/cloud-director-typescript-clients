> **ATTENTION:** This repository soon will be Archived, please refer to our new central point repository for Cloud Director Extensibility [Cloud Director Extension Standard Library](https://github.com/vmware/cloud-director-extension-standard-library)

### Usage examples ###
#### Authenticating ####
If you don't have an existing session, you can create one:
```js
ngOnInit(): void {
this.client.login('username', 'org', 'pa$$w0rd').subscribe(() => {
console.log(`logged into ${this.client.organization} as ${this.client.username}`);
});
```

If you already have an existing session (because you're acting as a UI extension and have access to the authentication token for example) you can simply set the authentication of the client instance to use the Bearer token:
```js
ngOnInit(): void {
this.client.setAuthentication(bearerToken).subscribe(() => {
console.log(`logged into ${this.client.organization} as ${this.client.username}`);
});
```

#### Querying the API ####
The query builder can be used to quickly create API calls that are compatible with the query service:
```js
this.client.query(Query.Builder.ofType('virtualCenter'))).pipe(

tap(queryResult  =>  console.log(`Virtual centers: ${queryResult.total}`))

).subscribe();
```