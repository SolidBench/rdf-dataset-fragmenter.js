import arrayifyStream from 'arrayify-stream';
import { DataFactory } from 'rdf-data-factory';
import 'jest-rdf';
import { QuadSourceFile } from '../../../lib/io/QuadSourceFile';

const streamifyString = require('streamify-string');

const DF = new DataFactory();

jest.mock<typeof import('node:fs')>('node:fs', () => <any> ({
  createReadStream(filePath: string) {
    if (filePath === '/path/to/file.ttl') {
      return streamifyString(`<ex:s> <ex:p> <ex:o>.`);
    }
    throw new Error('Unknown file in QuadSourceFile');
  },
}));

describe('QuadSourceFile', () => {
  let source: QuadSourceFile;
  beforeEach(() => {
    source = new QuadSourceFile({
      filePath: '/path/to/file.ttl',
      baseIRI: 'ex:',
    });
  });

  it('should load quads from a file', async() => {
    await expect(arrayifyStream(source.getQuads())).resolves.toEqualRdfQuadArray([
      DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ]);
  });
});
