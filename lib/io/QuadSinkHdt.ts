import * as fs from 'fs/promises';
import * as Path from 'path';
import * as readline from 'readline';
import type * as RDF from '@rdfjs/types';
import * as Docker from 'dockerode';
import type { IQuadSinkFileOptions } from './QuadSinkFile';
import { QuadSinkFile } from './QuadSinkFile';
import { transformToHdt, pullHdtCppDockerImage } from './rfdhdtDockerUtil';

export class QuadSinkHdt extends QuadSinkFile {
  private readonly files: Set<string> = new Set();
  private readonly deleteSourceFiles: boolean;
  private readonly hdtConversionOpPoolSize: number;

  public constructor(options: IQuadSinkFileOptions, hdtConversionOpPoolSize = 5, deleteSourceFiles = true) {
    super(options);
    this.deleteSourceFiles = deleteSourceFiles;
    this.hdtConversionOpPoolSize = hdtConversionOpPoolSize;
  }

  public async push(iri: string, quad: RDF.Quad): Promise<void> {
    const path = Path.join('./', this.getFilePath(iri));
    await super.push(iri, quad);
    
    // add files with the defined extension to the list to be transformed
    if (this.fileExtension!==undefined && path.includes(this.fileExtension)) {
      this.files.add(path);
    }
  }

  /**
   * Log the number of files transformed into HDT
   * @param {number} counter - counter of the number of files transformed
   * @param {boolean} newLine - add a new line after the logging 
   */
  private attemptLogHdtConversion(counter: number, newLine = false): void {
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
    // close the streaming of file
    await super.close();
    const docker: Docker = new Docker();
    // pull the docker if it is not available in the system
    await pullHdtCppDockerImage(docker);

    let i = 0;
    let pool: Promise<void>[] = [];
    for (const file of this.files) {
      pool.push(this.convertToHdt(docker, file));
      if (pool.length === this.hdtConversionOpPoolSize) {
        await Promise.all(pool);
        this.attemptLogHdtConversion(i);
        pool = [];
      }
      i++;
    }
    await Promise.all(pool);
    this.attemptLogHdtConversion(i, true);
  }

  private async convertToHdt(docker: Docker, file: string): Promise<void> {
    await transformToHdt(docker, file);
    if (this.deleteSourceFiles) {
      await fs.rm(file);
    }
  }
}
