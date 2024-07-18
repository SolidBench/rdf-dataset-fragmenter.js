import type { Quad } from '@rdfjs/types';
import * as N3 from 'n3';
import { QuadSinkFile, type IQuadSinkFileOptions } from './QuadSinkFile';

const n3Parser = new N3.Parser();

export interface IQuadSinkAnnotatedFileOptions extends IQuadSinkFileOptions {
  /**
   * IRI template of the file to annotate
   */
  iriPatterns: string[];
  /**
   * Triples to annotate the files
   */
  annotation: string;
}

export class QuadSinkAnnotateFile extends QuadSinkFile {
  private readonly iriPatterns: RegExp[];
  private readonly handleIri: Set<string> = new Set();
  private readonly annotation: string;

  public constructor(options: IQuadSinkAnnotatedFileOptions) {
    super(options);
    this.iriPatterns = options.iriPatterns.map(exp => new RegExp(exp, 'u'));
    this.annotation = options.annotation;
  }

  public async push(iri: string, quad: Quad): Promise<void> {
    for (const exp of this.iriPatterns) {
      const match = iri.match(exp);
      if (match !== null && !this.handleIri.has(this.getFilePath(iri))) {
        const annotations = this.parseTripleTemplate(this.annotation, iri, match[0]);
        for (const annotation of annotations) {
          await super.push(iri, annotation);
        }
        this.handleIri.add(this.getFilePath(iri));
        break;
      }
    }
    await super.push(iri, quad);
  }

  public async close(): Promise<void> {
    this.handleIri.clear();
    await super.close();
  }

  private parseTripleTemplate(triple: string, iri: string, matchingPattern: string): Quad[] {
    let parsedTriple = triple.replaceAll('$', iri);
    parsedTriple = parsedTriple.replaceAll('{}', matchingPattern);
    const quads: Quad[] = n3Parser.parse(parsedTriple);
    return quads;
  }
}
