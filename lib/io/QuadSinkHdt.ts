import * as fs from 'fs/promises';
import * as Path from 'path';
import type * as RDF from '@rdfjs/types';
import Docker = require('dockerode');
import type { IQuadSinkFileOptions } from './QuadSinkFile';
import { QuadSinkFile } from './QuadSinkFile';
import { convertToHdt, pullHdtCppDockerImage } from './rfdhdtDockerUtil';

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

    if ((await fs.stat(path)).isFile()) {
      this.files.push(path);
    }
  }

  public async close(): Promise<void> {
    const docker: Docker = new Docker();
    await pullHdtCppDockerImage(docker);

    for (const file of this.files) {
      await convertToHdt(docker, file);
      if (this.deletedSourceFiles) {
        await fs.rm(file);
      }
    }

    await super.close();
  }
}
