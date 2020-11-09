import type * as RDF from 'rdf-js';

import type { IQuadSink } from '../io/IQuadSink';
import { FragmentationBlankNodeBuffer } from './FragmentationBlankNodeBuffer';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';

/**
 * A fragmentation strategy that places quads into their subject's document.
 */
export class FragmentationStrategySubject extends FragmentationStrategyStreamAdapter {
  private readonly blankNodeBuffer = new FragmentationBlankNodeBuffer('subject', 'object');

  protected async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    // Only accept IRI subjects.
    if (quad.subject.termType === 'NamedNode') {
      // If the subject is a named node, add the quad to the subject's document.
      await quadSink.push(quad.subject.value, quad);

      // Save the subject in our blank node buffer, as it may be needed to identify documents for other quads.
      this.blankNodeBuffer.materializeValueForNamedKey(quad.object, quad.subject);
    }

    this.blankNodeBuffer.push(quad);
  }

  protected async flush(quadSink: IQuadSink): Promise<void> {
    await super.flush(quadSink);
    await this.blankNodeBuffer.flush(quadSink);
  }
}
