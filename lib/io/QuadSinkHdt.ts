import * as fs from 'fs/promises';
import * as Path from 'path';
import * as readline from 'readline';
import type * as RDF from '@rdfjs/types';
import * as Docker from 'dockerode';
import type { IQuadSinkFileOptions } from './QuadSinkFile';
import { QuadSinkFile } from './QuadSinkFile';
import { convertToHdt, pullHdtCppDockerImage } from './rfdhdtDockerUtil';

export class QuadSinkHdt extends QuadSinkFile {
  private readonly files: Set<string> = new Set();
  private readonly deletedSourceFiles: boolean;
  private readonly hdtConversionPoolSize: number;

  public constructor(options: IQuadSinkFileOptions, hdtConversionPoolSize = 5, deleteSourceFile = true) {
    super(options);
    this.deletedSourceFiles = deleteSourceFile;
    this.hdtConversionPoolSize = hdtConversionPoolSize;
  }

  public async push(iri: string, quad: RDF.Quad): Promise<void> {
    const path = Path.join('./', this.getFilePath(iri));
    await super.push(iri, quad);

    if (path.includes(this.fileExtension ?? '.donotmatch!!')) {
      this.files.add(path);
    }
  }

  private attemptLogHdtConversion(counter: number, newLine = false): void {
    if (this.log) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`\rfiles converted to HDT:${counter} out of ${this.files.size}`);
      if (newLine) {
        process.stdout.write(`\n`);
      }
    }
  }

  public async close(): Promise<void> {
    await super.close();
    const docker: Docker = new Docker();
    // To avoid the logging of the handled quads collide with the logging of the pulling of the docker image
    await pullHdtCppDockerImage(docker);

    let i = 0;
    let pool: Promise<void>[] = [];
    for (const file of this.files) {
      pool.push(this.convertToHdt(docker, file));
      if (pool.length === this.hdtConversionPoolSize) {
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
    await convertToHdt(docker, file);
    if (this.deletedSourceFiles) {
      await fs.rm(file);
    }
  }
}
