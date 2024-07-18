import type { Quad } from '@rdfjs/types';
import * as N3 from 'n3';
import type { IQuadSink } from './IQuadSink';
import type { IQuadSinkFileOptions } from './QuadSinkFile';

const n3Parser = new N3.Parser();

export interface IQuadSinkAnnotationOptions extends IQuadSinkFileOptions {
  iriPatterns: string[];
  annotation: string;
  sink: IQuadSink;
}

export class QuadSinkAnnotation implements IQuadSink {
  private readonly sink: IQuadSink;
  private readonly iriPatterns: RegExp[];
  private readonly handleIri: Set<string> = new Set();
  private readonly annotation: string;

  public constructor(options: IQuadSinkAnnotationOptions) {
    this.iriPatterns = options.iriPatterns.map(exp => new RegExp(exp, 'u'));
    this.sink = options.sink;
    this.annotation = options.annotation;
  }

  public async push(iri: string, quad: Quad): Promise<void> {
    for (const exp of this.iriPatterns) {
      if (exp.test(iri) && !this.handleIri.has(iri)) {
        const annotations = this.parseTripleTemplate(this.annotation, iri);
        for (const annotation of annotations) {
          await this.sink.push(iri, annotation);
        }
        this.handleIri.add(iri);
        break;
      }
    }
    await this.sink.push(iri, quad);
  }

  public async close(): Promise<void> {
    this.handleIri.clear();
    await this.sink.close();
  }

  private parseTripleTemplate(triple: string, iri: string): Quad[] {
    const parsedTriple = triple.replaceAll('$', iri);
    const quads: Quad[] = n3Parser.parse(parsedTriple);
    return quads;
  }
}
