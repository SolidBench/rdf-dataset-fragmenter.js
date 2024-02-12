import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from '../io/IQuadSink';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';

/**
 * A fragmentation strategy that groups triples by (subject) resources,
 * and places quads into the document identified by the given predicate value.
 *
 * Blank nodes are not supported.
 */
export class FragmentationStrategyResourceObject extends FragmentationStrategyStreamAdapter {
  private readonly targetPredicate: RegExp;

  public readonly resourceBuffer: Record<string, RDF.Quad[] | RDF.NamedNode>;

  public constructor(targetPredicateRegex: string) {
    super();
    this.targetPredicate = new RegExp(targetPredicateRegex, 'u');

    this.resourceBuffer = {};
  }

  protected async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    // Create buffer if one doesn't exist yet
    if (!this.resourceBuffer[quad.subject.value]) {
      this.resourceBuffer[quad.subject.value] = [];
    }

    // Handle remaining quads
    const buffer = this.resourceBuffer[quad.subject.value];
    if (Array.isArray(buffer)) {
      // Buffer remaining quads
      buffer.push(quad);
    } else {
      // If the target predicate was already set, flush immediately
      await quadSink.push(buffer.value, quad);
    }

    // Match the target predicate
    if (this.targetPredicate.test(quad.predicate.value)) {
      if (quad.object.termType !== 'NamedNode') {
        throw new Error(`Expected target predicate value of type NamedNode on resource '${quad.subject.value}', but got '${quad.object.value}' (${quad.object.termType})`);
      }

      // Flush the buffer of this resource
      await this.flushResourceBuffer(quadSink, quad.subject.value, quad.object.value);

      // Indicate that further triples of this resource should be emitted immediately
      this.resourceBuffer[quad.subject.value] = quad.object;
    }
  }

  protected async flush(quadSink: IQuadSink): Promise<void> {
    await super.flush(quadSink);
    for (const resourceIri of Object.keys(this.resourceBuffer)) {
      if (Array.isArray(this.resourceBuffer[resourceIri])) {
        // eslint-disable-next-line no-console
        console.warn(`Detected quads of the resource ${resourceIri} without a defined target predicate.`);
      }
    }
  }

  private async flushResourceBuffer(quadSink: IQuadSink, resourceIri: string, targetIri: string): Promise<void> {
    const quads = this.resourceBuffer[resourceIri];
    if (Array.isArray(quads)) {
      for (const quad of quads) {
        await quadSink.push(targetIri, quad);
      }
    }
  }
}
