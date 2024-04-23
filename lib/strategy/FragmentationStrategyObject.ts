import type * as RDF from '@rdfjs/types';

import type { IQuadSink } from '../io/IQuadSink';
import { FragmentationBlankNodeBuffer } from './FragmentationBlankNodeBuffer';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';

/**
 * A fragmentation strategy that places quads into their object's document.
 */
export class FragmentationStrategyObject extends FragmentationStrategyStreamAdapter {
  private readonly blankNodeBuffer: FragmentationBlankNodeBuffer<'object', 'subject'>;

  public constructor(eagerFlushing = true) {
    super();
    this.blankNodeBuffer = new FragmentationBlankNodeBuffer('object', 'subject', eagerFlushing);
  }

  public async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    // Only accept IRI subjects.
    if (quad.object.termType === 'NamedNode') {
      // If the subject is a named node, add the quad to the subject's document.
      await quadSink.push(quad.object.value, quad);

      // Save the object in our blank node buffer, as it may be needed to identify documents for other quads.
      await this.blankNodeBuffer.materializeValueForNamedKey(quad.subject, quad.object, quadSink);
    }

    await this.blankNodeBuffer.push(quad, quadSink);
  }

  protected async flush(quadSink: IQuadSink): Promise<void> {
    await super.flush(quadSink);
    await this.blankNodeBuffer.flush(quadSink);
  }
}
