import type { Writable } from 'node:stream';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { IQuadSink } from '../../../lib/io/IQuadSink';
import { ParallelFileWriter } from '../../../lib/io/ParallelFileWriter';
import { QuadSinkFile } from '../../../lib/io/QuadSinkFile';

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');

interface IQuadSinkFile extends IQuadSink {
  outputFormat: string;
  iriToPath: Map<RegExp, string>;
  fileWriter: ParallelFileWriter;
  log: boolean;
  fileExtension?: string;
  counter: number;

  attemptLog: (newLine: boolean) => void;
  getFilePath: (iri: string) => string;
  getFileStream: (path: string) => Promise<Writable>;
  push: (iri: string, quad: RDF.Quad) => Promise<void>;
  close: () => Promise<void>;
}

describe('QuadSinkFile', () => {
  let sink: IQuadSinkFile;

  const outputFormat = 'application/n-quads';
  const iriToPath = {
    '^http://example.org/1': '/path/to/folder1',
    '^http://example.org/2': '/path/to/folder2',
    '^http://example.org/23': '/path/to/folder23',
  };

  beforeEach(() => {
    sink = <any> new QuadSinkFile({ outputFormat, iriToPath });
  });

  describe('constructor', () => {
    it('should assign default values', () => {
      expect(sink.outputFormat).toBe(outputFormat);
      expect(sink.fileExtension).toBeUndefined();
      expect(sink.log).toBeFalsy();
      expect(sink.fileWriter).toBeInstanceOf(ParallelFileWriter);
    });

    it('should convert IRI mappings to RegExp', () => {
      const expectedRegExpMapping = new Map(Object.entries(iriToPath).map(([ exp, sub ]) => [
        new RegExp(exp, 'u'),
        sub,
      ]));
      expect(sink.iriToPath).toEqual(expectedRegExpMapping);
    });
  });

  describe('attemptLog', () => {
    beforeEach(() => {
      jest.spyOn(process.stdout, 'write');
    });

    it('should not write anything when logging is off', () => {
      expect(process.stdout.write).not.toHaveBeenCalled();
      sink.attemptLog(false);
      sink.counter++;
      sink.attemptLog(false);
      sink.counter++;
      sink.attemptLog(true);
      expect(process.stdout.write).not.toHaveBeenCalled();
    });

    it('should properly log at intervals of 1000 when logging is on', () => {
      sink.log = true;
      expect(process.stdout.write).not.toHaveBeenCalled();
      sink.attemptLog(false);
      expect(process.stdout.write).toHaveBeenCalledTimes(1);
      expect(process.stdout.write).toHaveBeenNthCalledWith(1, '\rHandled quads: 0K');
      sink.counter = 500;
      sink.attemptLog(false);
      expect(process.stdout.write).toHaveBeenCalledTimes(1);
      sink.counter = 1_000;
      sink.attemptLog(false);
      expect(process.stdout.write).toHaveBeenCalledTimes(2);
      expect(process.stdout.write).toHaveBeenNthCalledWith(2, '\rHandled quads: 1K');
      sink.counter = 2_001;
      sink.attemptLog(true);
      expect(process.stdout.write).toHaveBeenCalledTimes(4);
      expect(process.stdout.write).toHaveBeenNthCalledWith(3, '\rHandled quads: 2.001K');
      expect(process.stdout.write).toHaveBeenNthCalledWith(4, '\n');
    });
  });

  describe('getFilePath', () => {
    it('should map IRIs with file extensions to paths', () => {
      expect(sink.getFilePath('http://example.org/1/file.ttl')).toBe('/path/to/folder1/file.ttl');
    });

    it('should map IRIs without file extensions to paths', () => {
      expect(sink.getFilePath('http://example.org/1/file')).toBe('/path/to/folder1/file');
    });

    it('should map IRIs without file extensions to paths with the specified fileExtension', () => {
      sink.fileExtension = '$.nq';
      expect(sink.getFilePath('http://example.org/1/file')).toBe('/path/to/folder1/file$.nq');
      sink.fileExtension = undefined;
    });

    it('should escape illegal directory names', () => {
      expect(sink.getFilePath('http://example.org/1/file:3000.ttl')).toBe('/path/to/folder1/file_3000.ttl');
    });

    it('should remove fragments from IRIs', () => {
      expect(sink.getFilePath('http://example.org/1/file#abc')).toBe('/path/to/folder1/file');
    });

    it('should always pick the longest matching pattern', () => {
      expect(sink.getFilePath('http://example.org/2/file')).toBe('/path/to/folder2/file');
      expect(sink.getFilePath('http://example.org/23/file')).toBe('/path/to/folder23/file');
    });

    it('should throw an error when no mapping exists', () => {
      const iri = 'http://example.org/3/file';
      expect(() => sink.getFilePath(iri)).toThrow(`No IRI mapping found for ${iri}`);
    });
  });

  describe('getFileStream', () => {
    it('should get the file stream from fileWriter', async() => {
      const path = '/path/to/folder1/file.ttl';
      jest.spyOn(sink.fileWriter, 'getWriteStream').mockResolvedValue(<any> 'stream');
      expect(sink.fileWriter.getWriteStream).not.toHaveBeenCalled();
      await expect(sink.getFileStream(path)).resolves.toBe('stream');
      expect(sink.fileWriter.getWriteStream).toHaveBeenCalledTimes(1);
      expect(sink.fileWriter.getWriteStream).toHaveBeenNthCalledWith(1, path, sink.outputFormat);
    });
  });

  describe('push', () => {
    const iri = 'http://example.org/1/file';
    const path = '/path/to/folder1/file';
    const quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
    let outputStream: Writable;

    beforeEach(() => {
      outputStream = <any> { write: jest.fn() };
      jest.spyOn(sink, 'attemptLog').mockImplementation();
      jest.spyOn(sink, 'getFilePath').mockReturnValue(path);
      jest.spyOn(sink, 'getFileStream').mockResolvedValue(outputStream);
    });

    it('should increment the counter', async() => {
      expect(sink.counter).toBe(0);
      await expect(sink.push(iri, quad)).resolves.not.toThrow();
      expect(sink.counter).toBe(1);
    });

    it('should properly process the quad', async() => {
      expect(sink.attemptLog).not.toHaveBeenCalled();
      expect(sink.getFilePath).not.toHaveBeenCalled();
      expect(sink.getFileStream).not.toHaveBeenCalled();
      expect(outputStream.write).not.toHaveBeenCalled();
      await expect(sink.push(iri, quad)).resolves.not.toThrow();
      expect(sink.attemptLog).toHaveBeenCalledTimes(1);
      expect(sink.attemptLog).toHaveBeenNthCalledWith(1);
      expect(sink.getFilePath).toHaveBeenCalledTimes(1);
      expect(sink.getFilePath).toHaveBeenNthCalledWith(1, iri);
      expect(sink.getFileStream).toHaveBeenCalledTimes(1);
      expect(sink.getFileStream).toHaveBeenNthCalledWith(1, path);
      expect(outputStream.write).toHaveBeenCalledTimes(1);
      expect(outputStream.write).toHaveBeenNthCalledWith(1, quad);
    });
  });

  describe('close', () => {
    it('should close the file writer', async() => {
      expect(sink.fileWriter.close).not.toHaveBeenCalled();
      await sink.close();
      expect(sink.fileWriter.close).toHaveBeenCalledTimes(1);
    });
  });
});
