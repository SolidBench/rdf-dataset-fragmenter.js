import * as fs from 'fs';
import * as Path from 'path';
import type * as Docker from 'dockerode';

const SUPPORTED_FORMAT = new Map([
  [ '.nq', 'nquad' ],
  [ '.nt', 'ntriples' ],
  [ '.ttl', 'turtle' ],
  [ '.xml', 'rdfxml' ],
  [ '.n3', 'n3' ],
]);

const ERROR_STEAM_FILE = fs.createWriteStream('./error_log_docker_rfdhdt');

const RDF_HDT_IMAGE_REPO = 'rfdhdt/hdt-cpp';

/**
 * Pull the rfdhdt/hdt-cpp with docker
 * equivalent of the docker command
 * docker pull rfdhdt/hdt-cpp
 * @param {Docker} docker - docker instance
 */
export async function pullHdtCppDockerImage(docker: Docker): Promise<void> {
  return new Promise(async(resolve, reject) => {
    const stream = await docker.pull(RDF_HDT_IMAGE_REPO, {});

    const onFinished = (err: any): undefined => {
      if (err === undefined || err === null) {
        resolve();
      } else {
        // eslint-disable-next-line no-console
        console.info(err);
        reject(err);
      }
    };

    const onProgress = (event: any): undefined => {
      // eslint-disable-next-line no-console
      console.info(event);
    };

    docker.modem.followProgress(stream, onFinished, onProgress);
  });
}

/**
 * Transform an RDF document into an HDT using the rfdhdt/hdt-cpp docker image
 * Equivalent to the docker command
 * docker run -it --rm -v "$(pwd)":{inputFileFolder} rfdhdt/hdt-cpp /
 * rdf2hdt -i -p -v -f ntriples {inputFilePath} {outputFilePath}
 * @param {Docker} - docker instance
 * @param {string} inputFilePath - the path of the file to be transformed
 */
export async function transformToHdt(docker: Docker, inputFilePath: string): Promise<void> {
  const parsedPath = Path.parse(inputFilePath);

  const outputFolder = parsedPath.dir;
  const filename = parsedPath.name;
  const fileExtension = parsedPath.ext;

  const format = SUPPORTED_FORMAT.get(fileExtension);
  if (format === undefined) {
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
  const createOption: Docker.ContainerCreateOptions = {
    HostConfig: {
      AutoRemove: true,
      Binds: [
        `${process.cwd()}:${Path.resolve('./')}`,
      ],
    },
    Tty: false,
  };
  const data = await docker.run(RDF_HDT_IMAGE_REPO,
    command,
    [ ERROR_STEAM_FILE, ERROR_STEAM_FILE ],
    createOption);
  const [ output ] = data;
  if (output.StatusCode === 1) {
    throw new Error('Exited with error code 1. More information in ./error_log_docker_rfdhdt.');
  }
}
