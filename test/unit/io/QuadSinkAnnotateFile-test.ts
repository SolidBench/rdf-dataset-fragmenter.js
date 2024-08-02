import { DataFactory } from 'rdf-data-factory';
import { QuadSinkAnnotateFile } from '../../../lib/io/QuadSinkAnnotateFile';
import 'jest-rdf';

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');
jest.mock('node:readline');
jest.mock('../../../lib/io/rfdhdtDockerUtil');
jest.mock('node:fs/promises');

describe('QuadSinkAnnotateFile', () => {
  let sink: QuadSinkAnnotateFile;
  let writeStream: any;
  let fileWriter: any;

  const annotation = '<$> <http://exemple.be> <{}/bar>.';
  const iriPatterns = [ '^(.*\\/1/pod)' ];

  describe('push', () => {
    beforeEach(() => {
      sink = new QuadSinkAnnotateFile({
        iriPatterns,
        annotation,
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
        fileExtension: '.ttl',
      });

      writeStream = {
        write: jest.fn(),
      };
      fileWriter = {
        getWriteStream: jest.fn(() => writeStream),
        close: jest.fn(),
      };
      (<any>sink).fileWriter = fileWriter;
    });

    it('should not annotate a document not respecting a pattern', async() => {
      const iri = 'http://example.org/1/file';
      const quad = DF.quad(DF.blankNode(), DF.namedNode('foo'), DF.blankNode());
      await sink.push(iri, quad);

      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(1, '/path/to/folder1/file.ttl', 'application/n-quads');
      expect(writeStream.write).toHaveBeenCalledTimes(1);
      expect(writeStream.write).toHaveBeenNthCalledWith(1, quad);
    });

    it('should annotate a document respecting a pattern', async() => {
      const iri = 'http://example.org/1/pod';
      const quad = DF.quad(DF.blankNode(), DF.namedNode('foo'), DF.blankNode());
      await sink.push(iri, quad);

      const expectedQuad = DF.quad(
        DF.namedNode(iri),
        DF.namedNode('http://exemple.be'),
        DF.namedNode('http://example.org/1/pod/bar'),
      );

      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(1, '/path/to/folder1/pod.ttl', 'application/n-quads');
      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(2, '/path/to/folder1/pod.ttl', 'application/n-quads');

      expect(writeStream.write).toHaveBeenCalledTimes(2);

      expect((<jest.Mock>writeStream.write).mock.calls[0][0]).toEqualRdfQuad(expectedQuad);
      expect((<jest.Mock>writeStream.write).mock.calls[1][0]).toEqualRdfQuad(quad);
    });

    it('should not annotate twice a document', async() => {
      const iri = 'http://example.org/1/pod';
      const quad = DF.quad(DF.blankNode(), DF.namedNode('foo'), DF.blankNode());
      await sink.push(iri, quad);
      await sink.push(iri, quad);

      const expectedQuad = DF.quad(
        DF.namedNode(iri),
        DF.namedNode('http://exemple.be'),
        DF.namedNode('http://example.org/1/pod/bar'),
      );
      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(1, '/path/to/folder1/pod.ttl', 'application/n-quads');
      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(2, '/path/to/folder1/pod.ttl', 'application/n-quads');
      expect(fileWriter.getWriteStream)
        .toHaveBeenNthCalledWith(3, '/path/to/folder1/pod.ttl', 'application/n-quads');

      expect((<jest.Mock>writeStream.write).mock.calls[0][0]).toEqualRdfQuad(expectedQuad);
      expect((<jest.Mock>writeStream.write).mock.calls[1][0]).toEqualRdfQuad(quad);
      expect((<jest.Mock>writeStream.write).mock.calls[2][0]).toEqualRdfQuad(quad);
    });
  });

  describe('close', () => {
    beforeEach(() => {
      sink = new QuadSinkAnnotateFile({
        iriPatterns,
        annotation,
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
        fileExtension: '.ttl',
      });

      writeStream = {
        write: jest.fn(),
      };
      fileWriter = {
        getWriteStream: jest.fn(() => writeStream),
        close: jest.fn(),
      };
      (<any>sink).fileWriter = fileWriter;
    });

    it('should close', async() => {
      const iri = 'http://example.org/1/pod';
      const quad = DF.quad(DF.blankNode(), DF.namedNode('foo'), DF.blankNode());
      await sink.push(iri, quad);

      expect((<any>sink).handleIri.size).toBe(1);

      await sink.close();
      expect(fileWriter.close).toHaveBeenNthCalledWith(1);
      expect((<any>sink).handleIri.size).toBe(0);
    });
  });
});
