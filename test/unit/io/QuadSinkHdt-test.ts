import * as fs from 'fs/promises';
import * as readline from 'readline';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { QuadSinkHdt } from '../../../lib/io/QuadSinkHdt';
import { pullHdtCppDockerImage, convertToHdt } from '../../../lib/io/rfdhdtDockerUtil';

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');
jest.mock('readline');
jest.mock('../../../lib/io/rfdhdtDockerUtil');
jest.mock('fs/promises');

describe('QuadSinkHdt', () => {
  let sink: QuadSinkHdt;
  let quad: RDF.Quad;
  let writeStream: any;
  let fileWriter: any;

  let spyStdoutWrite: any;
  let spyClearLine: any;
  let spyCursorTo: any;

  describe('push', () => {
    beforeEach(() => {
      spyStdoutWrite = jest.spyOn(process.stdout, 'write');
      spyClearLine = jest.spyOn(readline, 'clearLine');
      spyCursorTo = jest.spyOn(readline, 'cursorTo');

      sink = new QuadSinkHdt({
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
      });
      quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));

      writeStream = {
        write: jest.fn(),
      };
      fileWriter = {
        getWriteStream: jest.fn(() => writeStream),
        close: jest.fn(),
      };
      (<any>sink).fileWriter = fileWriter;
    });

    it('should write a quad to an IRI available in the mapping', async() => {
      await sink.push('http://example.org/1/file.ttl', quad);
      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(1, '/path/to/folder1/file.ttl', 'application/n-quads');
      expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      expect((<any>sink).files).toStrictEqual([ '/path/to/folder1/file.ttl' ]);
    });

    it('should escape illegal directory names', async() => {
      await sink.push('http://example.org/1/file:3000.ttl', quad);
      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(1, '/path/to/folder1/file_3000.ttl', 'application/n-quads');
      expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      expect((<any>sink).files).toStrictEqual([ '/path/to/folder1/file_3000.ttl' ]);
    });

    it('should write a quad to an IRI available in the mapping without extension without fileExtension', async() => {
      await sink.push('http://example.org/1/file', quad);
      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(1, '/path/to/folder1/file', 'application/n-quads');
      expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      expect((<any>sink).files).toStrictEqual([ '/path/to/folder1/file' ]);
    });

    it('should write a quad to an IRI available in the mapping without extension with fileExtension', async() => {
      sink = new QuadSinkHdt({
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
        fileExtension: '$.nq',
      });
      (<any>sink).fileWriter = fileWriter;

      await sink.push('http://example.org/1/file', quad);
      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(1, '/path/to/folder1/file$.nq', 'application/n-quads');
      expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      expect((<any>sink).files).toStrictEqual([ '/path/to/folder1/file$.nq' ]);
    });

    it('should error on an IRI not available in the mapping', async() => {
      await expect(sink.push('http://example.org/3/file.ttl', quad)).rejects
        .toThrow(new Error('No IRI mapping found for http://example.org/3/file.ttl'));
      expect((<any>sink).files).toStrictEqual([]);
    });

    it('should remove the hash from the IRI', async() => {
      await sink.push('http://example.org/1/file.ttl#me', quad);
      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(1, '/path/to/folder1/file.ttl', 'application/n-quads');
      expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      expect((<any>sink).files).toStrictEqual([ '/path/to/folder1/file.ttl' ]);
    });
  });

  describe('close', () => {
    beforeEach(() => {
      spyStdoutWrite = jest.spyOn(process.stdout, 'write');
      spyClearLine = jest.spyOn(readline, 'clearLine');
      spyCursorTo = jest.spyOn(readline, 'cursorTo');

      sink = new QuadSinkHdt({
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
      });
      quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));

      writeStream = {
        write: jest.fn(),
      };
      fileWriter = {
        getWriteStream: jest.fn(() => writeStream),
        close: jest.fn(),
      };
      (<any>sink).fileWriter = fileWriter;
    });
    it('should close produce the HDT file upon closing', async() => {
      await sink.push('http://example.org/1/file.ttl', quad);
      await sink.push('http://example.org/1/file:3000.ttl', quad);
      await sink.push('http://example.org/1/file', quad);
      await sink.close();

      const expectedFiles = [
        '/path/to/folder1/file.ttl',
        '/path/to/folder1/file_3000.ttl',
        '/path/to/folder1/file',
      ];

      expect((<any>sink).files).toStrictEqual(expectedFiles);
      expect(fileWriter.close).toHaveBeenNthCalledWith(1);
      expect(fs.rm).toHaveBeenCalledTimes(3);
      expect(pullHdtCppDockerImage).toHaveBeenCalledTimes(1);
      expect(convertToHdt).toHaveBeenCalledTimes(3);
      let i = 1;
      for (const file of expectedFiles) {
        expect(fs.rm).toHaveBeenNthCalledWith(i, file);
        expect((<jest.Mock>convertToHdt).mock.calls[i - 1][1]).toEqual(file);
        i++;
      }
    });

    it(`should close produce the HDT file upon closing 
            and not delete the source file when the flag is activated`, async() => {
      sink = new QuadSinkHdt({
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
      }, false);

      await sink.push('http://example.org/1/file.ttl', quad);
      await sink.push('http://example.org/1/file:3000.ttl', quad);
      await sink.push('http://example.org/1/file', quad);
      await sink.close();

      const expectedFiles = [
        '/path/to/folder1/file.ttl',
        '/path/to/folder1/file_3000.ttl',
        '/path/to/folder1/file',
      ];

      expect((<any>sink).files).toStrictEqual(expectedFiles);
      expect(fileWriter.close).toHaveBeenNthCalledWith(1);
      expect(fs.rm).toHaveBeenCalledTimes(0);
      expect(pullHdtCppDockerImage).toHaveBeenCalledTimes(1);
      expect(convertToHdt).toHaveBeenCalledTimes(3);
      let i = 1;
      for (const file of expectedFiles) {
        expect((<jest.Mock>convertToHdt).mock.calls[i - 1][1]).toEqual(file);
        i++;
      }
    });
  });
});
