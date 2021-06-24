# [Unreleased]
-

# 0.0.2-alpha.6 (2021-06-24)
- Removed unnecessary parseHeaderHateoasLinks for etag headers in RequestHeadersInterceptor

# 0.0.2-alpha.5 (2021-06-23)
- Add cloud api authenticatication mechanism
- Fix RequestHeadersInterceptor not to overwrite `Authorization` request header if it was already set

# 0.0.2-alpha.4 (2021-06-10)
- Enable JWT in VcdApiClient
- Export vcd.transfer.client through the client index
