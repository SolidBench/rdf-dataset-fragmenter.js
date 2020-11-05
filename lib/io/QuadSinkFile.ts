import type { Writable } from 'stream';
import type * as RDF from 'rdf-js';
import type { IQuadSink } from './IQuadSink';
import { ParallelFileWriter } from './ParallelFileWriter';

/**
 * A quad sink that writes to files using an IRI to local file system path mapping.
 */
export class QuadSinkFile implements IQuadSink {
  private readonly outputFormat: string;
  private readonly iriToPath: Record<string, string>;
  private readonly fileWriter: ParallelFileWriter;

  public constructor(options: IQuadSinkFileOptions) {
    this.outputFormat = options.outputFormat;
    this.iriToPath = options.iriToPath;

    this.fileWriter = new ParallelFileWriter({ streams: 128 });
  }

  protected getFilePath(iri: string): string {
    // Find base path from the first matching baseIRI
    let path: string | undefined;
    for (const [ baseIRI, basePath ] of Object.entries(this.iriToPath)) {
      if (iri.startsWith(baseIRI)) {
        path = basePath + iri.slice(baseIRI.length);
        break;
      }
    }

    // Crash if we did not find a matching baseIRI
    if (!path) {
      throw new Error(`No IRI mapping found for ${iri}`);
    }
    return path;
  }

  protected async getFileStream(path: string): Promise<Writable> {
    return this.fileWriter.getWriteStream(path, this.outputFormat);
  }

  public async push(iri: string, quad: RDF.Quad): Promise<void> {
    // Remove hash fragment
    const posHash = iri.indexOf('#');
    if (posHash >= 0) {
      iri = iri.slice(0, posHash);
    }

    const path = this.getFilePath(iri);
    const os = await this.getFileStream(path);
    os.write(quad);
  }

  public async close(): Promise<void> {
    await this.fileWriter.close();
  }
}

export interface IQuadSinkFileOptions {
  outputFormat: string;
  iriToPath: Record<string, string>;
}
