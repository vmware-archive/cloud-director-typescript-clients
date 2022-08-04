# [Unreleased]

# 0.0.2-alpha.9 (2022-08-01)
- VcdApiClient can work with absolute URLs
- VcdApiClient CRUD operations accept custom request HEADERS

# 0.0.2-alpha.8 (2022-07-22)
Problem:
- API versions '32.0', '31.0', '30.0' are deleted for VCD 10.4
- API versions '37.0', '36.3', '36.2', '36.1', '36.0' are supported in 10.4

Fix:
Remove deleted and add missing supported API versions in the vcd API client.

# 0.0.2-alpha.6 (2021-06-24)
- Removed unnecessary parseHeaderHateoasLinks for etag headers in RequestHeadersInterceptor

# 0.0.2-alpha.5 (2021-06-23)
- Add cloud api authenticatication mechanism
- Fix RequestHeadersInterceptor not to overwrite `Authorization` request header if it was already set

# 0.0.2-alpha.4 (2021-06-10)
- Enable JWT in VcdApiClient
- Export vcd.transfer.client through the client index
