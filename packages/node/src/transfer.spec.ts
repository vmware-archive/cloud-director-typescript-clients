import * as fs from 'fs';
import { Readable }  from "stream"
import * as nock from 'nock';
import { TransferClient } from './transfer';
import {CloudDirectorAuthentication} from './auth';

describe('Transfer Client tests', () => {
    it('Uploads a file', async () => {
        const path = "/test/file/path";
        const contentType = "application/zip";
        let readable = new Readable() as fs.ReadStream
        readable.path = path
        readable.push('beep')    // the string you want
        readable.push(null)
        spyOn(fs, 'createReadStream').and.returnValue(readable)
        const scope = nock('https://www.example.com', {
            reqheaders: {
                'authorization': 'Bearer testKey',
                'Content-Type': contentType,
            }
        })
            .put('/transfer/url')
            .reply(200)
        const auth = new CloudDirectorAuthentication('username', 'org', 'testKey');
        const client = new TransferClient(auth)
        await client.upload("https://www.example.com/transfer/url", path, contentType)
        expect(scope.isDone()).toBeTrue()
    });
})