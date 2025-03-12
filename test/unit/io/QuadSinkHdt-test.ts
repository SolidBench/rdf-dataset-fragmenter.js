import { unlink } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import { PassThrough } from 'node:stream';
import Dockerode from 'dockerode';
import type { IQuadSink } from '../../../lib/io/IQuadSink';
import { QuadSinkHdt } from '../../../lib/io/QuadSinkHdt';

jest.mock<typeof import('../../../lib/io/ParallelFileWriter')>('../../../lib/io/ParallelFileWriter');
jest.mock<typeof import('dockerode')>('dockerode');
jest.mock<typeof import('node:fs/promises')>('node:fs/promises');

interface IQuadSinkHdt extends IQuadSink {
  log: boolean;
  generateIndexes: boolean;
  removeSourceFiles: boolean;
  conversionConcurrency: number;
  fileExtension: string | undefined;
  docker: Dockerode;
  filesToConvert: Set<string>;
  getFilePath: (iri: string) => string;
  pullDockerImage: () => Promise<void>;
  convertSingleFile: (rdfFilePath: string) => Promise<void>;
  convertToHdt: () => Promise<void>;
  attemptConversionLog: (count: number) => void;
}

describe('QuadSinkHdt', () => {
  let sink: IQuadSinkHdt;

  const hdtcppDockerImage = 'rdfhdt/hdt-cpp:latest';
  const hdtCppMountPath = '/tmp/convert';

  const log = true;
  const generateIndexes = false;
  const removeSourceFiles = true;
  const conversionConcurrency = 1;

  const outputFormat = 'application/n-quads';
  const fileExtension = '.nq';
  const iriToPath: Record<string, string> = {
    'http://example.org/1/': '/path/to/folder1/',
    'http://example.org/2/': '/path/to/folder2/',
  };

  beforeEach(() => {
    sink = <any> new QuadSinkHdt({
      log,
      iriToPath,
      outputFormat,
      fileExtension,
      conversionConcurrency,
      generateIndexes,
      removeSourceFiles,
    });
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it.each([
      'application/n-quads',
      'application/n-triples',
      'text/turtle',
      'application/rdf+xml',
      'text/n3',
    ])('should accept %s as output format', (outputFormat) => {
      expect(() => new QuadSinkHdt({ outputFormat, iriToPath })).not.toThrow();
    });

    it('should reject an unsupported output format', () => {
      const outputFormat = 'application/json';
      const expectedError = `Unsupported HDT output format ${outputFormat}`;
      expect(() => new QuadSinkHdt({ outputFormat, iriToPath })).toThrow(expectedError);
    });

    it('should assign default parameter values', () => {
      sink = <any> new QuadSinkHdt({ outputFormat, iriToPath });
      expect(sink.generateIndexes).toBe(true);
      expect(sink.removeSourceFiles).toBe(true);
      expect(sink.conversionConcurrency).toBe(1);
      expect(sink.docker).toBeInstanceOf(Dockerode);
    });

    it('should assign non-default parameter values when provided', () => {
      sink = <any> new QuadSinkHdt({
        outputFormat,
        iriToPath,
        generateIndexes: false,
        removeSourceFiles: false,
        conversionConcurrency: 2,
      });
      expect(sink.generateIndexes).toBe(false);
      expect(sink.removeSourceFiles).toBe(false);
      expect(sink.conversionConcurrency).toBe(2);
      expect(sink.docker).toBeInstanceOf(Dockerode);
    });
  });

  describe('getFilePath', () => {
    it('should keep track of files to convert', () => {
      const uri = 'http://example.org/1/a';
      const path = '/path/to/folder1/a.nq';
      expect(sink.filesToConvert.size).toBe(0);
      expect(sink.getFilePath(uri)).toBe(path);
      expect(sink.filesToConvert.size).toBe(1);
      expect(sink.filesToConvert).toContain(path);
    });
  });

  describe('attemptConversionLog', () => {
    beforeEach(() => {
      jest.spyOn(process.stdout, 'write');
      sink.filesToConvert.add('/path/to/folder1/a.nq');
    });

    it('should not print anything when logging is off', () => {
      expect(process.stdout.write).not.toHaveBeenCalled();
      sink.log = false;
      sink.attemptConversionLog(0);
      sink.attemptConversionLog(1);
      expect(process.stdout.write).not.toHaveBeenCalled();
    });

    it('should print the current progress when logging is enabled', () => {
      expect(process.stdout.write).not.toHaveBeenCalled();
      sink.attemptConversionLog(0);
      expect(process.stdout.write).toHaveBeenCalledTimes(1);
      expect(process.stdout.write).toHaveBeenNthCalledWith(1, '\rConverted files: 0/1');
      sink.attemptConversionLog(1);
      expect(process.stdout.write).toHaveBeenCalledTimes(2);
      expect(process.stdout.write).toHaveBeenNthCalledWith(2, '\rConverted files: 1/1\n');
    });
  });

  describe('pullDockerImage', () => {
    let pullError: Error | undefined;
    let followProgressError: Error | undefined;

    beforeEach(() => {
      pullError = undefined;
      followProgressError = undefined;
      sink.docker.pull = <any> jest.fn((_repoTag, _options, callback) => callback(pullError, {}));
      sink.docker.modem = <any> {
        followProgress: jest.fn((_stream, onFinished) => onFinished(followProgressError, [])),
      };
    });

    it('should call docker.pull correctly', async() => {
      expect(sink.docker.pull).not.toHaveBeenCalled();
      expect(sink.docker.modem.followProgress).not.toHaveBeenCalled();
      await expect(sink.pullDockerImage()).resolves.not.toThrow();
      expect(sink.docker.pull).toHaveBeenCalledTimes(1);
      expect(sink.docker.pull).toHaveBeenCalledWith(hdtcppDockerImage, {}, expect.any(Function));
      expect(sink.docker.modem.followProgress).toHaveBeenCalledTimes(1);
    });

    it('should forward errors from docker.pull', async() => {
      pullError = new Error('Docker pull failed');
      expect(sink.docker.pull).not.toHaveBeenCalled();
      await expect(sink.pullDockerImage()).rejects.toThrow(pullError);
    });

    it('should foward errors from docker.modem.followProgress', async() => {
      followProgressError = new Error('Docker modem followProgress failed');
      expect(sink.docker.pull).not.toHaveBeenCalled();
      expect(sink.docker.modem.followProgress).not.toHaveBeenCalled();
      await expect(sink.pullDockerImage()).rejects.toThrow(followProgressError);
      expect(sink.docker.pull).toHaveBeenCalledTimes(1);
      expect(sink.docker.pull).toHaveBeenCalledWith(hdtcppDockerImage, {}, expect.any(Function));
      expect(sink.docker.modem.followProgress).toHaveBeenCalledTimes(1);
    });
  });

  describe('convertSingleFile', () => {
    let rdfFilePath: string;
    let extraFlags: string[];
    let dockerArgs: () => any[];

    beforeEach(() => {
      rdfFilePath = '/path/to/folder1/a.nq';
      extraFlags = [];
      dockerArgs = () => [
        hdtcppDockerImage,
        [ 'rdf2hdt', '-p', ...extraFlags, `${hdtCppMountPath}/${basename(rdfFilePath)}`, `${hdtCppMountPath}/a.hdt` ],
        expect.any(PassThrough),
        { HostConfig: { AutoRemove: true, Binds: [ `${dirname(rdfFilePath)}:${hdtCppMountPath}:rw` ]}},
      ];
      sink.removeSourceFiles = false;
      jest.spyOn(sink.docker, 'run').mockResolvedValue([{ StatusCode: 0 }, undefined ]);
    });

    it('should call docker.run correctly', async() => {
      expect(sink.docker.run).not.toHaveBeenCalled();
      await expect(sink.convertSingleFile(rdfFilePath)).resolves.not.toThrow();
      expect(sink.docker.run).toHaveBeenCalledTimes(1);
      expect(sink.docker.run).toHaveBeenCalledWith(...dockerArgs());
    });

    it('should call docker.run correctly without file extension', async() => {
      sink.fileExtension = undefined;
      rdfFilePath = rdfFilePath.replace('.nq', '');
      expect(sink.docker.run).not.toHaveBeenCalled();
      await expect(sink.convertSingleFile(rdfFilePath)).resolves.not.toThrow();
      expect(sink.docker.run).toHaveBeenCalledTimes(1);
      expect(sink.docker.run).toHaveBeenCalledWith(...dockerArgs());
    });

    it('should call docker.run correctly with index flag', async() => {
      sink.generateIndexes = true;
      extraFlags = [ '-i' ];
      expect(sink.docker.run).not.toHaveBeenCalled();
      await expect(sink.convertSingleFile(rdfFilePath)).resolves.not.toThrow();
      expect(sink.docker.run).toHaveBeenCalledTimes(1);
      expect(sink.docker.run).toHaveBeenCalledWith(...dockerArgs());
    });

    it('should delete original file when cleanup is true', async() => {
      sink.removeSourceFiles = true;
      expect(unlink).not.toHaveBeenCalled();
      expect(sink.docker.run).not.toHaveBeenCalled();
      await expect(sink.convertSingleFile(rdfFilePath)).resolves.not.toThrow();
      expect(sink.docker.run).toHaveBeenCalledTimes(1);
      expect(unlink).toHaveBeenCalledTimes(1);
      expect(unlink).toHaveBeenCalledWith(rdfFilePath);
    });

    it('should throw error when conversion fails', async() => {
      const conversionOutput = 'Expected output\n';
      const expectedError = `Failed to convert ${rdfFilePath}:\n${conversionOutput}`;
      jest.spyOn(sink.docker, 'run').mockImplementation(<any>(async(
        _image: string,
        _cmd: string[],
        outputStream: NodeJS.WritableStream,
        _createOptions: any,
      ): Promise<[ { StatusCode: number }, any]> => {
        outputStream.write(conversionOutput);
        outputStream.end();
        return [{ StatusCode: 1 }, undefined ];
      }));
      expect(sink.docker.run).not.toHaveBeenCalled();
      await expect(sink.convertSingleFile(rdfFilePath)).rejects.toThrow(expectedError);
      expect(sink.docker.run).toHaveBeenCalledTimes(1);
      expect(sink.docker.run).toHaveBeenCalledWith(...dockerArgs());
    });
  });

  describe('convertToHdt', () => {
    beforeEach(() => {
      jest.spyOn(sink, 'pullDockerImage').mockResolvedValue(undefined);
      jest.spyOn(sink, 'convertSingleFile').mockResolvedValue(undefined);
      jest.spyOn(sink, 'attemptConversionLog').mockImplementation();
    });

    it('should call convertSingleFile for each registered path', async() => {
      expect(sink.filesToConvert.size).toBe(0);
      const paths = [ '/path/to/folder1/a.nq', '/path/to/folder2/b.nq' ];
      for (const path of paths) {
        sink.filesToConvert.add(path);
      }
      expect(sink.filesToConvert.size).toBe(paths.length);
      expect(sink.pullDockerImage).not.toHaveBeenCalled();
      expect(sink.convertSingleFile).not.toHaveBeenCalled();
      await expect(sink.convertToHdt()).resolves.not.toThrow();
      expect(sink.pullDockerImage).toHaveBeenCalledTimes(1);
      expect(sink.convertSingleFile).toHaveBeenCalledTimes(2);
      for (const path of sink.filesToConvert) {
        expect(sink.convertSingleFile).toHaveBeenCalledWith(path);
      }
    });

    it.each([
      [ 1, 7 ],
      [ 2, 5 ],
      [ 5, 13 ],
    ])('should properly manage concurrency of %d', async(concurrency, pathCount) => {
      sink.conversionConcurrency = concurrency;
      for (let i = 0; i < pathCount; i++) {
        sink.filesToConvert.add(`/path/to/file${i}.nq`);
      }
      await expect(sink.convertToHdt()).resolves.not.toThrow();
      expect(sink.convertSingleFile).toHaveBeenCalledTimes(pathCount);
      for (const path of sink.filesToConvert) {
        expect(sink.convertSingleFile).toHaveBeenCalledWith(path);
      }
    });
  });

  describe('close', () => {
    it('should call convertToHdt', async() => {
      jest.spyOn(sink, 'convertToHdt').mockImplementation();
      expect(sink.convertToHdt).not.toHaveBeenCalled();
      await sink.close();
      expect(sink.convertToHdt).toHaveBeenCalledTimes(1);
    });
  });
});
