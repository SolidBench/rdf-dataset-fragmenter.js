import { clearLine, cursorTo } from 'node:readline';
import type { Writable } from 'node:stream';
import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from './IQuadSink';
import { ParallelFileWriter } from './ParallelFileWriter';

/**
 * A quad sink that writes to files using an IRI to local file system path mapping.
 */
export class QuadSinkFile implements IQuadSink {
  private readonly outputFormat: string;
  private readonly iriToPath: Map<RegExp, string>;
  private readonly fileWriter: ParallelFileWriter;
  protected readonly log: boolean;
  protected readonly fileExtension?: string;

  private counter = 0;

  public constructor(options: IQuadSinkFileOptions) {
    this.outputFormat = options.outputFormat;
    this.iriToPath = new Map(Object.entries(options.iriToPath).map(([ exp, sub ]) => [
      new RegExp(exp, 'u'),
      sub,
    ]));
    this.log = Boolean(options.log);
    this.fileExtension = options.fileExtension;
    this.fileWriter = new ParallelFileWriter({ streams: 128 });
    this.attemptLog();
  }

  protected attemptLog(newLine = false): void {
    if (this.log && (this.counter % 1_000 === 0 || newLine)) {
      clearLine(process.stdout, 0);
      cursorTo(process.stdout, 0);
      process.stdout.write(`\rHandled quads: ${this.counter / 1_000}K`);
      if (newLine) {
        process.stdout.write(`\n`);
      }
    }
  }

  protected getFilePath(iri: string): string {
    // Remove hash fragment
    const posHash = iri.indexOf('#');
    if (posHash >= 0) {
      iri = iri.slice(0, posHash);
    }

    // Find base path from the first matching baseIRI
    let bestMatch: RegExpExecArray | undefined;
    let bestRegex: RegExp | undefined;

    for (const exp of this.iriToPath.keys()) {
      const match = exp.exec(iri);
      if (match && (bestMatch === undefined || match[0].length > bestMatch[0].length)) {
        bestMatch = match;
        bestRegex = exp;
      }
    }

    // Crash if we did not find a matching baseIRI
    if (!bestRegex) {
      throw new Error(`No IRI mapping found for ${iri}`);
    }

    // Perform substitution and replace illegal directory names
    let path = iri.replace(bestRegex, this.iriToPath.get(bestRegex)!);

    // Replace illegal directory names
    path = path.replaceAll(/[*|"<>?:]/ug, '_');

    // Add file extension if we don't have one yet
    if (this.fileExtension && !/\.[a-z]$/iu.test(this.fileExtension)) {
      path = `${path}${this.fileExtension}`;
    }

    return path;
  }

  protected async getFileStream(path: string): Promise<Writable> {
    return this.fileWriter.getWriteStream(path, this.outputFormat);
  }

  public async push(iri: string, quad: RDF.Quad): Promise<void> {
    this.counter++;
    this.attemptLog();

    const path = this.getFilePath(iri);
    const os = await this.getFileStream(path);
    os.write(quad);
  }

  public async close(): Promise<void> {
    await this.fileWriter.close();
    this.attemptLog(true);
  }
}

export interface IQuadSinkFileOptions {
  /**
   * The RDF format to output, expressed as mimetype.
   */
  outputFormat: string;
  /**
   * Mapping of regular expressions to their replacements,
   * for determining the file path from a given IRI.
   * @range {json}
   */
  iriToPath: Record<string, string>;
  /**
   * Whether to log quad handling progress.
   */
  log?: boolean;
  /**
   * Optional file extension to use.
   */
  fileExtension?: string;
}
