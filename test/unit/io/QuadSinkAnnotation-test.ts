import { DataFactory } from 'rdf-data-factory';
import { QuadSinkAnnotation } from '../../../lib/io/QuadSinkAnnotation';
import 'jest-rdf';

const DF = new DataFactory();

describe('QuadSinkAnnotation', () => {
  describe('push', () => {
    let nestedSink: any;
    let sink: any;
    const annotation = '<$> <http://exemple.be> <http://exemple.ca#foo>.';
    const iriPatterns = [ '^(.*\\/pods\\/[0-9]+)' ];

    beforeEach(() => {
      nestedSink = {
        push: jest.fn(),
      };
      sink = new QuadSinkAnnotation({
        iriPatterns,
        annotation,
        sink: nestedSink,
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should not annotate a document not respecting a pattern', async() => {
      const iri = 'http://exemple.be';
      const quad = DF.quad(DF.blankNode(), DF.namedNode('foo'), DF.blankNode());
      await sink.push(iri, quad);

      expect(nestedSink.push).toHaveBeenCalledTimes(1);
      expect(nestedSink.push).toHaveBeenLastCalledWith(iri, quad);
    });

    it('should annotate a document respecting a pattern', async() => {
      const iri = 'http://localhost:3000/pods/00000010995116278291/foo#bar';
      const quad = DF.quad(DF.blankNode(), DF.namedNode('foo'), DF.blankNode());
      await sink.push(iri, quad);

      const expectedQuad = DF.quad(
        DF.namedNode(iri),
        DF.namedNode('http://exemple.be'),
        DF.namedNode('http://exemple.ca#foo'),
      );

      expect(nestedSink.push).toHaveBeenCalledTimes(2);

      expect((<jest.Mock>nestedSink.push).mock.calls[0][0]).toBe(iri);
      expect((<jest.Mock>nestedSink.push).mock.calls[0][1]).toEqualRdfQuad(expectedQuad);

      expect((<jest.Mock>nestedSink.push).mock.calls[1][0]).toBe(iri);
      expect((<jest.Mock>nestedSink.push).mock.calls[1][1]).toEqualRdfQuad(quad);
    });

    it('should not annotate twice a document', async() => {
      const iri = 'http://localhost:3000/pods/00000010995116278291/foo#bar';
      const quad = DF.quad(DF.blankNode(), DF.namedNode('foo'), DF.blankNode());
      await sink.push(iri, quad);
      await sink.push(iri, quad);

      const expectedQuad = DF.quad(
        DF.namedNode(iri),
        DF.namedNode('http://exemple.be'),
        DF.namedNode('http://exemple.ca#foo'),
      );

      expect(nestedSink.push).toHaveBeenCalledTimes(3);

      expect((<jest.Mock>nestedSink.push).mock.calls[0][0]).toBe(iri);
      expect((<jest.Mock>nestedSink.push).mock.calls[0][1]).toEqualRdfQuad(expectedQuad);

      expect((<jest.Mock>nestedSink.push).mock.calls[1][0]).toBe(iri);
      expect((<jest.Mock>nestedSink.push).mock.calls[1][1]).toEqualRdfQuad(quad);
      expect((<jest.Mock>nestedSink.push).mock.calls[2][0]).toBe(iri);
      expect((<jest.Mock>nestedSink.push).mock.calls[2][1]).toEqualRdfQuad(quad);
    });
  });

  describe('close', () => {
    let nestedSink: any;
    let sink: any;
    const annotation = '<$> <http://exemple.be> <http://exemple.ca#foo>.';
    const iriPatterns = [ '^(.*\\/pods\\/[0-9]+)' ];

    beforeEach(() => {
      nestedSink = {
        push: jest.fn(),
        close: jest.fn(),
      };
      sink = new QuadSinkAnnotation({
        iriPatterns,
        annotation,
        sink: nestedSink,
        outputFormat: 'application/n-quads',
        iriToPath: {
          'http://example.org/1/': '/path/to/folder1/',
          'http://example.org/2/': '/path/to/folder2/',
        },
      });
    });

    it('should close', async() => {
      const iri = 'http://localhost:3000/pods/00000010995116278291/foo#bar';
      const quad = DF.quad(DF.blankNode(), DF.namedNode('foo'), DF.blankNode());
      await sink.push(iri, quad);

      expect(sink.handleIri.size).toBe(1);

      await sink.close();

      expect(sink.handleIri.size).toBe(0);
      expect(nestedSink.close).toHaveBeenCalledTimes(1);
    });
  });
});
