import * as fs from 'node:fs';
import type { WriteStream } from 'node:fs';
import { dirname } from 'node:path';
import type * as RDF from '@rdfjs/types';
import { mkdirp } from 'mkdirp';
import type { IQuadMatcher } from './../quadmatcher/IQuadMatcher';
import type { ITransformCallback } from './ITransformCallback';

/**
 * This class maps transformed quads that match a given matcher to
 * their original quad's field value (subject, predicate, object, or graph)
 * (that also match) and writes them to a CSV file.
 */
export class TransformCallbackMap implements ITransformCallback {
  private readonly matchers: IQuadMatcher[];
  private readonly fieldToMap: 'subject' | 'predicate' | 'object' | 'graph';
  private readonly columns: string[];
  private readonly file: string;
  private fileStream: WriteStream | undefined;

  public constructor(
    matchers: IQuadMatcher[],
    fieldToMap: 'subject' | 'predicate' | 'object' | 'graph',
    columns: string[],
    file: string,
  ) {
    this.matchers = matchers;
    this.fieldToMap = fieldToMap;
    this.columns = columns;
    this.file = file;
  }

  public async run(quad: RDF.Quad, transformedQuads: RDF.Quad[]): Promise<void> {
    if (!this.fileStream) {
      throw new Error('File stream is not initialized. Call initializeCallback() first.');
    }
    const transformedQuadMatches = transformedQuads.filter(transformedQuad =>
      this.matchers.some(m => m.matches(transformedQuad)));
    if (transformedQuadMatches.length > 0) {
      this.fileStream.write(`${quad[this.fieldToMap].value},` +
      `${transformedQuadMatches.map(matchedTransformedQuad => matchedTransformedQuad[this.fieldToMap].value).join(',')}\n`);
    }
  }

  public async initializeCallback(): Promise<void> {
    // Ensure output directory exists
    const folder = dirname(this.file);
    await mkdirp(folder);

    // Open file stream
    this.fileStream = fs.createWriteStream(this.file);
    await new Promise<void>((resolve) => {
      this.fileStream!.on('open', () => {
        // Write CSV header
        this.fileStream!.write(`${this.columns.join(',')}\n`);
        resolve();
      });
    });
  }

  public end(): void {
    if (this.fileStream) {
      this.fileStream.end();
    }
  }
}
