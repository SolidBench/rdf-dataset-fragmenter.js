import { pullHdtCppDockerImage, convertToHdt } from '../../../lib/io/rfdhdtDockerUtil';
import * as Docker from 'dockerode';
import * as fs from 'fs/promises';

describe("rfdhdtDockerUtil", () => {
    describe("pullImage", () => {
        it('should pull with a real docker instance', async () => {
            const docker: Docker = new Docker();
            await pullHdtCppDockerImage(docker);
        }, 120 * 1000);

        it('should reject on error on a mocked instance', async () => {
            const docker: Docker = new Docker();
            jest.spyOn(docker, "pull").mockImplementation((_image: string): any => {
                return <any>[]
            });
            jest.spyOn(docker.modem, "followProgress")
                .mockImplementation((_stream, onFinished) => {
                    onFinished(new Error("error"), []);
                });
            expect(pullHdtCppDockerImage(docker)).rejects.toStrictEqual(new Error("error"));
        });
    });

    describe('convertToHdt', () => {

        beforeAll(async () => {
            const docker: Docker = new Docker();
            await pullHdtCppDockerImage(docker);
            await fs.rm("./test/unit/io/rdf_files/test.hdt", { force: true });
            await fs.rm("./test/unit/io/rdf_files/test.hdt.index.v1-1", { force: true });
        }, 120 * 1000);

        afterAll(async () => {
            await fs.rm("./test/unit/io/rdf_files/test.hdt", { force: true });
            await fs.rm("./test/unit/io/rdf_files/test.hdt.index.v1-1", { force: true });
        });

        it('should reject the promise given an unsupported file format', () => {
            const docker: any = jest.fn();
            const inputFilePath = "foo.abc";
            expect(convertToHdt(docker, inputFilePath)).rejects.toStrictEqual(new Error(`format .abc not support by rfdhdt/hdt-cpp`));
        });

        it('should produce the hdt file given an nt file', async () => {
            const docker: Docker = new Docker();
            const inputFilePath = "./test/unit/io/rdf_files/test.nt";
            await convertToHdt(docker, inputFilePath);

            expect((await fs.stat("./test/unit/io/rdf_files/test.hdt")).isFile()).toBe(true);
            expect((await fs.stat("./test/unit/io/rdf_files/test.hdt.index.v1-1")).isFile()).toBe(true);

        }, 120 * 1000);

        it('should throw given the docker run command fail', async () => {
            const docker: Docker = new Docker();
            jest.spyOn(docker, "run").mockResolvedValueOnce([{ StatusCode: 1 }]);
            const inputFilePath = "./test/unit/io/rdf_files/test.nt";
            expect(convertToHdt(docker, inputFilePath))
                .rejects
                .toStrictEqual(new Error("was not able to finish the task. Check the terminal log for more information."));
        });
    });
});