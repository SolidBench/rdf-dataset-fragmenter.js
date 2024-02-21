import * as fs from 'fs';
import type { Readable } from 'stream';
import type * as RDF from '@rdfjs/types';
import rdfParser from 'rdf-parse';
import type { IQuadSource } from './IQuadSource';

/**
 * A quad source that loads quads from a file.
 */
export class QuadSourceFile implements IQuadSource {
  private readonly filePath: string;
  private readonly baseIRI?: string;

  public constructor(options: IQuadSourceFileOptions) {
    this.filePath = options.filePath;
    this.baseIRI = options.baseIRI;
  }

  public getQuads(): RDF.Stream & Readable {
    // The parser from 'rdf-parse' uses Readable from 'readable-stream', hence this cast
    return <RDF.Stream & Readable><unknown>rdfParser.parse(fs.createReadStream(this.filePath), {
      path: this.filePath,
      baseIRI: this.baseIRI,
    });
  }
}

export interface IQuadSourceFileOptions {
  /**
   * Path to a local RDF file.
   * This file should include an extension so that the used format can be detected.
   */
  filePath: string;
  /**
   * An optional baseIRI to parse the file with.
   */
  baseIRI?: string;
}
