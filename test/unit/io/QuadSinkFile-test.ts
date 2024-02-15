import * as readline from 'readline';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { QuadSinkFile } from '../../../lib/io/QuadSinkFile';

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');
jest.mock('readline');

describe('QuadSinkFile', () => {
  let sink: QuadSinkFile;
  let quad: RDF.Quad;
  let writeStream: any;
  let fileWriter: any;

  let spyStdoutWrite: any;
  let spyClearLine: any;
  let spyCursorTo: any;

  beforeEach(() => {
    spyStdoutWrite = jest.spyOn(process.stdout, 'write');
    spyClearLine = jest.spyOn(readline, 'clearLine');
    spyCursorTo = jest.spyOn(readline, 'cursorTo');
  });

  describe('without logging', () => {
    beforeEach(() => {
      sink = new QuadSinkFile({
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
      (<any> sink).fileWriter = fileWriter;
    });

    describe('push', () => {
      it('should write a quad to an IRI available in the mapping', async() => {
        await sink.push('http://example.org/1/file.ttl', quad);
        expect(fileWriter.getWriteStream)
          .toHaveBeenNthCalledWith(1, '/path/to/folder1/file.ttl', 'application/n-quads');
        expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      });

      it('should escape illegal directory names', async() => {
        await sink.push('http://example.org/1/file:3000.ttl', quad);
        expect(fileWriter.getWriteStream)
          .toHaveBeenNthCalledWith(1, '/path/to/folder1/file_3000.ttl', 'application/n-quads');
        expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      });

      it('should write a quad to an IRI available in the mapping without extension without fileExtension', async() => {
        await sink.push('http://example.org/1/file', quad);
        expect(fileWriter.getWriteStream)
          .toHaveBeenNthCalledWith(1, '/path/to/folder1/file', 'application/n-quads');
        expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      });

      it('should write a quad to an IRI available in the mapping without extension with fileExtension', async() => {
        sink = new QuadSinkFile({
          outputFormat: 'application/n-quads',
          iriToPath: {
            'http://example.org/1/': '/path/to/folder1/',
            'http://example.org/2/': '/path/to/folder2/',
          },
          fileExtension: '$.nq',
        });
        (<any> sink).fileWriter = fileWriter;

        await sink.push('http://example.org/1/file', quad);
        expect(fileWriter.getWriteStream)
          .toHaveBeenNthCalledWith(1, '/path/to/folder1/file$.nq', 'application/n-quads');
        expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      });

      it('should error on an IRI not available in the mapping', async() => {
        await expect(sink.push('http://example.org/3/file.ttl', quad)).rejects
          .toThrow(new Error('No IRI mapping found for http://example.org/3/file.ttl'));
      });

      it('should remove the hash from the IRI', async() => {
        await sink.push('http://example.org/1/file.ttl#me', quad);
        expect(fileWriter.getWriteStream)
          .toHaveBeenNthCalledWith(1, '/path/to/folder1/file.ttl', 'application/n-quads');
        expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
      });
    });

    describe('close', () => {
      it('should close the file writer', async() => {
        await sink.close();
        expect(fileWriter.close).toHaveBeenNthCalledWith(1);
      });
    });
  });

  describe('with logging', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      writeStream = {
        write: jest.fn(),
      };
      fileWriter = {
        getWriteStream: jest.fn(() => writeStream),
        close: jest.fn(),
      };
    });

    it('after construction', async() => {
      new QuadSinkFile({
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
        log: true,
      });
      expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
      expect(spyStdoutWrite).toHaveBeenCalledWith(`\rHandled quads: 0K`);
    });

    it('after pushing 2001 times', async() => {
      sink = new QuadSinkFile({
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
        log: true,
      });
      (<any> sink).fileWriter = fileWriter;
      for (let i = 0; i <= 2_001; i++) {
        await sink.push('http://example.org/1/a', <any> undefined);
      }
      expect(spyStdoutWrite).toHaveBeenCalledTimes(3);
      expect(spyStdoutWrite).toHaveBeenNthCalledWith(1, `\rHandled quads: 0K`);
      expect(spyStdoutWrite).toHaveBeenNthCalledWith(2, `\rHandled quads: 1K`);
      expect(spyStdoutWrite).toHaveBeenNthCalledWith(3, `\rHandled quads: 2K`);
    });

    it('after pushing 2001 times and closing', async() => {
      sink = new QuadSinkFile({
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
        log: true,
      });
      (<any> sink).fileWriter = fileWriter;
      for (let i = 0; i <= 2_001; i++) {
        await sink.push('http://example.org/1/a', <any> undefined);
      }
      await sink.close();
      expect(spyStdoutWrite).toHaveBeenCalledTimes(5);
      expect(spyStdoutWrite).toHaveBeenNthCalledWith(1, `\rHandled quads: 0K`);
      expect(spyStdoutWrite).toHaveBeenNthCalledWith(2, `\rHandled quads: 1K`);
      expect(spyStdoutWrite).toHaveBeenNthCalledWith(3, `\rHandled quads: 2K`);
      expect(spyStdoutWrite).toHaveBeenNthCalledWith(4, `\rHandled quads: 2.002K`);
      expect(spyStdoutWrite).toHaveBeenNthCalledWith(5, `\n`);
    });
  });
});
