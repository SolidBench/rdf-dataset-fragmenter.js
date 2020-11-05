import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { QuadSinkFile } from '../../../lib/io/QuadSinkFile';
const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');

describe('QuadSinkFile', () => {
  let sink: QuadSinkFile;
  let quad: RDF.Quad;
  let writeStream: any;
  let fileWriter: any;
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
      expect(fileWriter.getWriteStream).toHaveBeenNthCalledWith(1, '/path/to/folder1/file.ttl', 'application/n-quads');
      expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
    });

    it('should error on an IRI not available in the mapping', async() => {
      await expect(sink.push('http://example.org/3/file.ttl', quad)).rejects
        .toThrow(new Error('No IRI mapping found for http://example.org/3/file.ttl'));
    });
  });

  describe('close', () => {
    it('should close the file writer', async() => {
      await sink.close();
      expect(fileWriter.close).toHaveBeenNthCalledWith(1);
    });
  });
});
