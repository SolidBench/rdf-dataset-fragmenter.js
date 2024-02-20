import * as fs from 'fs';
import type { WriteStream } from 'fs';
import type * as RDF from '@rdfjs/types';
import * as mkdirp from 'mkdirp';
import { DataFactory } from 'rdf-data-factory';
import { QuadSinkCsv } from '../../../lib/io/QuadSinkCsv';
import mocked = jest.mocked;

const DF = new DataFactory();

jest.mock('fs');
jest.mock('mkdirp');

describe('QuadSinkCsv', () => {
  let sink: QuadSinkCsv;
  let quad: RDF.Quad;
  let mockWriteStream: WriteStream;

  beforeEach(() => {
    sink = new QuadSinkCsv('path/to/file.csv', [ 'subject', 'predicate' ]);
    quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));

    jest.resetAllMocks();
    mockWriteStream = <any> {
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === 'open') {
          handler();
        }
        return this;
      }),
      write: jest.fn(),
      close: jest.fn().mockImplementation(cb => {
        cb();
      }),
    };
    mocked(fs.createWriteStream).mockReturnValue(mockWriteStream);
  });

  describe('push', () => {
    it('should write a quad', async() => {
      await sink.push('path/to/file.csv', quad);

      expect(mockWriteStream.write).toHaveBeenCalledTimes(2);
      expect(mockWriteStream.write).toHaveBeenNthCalledWith(1, 'subject,predicate\n');
      expect(mockWriteStream.write).toHaveBeenNthCalledWith(2, 'ex:s,ex:p\n');
      expect(mkdirp).toHaveBeenCalledTimes(1);
      expect(mkdirp).toHaveBeenNthCalledWith(1, 'path/to');
    });

    it('should write two quads', async() => {
      await sink.push('path/to/file.csv', quad);
      await sink.push('path/to/file.csv', quad);

      expect(mockWriteStream.write).toHaveBeenCalledTimes(3);
      expect(mockWriteStream.write).toHaveBeenNthCalledWith(1, 'subject,predicate\n');
      expect(mockWriteStream.write).toHaveBeenNthCalledWith(2, 'ex:s,ex:p\n');
      expect(mockWriteStream.write).toHaveBeenNthCalledWith(3, 'ex:s,ex:p\n');
      expect(mkdirp).toHaveBeenCalledTimes(1);
      expect(mkdirp).toHaveBeenNthCalledWith(1, 'path/to');
    });
  });

  describe('close', () => {
    it('should close the file writer if nothing has been pushed', async() => {
      await sink.close();
      expect(mockWriteStream.close).not.toHaveBeenCalled();
    });

    it('should close the file writer if something has been pushed', async() => {
      await sink.push('path/to/file.csv', quad);

      await sink.close();
      expect(mockWriteStream.close).toHaveBeenCalled();
    });

    it('should throw if an error occurs while closing', async() => {
      await sink.push('path/to/file.csv', quad);

      mockWriteStream.close = jest.fn().mockImplementation(cb => {
        cb(new Error('QuadSinkCsv close error'));
      });
      await expect(sink.close()).rejects.toThrowError('QuadSinkCsv close error');
    });
  });
});
