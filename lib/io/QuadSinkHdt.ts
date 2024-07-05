import type { WriteStream } from 'node:fs';
import { createWriteStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as Path from 'node:path';
import * as readline from 'node:readline';
import type * as RDF from '@rdfjs/types';
import * as Docker from 'dockerode';
import type { IQuadSinkFileOptions } from './QuadSinkFile';
import { QuadSinkFile } from './QuadSinkFile';
import { transformToHdt, pullHdtCppDockerImage } from './rfdhdtDockerUtil';

export class QuadSinkHdt extends QuadSinkFile {
  private readonly files: Set<string> = new Set();
  private readonly deleteSourceFiles: boolean;
  private readonly errorFileDockerRfdhdt: WriteStream;
  private readonly poolSize: number;

  public constructor(
    options: IQuadSinkFileOptions,
    poolSize = 1,
    deleteSourceFiles = false,
    errorFileDockerRfdhdt = './error_log_docker_rfdhdt',
  ) {
    super(options);
    this.deleteSourceFiles = deleteSourceFiles;
    this.errorFileDockerRfdhdt = createWriteStream(errorFileDockerRfdhdt);
    this.poolSize = poolSize;
  }

  public async push(iri: string, quad: RDF.Quad): Promise<void> {
    const path = Path.join('./', this.getFilePath(iri));
    await super.push(iri, quad);

    // Add files with the defined extension to the list to be transformed
    if (this.fileExtension !== undefined && path.includes(this.fileExtension)) {
      this.files.add(path);
    }
  }

  /**
   * Log the number of files transformed into HDT
   * @param {number} counter - counter of the number of files transformed
   * @param {boolean} newLine - add a new line after the logging
   */
  private attemptLogHdtTransformation(counter: number, newLine = false): void {
    if (this.log) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`\rfiles transformed to HDT:${counter} out of ${this.files.size}`);
      if (newLine) {
        process.stdout.write(`\n`);
      }
    }
  }

  public async close(): Promise<void> {
    // Close the streaming of files
    await super.close();
    const docker: Docker = new Docker();
    // Pull the docker image if it is not available in the system
    await pullHdtCppDockerImage(docker);
    const operationPool: Map<string, Promise<string>> = new Map();
    let i = 0;

    for (const file of this.files) {
      operationPool.set(file, this.transformToHdt(docker, file));
      if (i % this.poolSize === 0) {
        this.attemptLogHdtTransformation(i);
        const winnerFile = await Promise.race(operationPool.values());
        operationPool.delete(winnerFile);
      }
      i++;
    }
    await Promise.all(operationPool.values());
    this.attemptLogHdtTransformation(i, true);
  }

  private async transformToHdt(docker: Docker, file: string): Promise<string> {
    await transformToHdt(docker, file, this.errorFileDockerRfdhdt);
    if (this.deleteSourceFiles) {
      await fs.rm(file);
    }
    return file;
  }
}
