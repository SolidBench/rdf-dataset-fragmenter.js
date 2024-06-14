import * as fs from 'fs/promises';
import * as Path from 'path';
import type * as RDF from '@rdfjs/types';
import Docker = require('dockerode');
import type { IQuadSinkFileOptions } from './QuadSinkFile';
import { QuadSinkFile } from './QuadSinkFile';
import { convertToHdt, pullHdtCppDockerImage } from './rfdhdtDockerUtil';
import * as readline from 'readline';


export class QuadSinkHdt extends QuadSinkFile {
  private readonly files: string[] = [];
  private readonly deletedSourceFiles: boolean;

  public constructor(options: IQuadSinkFileOptions, deleteSourceFile = true) {
    super(options);
    this.deletedSourceFiles = deleteSourceFile;
  }

  public async push(iri: string, quad: RDF.Quad): Promise<void> {
    const path = Path.join('./', this.getFilePath(iri));
    await super.push(iri, quad);

    if (path.includes(this.fileExtension ?? '.donotmatch!!')) {
      this.files.push(path);
    }
  }

  private attemptLogHdtConversion(file:string, counter:number, newLine = false): void {
    if (this.log && (counter % 1_000 === 0 || newLine)) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`\rfile converted to HDT:${counter}\ncurrently converting: ${file}`);
      if (newLine) {
        process.stdout.write(`\n`);
      }
    }
  }

  public async close(): Promise<void> {
    const docker: Docker = new Docker();
    await pullHdtCppDockerImage(docker);
    let i =0;
    for (const file of this.files) {
      this.attemptLogHdtConversion(file, i);
      await convertToHdt(docker, file);
      if (this.deletedSourceFiles) {
        await fs.rm(file);
      }
      i++;
    }

    await super.close();
  }
}
