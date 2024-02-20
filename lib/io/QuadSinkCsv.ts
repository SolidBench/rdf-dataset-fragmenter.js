import * as fs from 'fs';
import type { WriteStream } from 'fs';
import { dirname } from 'path';
import type * as RDF from '@rdfjs/types';
import mkdirp from 'mkdirp';
import { termToString } from 'rdf-string';
import type { QuadTermName } from 'rdf-terms';
import type { IQuadSink } from './IQuadSink';

/**
 * A quad sink that writes quads to a CSV file.
 */
export class QuadSinkCsv implements IQuadSink {
  private readonly file: string;
  private readonly columns: QuadTermName[];
  private fileStream: WriteStream | undefined;

  /**
   * @param file The file to write to.
   * @param columns The quad term names that will be serialized as columns.
   */
  public constructor(file: string, columns: QuadTermName[]) {
    this.file = file;
    this.columns = columns;
  }

  public close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.fileStream) {
        this.fileStream.close(error => {
          if (error) {
            return reject(error);
          }
          return resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public async push(iri: string, quad: RDF.Quad): Promise<void> {
    if (!this.fileStream) {
      // Ensure output directory exists
      const folder = dirname(this.file);
      await mkdirp(folder);

      // Open file stream
      this.fileStream = fs.createWriteStream(this.file);
      await new Promise<void>(resolve => {
        this.fileStream!.on('open', () => {
          // Write CSV header
          this.fileStream!.write(`${this.columns.join(',')}\n`);
          resolve();
        });
      });
    }

    this.fileStream.write(`${this.columns.map(column => termToString(quad[column])).join(',')}\n`);
  }
}
