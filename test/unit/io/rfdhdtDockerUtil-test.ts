import { createWriteStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as Docker from 'dockerode';
import { pullHdtCppDockerImage, transformToHdt } from '../../../lib/io/rfdhdtDockerUtil';

const ERROR_STEAM_FILE = createWriteStream('./error_log_docker_rfdhdt.txt');

describe('rfdhdtDockerUtil', () => {
  afterAll(async() => {
    await fs.rm('./error_log_docker_rfdhdt.txt');
  });

  describe('pullImage', () => {
    it('should pull with a real docker instance', async() => {
      const docker: Docker = new Docker();
      await pullHdtCppDockerImage(docker);
    }, 120 * 1_000);

    it('should reject on error on a mocked instance OnFinished', async() => {
      const docker: Docker = new Docker();
      (<jest.MockedFunction<any>> jest.spyOn(docker, 'pull'))
        .mockImplementation((_image: string, option: any, callback: any): any => {
          callback(null, true);
          return <any>[];
        });
      jest.spyOn(docker.modem, 'followProgress')
        .mockImplementation((_stream, onFinished) => {
          onFinished(new Error('error'), []);
        });
      // eslint-disable-next-line ts/no-floating-promises, jest/valid-expect
      expect(pullHdtCppDockerImage(docker)).rejects.toStrictEqual(new Error('error'));
    });

    it('should reject on error on a mocked instance', async() => {
      const docker: Docker = new Docker();
      (<jest.MockedFunction<any>> jest.spyOn(docker, 'pull'))
        .mockImplementation((_image: string, option: any, callback: any): any => {
          callback(new Error('error'), null);
          return <any>[];
        });
      // eslint-disable-next-line ts/no-floating-promises, jest/valid-expect
      expect(pullHdtCppDockerImage(docker)).rejects.toStrictEqual(new Error('error'));
    });
  });

  describe('transformToHdt', () => {
    beforeAll(async() => {
      const docker: Docker = new Docker();
      await pullHdtCppDockerImage(docker);
      await fs.rm('./test/unit/io/rdf_files/test.hdt', { force: true });
      await fs.rm('./test/unit/io/rdf_files/test.hdt.index.v1-1', { force: true });
    }, 120 * 1_000);

    afterAll(async() => {
      await fs.rm('./test/unit/io/rdf_files/test.hdt', { force: true });
      await fs.rm('./test/unit/io/rdf_files/test.hdt.index.v1-1', { force: true });
    });

    it('should reject the promise given an unsupported file format', () => {
      const docker: any = jest.fn();
      const inputFilePath = 'foo.abc';
      // eslint-disable-next-line ts/no-floating-promises, jest/valid-expect
      expect(transformToHdt(docker, inputFilePath, ERROR_STEAM_FILE)).rejects.toStrictEqual(new Error(`format .abc not support by rfdhdt/hdt-cpp`));
    });

    it('should produce the hdt file given an nt file', async() => {
      const docker: Docker = new Docker();
      const inputFilePath = './test/unit/io/rdf_files/test.nt';
      await transformToHdt(docker, inputFilePath, ERROR_STEAM_FILE);

      expect((await fs.stat('./test/unit/io/rdf_files/test.hdt')).isFile()).toBe(true);
      expect((await fs.stat('./test/unit/io/rdf_files/test.hdt.index.v1-1')).isFile()).toBe(true);
    }, 120 * 1_000);

    it('should throw given the docker run command fail', async() => {
      const docker: Docker = new Docker();
      jest.spyOn(docker, 'run').mockResolvedValueOnce([{ StatusCode: 1 }]);
      const inputFilePath = './test/unit/io/rdf_files/test.nt';
      // eslint-disable-next-line ts/no-floating-promises, jest/valid-expect
      expect(
        transformToHdt(docker, inputFilePath, ERROR_STEAM_FILE),
      )
        .rejects
        .toStrictEqual(new Error(
          'Exited with error code 1. ' +
          'More information in the defined error file by default ./error_log_docker_rfdhdt.txt .',
        ));
    });
  });
});
