import { } from 'jasmine';
import * as fs from 'fs';
import { Readable }  from "stream"
import * as nock from 'nock';
import { TransferClient } from './transfer';

describe('Transfer Client tests', () => {
    it('Uploads a file', async () => {
        const path = "/test/file/path";
        const contentType = "application/zip";
        var readable = new Readable() as fs.ReadStream
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
        const client = new TransferClient("https://www.example.com/transfer/url", "testKey")
        await client.upload(path, contentType)
        expect(scope.isDone()).toBeTrue()
    });
})