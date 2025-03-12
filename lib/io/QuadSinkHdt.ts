import { unlink } from 'node:fs/promises';
import { basename, resolve, dirname } from 'node:path';
import { PassThrough } from 'node:stream';
import Dockerode from 'dockerode';
import type * as Docker from 'dockerode';
import streamToString from 'stream-to-string';
import { QuadSinkFile, type IQuadSinkFileOptions } from './QuadSinkFile';

const HDTCPP_MOUNT_PATH = '/tmp/convert';
const HDTCPP_DOCKER_IMAGE = 'rdfhdt/hdt-cpp:latest';
const HDTCPP_FORMATS = new Map<string, string>([
  [ 'application/n-quads', 'nquad' ],
  [ 'application/n-triples', 'ntriples' ],
  [ 'text/turtle', 'turtle' ],
  [ 'application/rdf+xml', 'rdfxml' ],
  [ 'text/n3', 'n3' ],
]);

export class QuadSinkHdt extends QuadSinkFile {
  private readonly generateIndexes: boolean;
  private readonly removeSourceFiles: boolean;
  private readonly conversionConcurrency: number;
  private readonly docker: Docker;
  private readonly filesToConvert: Set<string>;

  public constructor(options: IQuadSinkHdtOptions) {
    super(options);
    if (!HDTCPP_FORMATS.has(options.outputFormat)) {
      throw new Error(`Unsupported HDT output format ${options.outputFormat}`);
    }
    this.generateIndexes = options.generateIndexes ?? true;
    this.removeSourceFiles = options.removeSourceFiles ?? true;
    this.conversionConcurrency = options.conversionConcurrency ?? 1;
    this.docker = <Docker> new Dockerode();
    this.filesToConvert = new Set();
  }

  protected getFilePath(iri: string): string {
    const path = super.getFilePath(iri);
    this.filesToConvert.add(resolve(path));
    return path;
  }

  /**
   * Runs the equivalent of `docker pull` for the rdf2hdt Docker image
   */
  protected async pullDockerImage(): Promise<void> {
    await new Promise<void>((resolve, reject) => this.docker.pull(HDTCPP_DOCKER_IMAGE, {}, (error, result) => {
      if (error) {
        reject(error);
      }
      this.docker.modem.followProgress(result!, error => error ? reject(error) : resolve());
    }));
  }

  /**
   * Runs the equivalent of `docker run` to convert `rdfFilePath` into a HDT file
   * @param rdfFilePath The path to the RDF file to convert
   */
  protected async convertSingleFile(rdfFilePath: string): Promise<string> {
    const cmd = [
      'rdf2hdt',
      '-p',
      ...this.generateIndexes ? [ '-i' ] : [],
      `${HDTCPP_MOUNT_PATH}/${basename(rdfFilePath)}`,
      `${HDTCPP_MOUNT_PATH}/${basename(rdfFilePath).replace(this.fileExtension ?? '', '')}.hdt`,
    ];
    const createOptions: Docker.ContainerCreateOptions = {
      // eslint-disable-next-line ts/naming-convention
      HostConfig: {
        // eslint-disable-next-line ts/naming-convention
        AutoRemove: true,
        // eslint-disable-next-line ts/naming-convention
        Binds: [ `${dirname(rdfFilePath)}:${HDTCPP_MOUNT_PATH}:rw` ],
      },
    };
    const passThrough = new PassThrough();
    const passThroughToString = streamToString(passThrough);
    // eslint-disable-next-line ts/naming-convention
    const resultStatus = (<[ { StatusCode: number }, any ]> await this.docker.run(
      HDTCPP_DOCKER_IMAGE,
      cmd,
      passThrough,
      createOptions,
    ))[0].StatusCode;
    if (resultStatus) {
      throw new Error(`Failed to convert ${rdfFilePath}:\n${await passThroughToString}`);
    }
    if (this.removeSourceFiles) {
      await unlink(rdfFilePath);
    }
    return rdfFilePath;
  }

  /**
   * Converts all files stored in `filesToConvert` into HDT format using the Docker image,
   * with a maximum concurrency of `conversionConcurrency`
   */
  protected async convertToHdt(): Promise<void> {
    await this.pullDockerImage();
    const runningConversions = new Map<string, Promise<string>>();
    let convertedFiles = 0;
    for (const rdfFilePath of this.filesToConvert) {
      runningConversions.set(rdfFilePath, this.convertSingleFile(rdfFilePath));
      if (runningConversions.size === this.conversionConcurrency) {
        runningConversions.delete(await Promise.race(runningConversions.values()));
        this.attemptConversionLog(convertedFiles++);
      }
    }
    await Promise.all(runningConversions.values());
    this.attemptConversionLog(convertedFiles + runningConversions.size);
  }

  protected attemptConversionLog(count: number): void {
    if (this.log) {
      const lineTerminator = count === this.filesToConvert.size ? '\n' : '';
      process.stdout.write(`\rConverted files: ${count}/${this.filesToConvert.size}${lineTerminator}`);
    }
  }

  public async close(): Promise<void> {
    await super.close();
    await this.convertToHdt();
  }
}

export interface IQuadSinkHdtOptions extends IQuadSinkFileOptions {
  /**
   * Whether to generate indexes using rdf2hdt
   */
  generateIndexes?: boolean;
  /**
   * Whether to clean up the RDF files after HDT generation
   */
  removeSourceFiles?: boolean;
  /**
   * The level of parallelism in the conversion, which will affect the number of
   * concurrently running Docker containers performing the conversion
   */
  conversionConcurrency?: number;
}
