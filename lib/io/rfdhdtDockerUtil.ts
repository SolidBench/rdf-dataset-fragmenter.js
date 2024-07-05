import type * as fs from 'node:fs';
import * as Path from 'node:path';
import type * as Docker from 'dockerode';

const SUPPORTED_FORMATS = new Map([
  [ '.nq', 'nquad' ],
  [ '.nt', 'ntriples' ],
  [ '.ttl', 'turtle' ],
  [ '.xml', 'rdfxml' ],
  [ '.n3', 'n3' ],
]);

const RDF_HDT_IMAGE_REPO = 'rfdhdt/hdt-cpp';

/**
 * Pull the rfdhdt/hdt-cpp with docker
 * equivalent of the docker command
 * docker pull rfdhdt/hdt-cpp
 * @param {Docker} docker - docker instance
 */
export async function pullHdtCppDockerImage(docker: Docker): Promise<void> {
  return new Promise((resolve, reject) => {
    docker.pull(RDF_HDT_IMAGE_REPO, {}, (err: any, stream?: NodeJS.ReadableStream) => {
      if (err !== null) {
        reject(err);
        return;
      }

      const onFinished = (err: any): undefined => {
        if (err === null) {
          resolve();
        } else {
          process.stderr.write(JSON.stringify(err));
          process.stderr.write(`\n`);
          reject(err);
        }
      };

      const onProgress = (event: any): undefined => {
        process.stdout.write(JSON.stringify(event));
        process.stdout.write(`\n`);
      };

      // Stream will always be defined if an error was not returned
      docker.modem.followProgress(stream!, onFinished, onProgress);
    });
  });
}

/**
 * Transform an RDF document into an HDT using the rfdhdt/hdt-cpp docker image
 * Equivalent to the docker command
 * docker run -it --rm -v "$(pwd)":{inputFileFolder} rfdhdt/hdt-cpp /
 * rdf2hdt -i -p -v -f ntriples {inputFilePath} {outputFilePath}
 * @param {Docker} docker - docker instance
 * @param {string} inputFilePath - the path of the file to be transformed
 * @param {fs.WriteStream} errorStreamFile - the file stream of the error
 */
export async function transformToHdt(
  docker: Docker,
  inputFilePath: string,
  errorStreamFile: fs.WriteStream,
): Promise<void> {
  const parsedPath = Path.parse(inputFilePath);

  const outputFolder = parsedPath.dir;
  const filename = parsedPath.name;
  const fileExtension = parsedPath.ext;

  const format = SUPPORTED_FORMATS.get(fileExtension);
  if (!format) {
    throw new Error(`format ${fileExtension} not support by rfdhdt/hdt-cpp`);
  }
  const command = [
    'rdf2hdt',
    '-i',
    '-p',
    '-v',
    '-f',
    format,
    Path.resolve(inputFilePath),
    Path.resolve(Path.join(outputFolder, `${filename}.hdt`)),
  ];
  /* eslint-disable ts/naming-convention */
  const createOption: Docker.ContainerCreateOptions = {
    HostConfig: {
      AutoRemove: true,
      Binds: [
        `${process.cwd()}:${Path.resolve('./')}`,
      ],
    },
    Tty: false,
  };
  /* eslint-enable ts/naming-convention */

  /* eslint-disable ts/no-unsafe-assignment */
  const data: any = await docker.run(RDF_HDT_IMAGE_REPO, command, [ errorStreamFile, errorStreamFile ], createOption);
  const [ output ] = data;
  /* eslint-enable ts/no-unsafe-assignment */
  if (output.StatusCode === 1) {
    throw new Error(
      'Exited with error code 1. More information in the defined error file by default ./error_log_docker_rfdhdt.txt .',
    );
  }
}
