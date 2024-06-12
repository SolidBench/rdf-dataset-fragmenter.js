import Docker = require("dockerode");
import * as Path from "path";

const RDF_HDT_IMAGE_REPO = "rfdhdt/hdt-cpp";

/**
 * Pull the rfdhdt/hdt-cpp with docker
 * equivalent of the docker command
 * docker pull rfdhdt/hdt-cpp
 */
export async function pullHdtCppDockerImage(): Promise<void> {
    return new Promise((resolve, reject) => {
        const docker: Docker = new Docker();
        docker.pull(RDF_HDT_IMAGE_REPO, function (err: Error, stream: any) {

            docker.modem.followProgress(stream, onFinished, onProgress);

            async function onFinished(err: any, output: any) {
                if (err === undefined || err === null) {
                    resolve();
                } else {
                    console.info(err);
                    reject(err);
                }

            }
            async function onProgress(event: any) {
                console.info(event);
            }
        });
    });
}
/**
 * Delete the rfdhdt/hdt-cpp docker image
 */
export async function deleteHtdCppDockerImage(): Promise<void> {
    const docker: Docker = new Docker();
    await docker.getImage(RDF_HDT_IMAGE_REPO).remove();
}

/**
 * convert an ntriple document into an HDT using the rfdhdt/hdt-cpp docker image
 * Equivalent to the docker command
 * docker run -it --rm -v "$(pwd)":{inputFileFolder} rfdhdt/hdt-cpp rdf2hdt -i -p -v -f ntriples {inputFilePath} {outputFilePath}
 * @param {string} inputFilePath -the path of the file to convert 
 */
export async function convertToHdt(inputFilePath: string): Promise<void> {
    const parsedPath = Path.parse(inputFilePath);

    const outputFolder = parsedPath.dir;
    const filename = parsedPath.name;
    const fileExtension = parsedPath.ext;

    const format = SUPPORTED_FORMAT.get(fileExtension);
    if (format === undefined) {
        throw new Error(`format ${fileExtension} not support by rfdhdt/hdt-cpp`);
    }
    const command = [
        "rdf2hdt",
        "-i",
        "-p",
        "-v",
        "-f",
        format,
        inputFilePath,
        Path.join(outputFolder, `${filename}.hdt`)
    ];
    const createOption: Docker.ContainerCreateOptions = {
        Volumes: { "$(pwd)": outputFolder }
    };
    const docker: Docker = new Docker();
    const data = await docker.run(RDF_HDT_IMAGE_REPO, command, process.stdout, createOption);
    const [output, container] = data;
    console.log(output.StatusCode);
    container.remove();
}

const SUPPORTED_FORMAT = new Map([
    ['nq', 'ntriples'],
    ['ttl', 'turtle'],
    ['xml', 'rdfxml'],
    ['n3', 'n3']
]);