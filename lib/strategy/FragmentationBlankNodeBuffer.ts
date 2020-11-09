import type * as RDF from 'rdf-js';
import { quadToStringQuad } from 'rdf-string';
import type { QuadTermName } from 'rdf-terms';
import type { IQuadSink } from '../io/IQuadSink';

/**
 * Buffers quads with blank nodes keys, and makes connections to non-blank node keys.
 */
export class FragmentationBlankNodeBuffer<A extends QuadTermName, B extends QuadTermName> {
  private readonly keyKey: A;
  private readonly keyValue: B;
  private readonly valueKeyLinks: Record<string, RDF.NamedNode[]> = {};
  private readonly pendingBlankKeyQuads: Record<string, RDF.Quad[]> = {};

  /**
   * @param keyKey @ignored The quad term key that should be checked for blank nodes.
   * @param keyValue @ignored The quad term value that may have a connection to the key.
   */
  public constructor(keyKey: A, keyValue: B) {
    this.keyKey = keyKey;
    this.keyValue = keyValue;
  }

  /**
   * Add the given quad into the buffer.
   * If the quad's key is a blank node, it will be stored inside the internal buffer.
   * @param quad An RDF quad.
   */
  public push(quad: RDF.Quad): void {
    // If key is a blank node, buffer it
    if (quad[this.keyKey].termType === 'BlankNode') {
      if (!(quad[this.keyKey].value in this.pendingBlankKeyQuads)) {
        this.pendingBlankKeyQuads[quad[this.keyKey].value] = [];
      }
      this.pendingBlankKeyQuads[quad[this.keyKey].value].push(quad);
    }
  }

  /**
   * If the given term value is a blank node, it will be stored in the internal link registry.
   * @param value A quad value term.
   * @param key A quad key term.
   */
  public materializeValueForNamedKey(value: RDF.Term, key: RDF.NamedNode): void {
    if (value.termType === 'BlankNode') {
      if (!(value.value in this.valueKeyLinks)) {
        this.valueKeyLinks[value.value] = [];
      }
      this.valueKeyLinks[value.value].push(key);
    }
  }

  /**
   * Iterate over the buffer, and emit all quads with blank node keys that have a connection to a non-blank node key.
   * @param quadSink The quad sink to push into.
   */
  public async flush(quadSink: IQuadSink): Promise<void> {
    // Loop until the pendingBlankSubjectQuads queue does not change anymore
    let changed = true;
    while (changed) {
      changed = false;
      for (const [ blankNodeLabel, quads ] of Object.entries(this.pendingBlankKeyQuads)) {
        const keys = this.valueKeyLinks[blankNodeLabel];
        if (keys) {
          for (const key of keys) {
            // Add the quad to the key's document.
            for (const quad of quads) {
              await quadSink.push(key.value, quad);

              // Add a key link for the current key, as we may need it in the next iteration
              this.materializeValueForNamedKey(quad[this.keyValue], key);
            }
          }

          // Remove the blank node label from the queue, and indicate that we need to repeat the loop
          delete this.pendingBlankKeyQuads[blankNodeLabel];
          changed = true;
        }
      }
    }

    // Error if there are unowned blank nodes
    if (Object.keys(this.pendingBlankKeyQuads).length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`Detected quads with blank node ${this.keyKey} that has no link to an IRI ${this.keyKey}:`);
      for (const quads of Object.values(this.pendingBlankKeyQuads)) {
        for (const quad of quads) {
          // eslint-disable-next-line no-console
          console.warn(`  ${JSON.stringify(quadToStringQuad(quad))}`);
        }
      }
    }
  }
}
