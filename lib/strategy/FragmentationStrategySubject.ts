import type * as RDF from 'rdf-js';
import { quadToStringQuad } from 'rdf-string';
import type { IQuadSink } from '../io/IQuadSink';
import { FragmentationStrategyAdapter } from './FragmentationStrategyAdapter';

/**
 * A fragmentation strategy that places quads into their subject's document.
 */
export class FragmentationStrategySubject extends FragmentationStrategyAdapter {
  private readonly objectSubjectLinks: Record<string, RDF.NamedNode[]> = {};
  private readonly pendingBlankSubjectQuads: Record<string, RDF.Quad[]> = {};

  protected async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    // Only accept IRI subjects.
    if (quad.subject.termType === 'NamedNode') {
      // If the subject is a named node, add the quad to the subject's document.
      await quadSink.push(quad.subject.value, quad);

      // If the object is a blank node, save it for later use in buffer handling
      this.handleObjectSubjectLink(quad.object, quad.subject);
    } else if (quad.subject.termType === 'BlankNode') {
      // If subject is a blank node, buffer it
      if (!(quad.subject.value in this.pendingBlankSubjectQuads)) {
        this.pendingBlankSubjectQuads[quad.subject.value] = [];
      }
      this.pendingBlankSubjectQuads[quad.subject.value].push(quad);
    }
  }

  protected handleObjectSubjectLink(object: RDF.Term, subject: RDF.NamedNode): void {
    if (object.termType === 'BlankNode') {
      if (!(object.value in this.objectSubjectLinks)) {
        this.objectSubjectLinks[object.value] = [];
      }
      this.objectSubjectLinks[object.value].push(subject);
    }
  }

  protected async flush(quadSink: IQuadSink): Promise<void> {
    await super.flush(quadSink);

    // Loop until the pendingBlankSubjectQuads queue does not change anymore
    let changed = true;
    while (changed) {
      changed = false;
      for (const [ blankNodeLabel, quads ] of Object.entries(this.pendingBlankSubjectQuads)) {
        const subjects = this.objectSubjectLinks[blankNodeLabel];
        if (subjects) {
          for (const subject of subjects) {
            // Add the quad to the subject's document.
            for (const quad of quads) {
              await quadSink.push(subject.value, quad);

              // Add a subject link for the current subject, as we may need it in the next iteration
              this.handleObjectSubjectLink(quad.object, subject);
            }
          }

          // Remove the blank node label from the queue, and indicate that we need to repeat the loop
          delete this.pendingBlankSubjectQuads[blankNodeLabel];
          changed = true;
        }
      }
    }

    // Error if there are unowned blank nodes
    if (Object.keys(this.pendingBlankSubjectQuads).length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`Detected quads with blank node subject that has no link to an IRI subject:`);
      for (const quads of Object.values(this.pendingBlankSubjectQuads)) {
        for (const quad of quads) {
          // eslint-disable-next-line no-console
          console.warn(`  ${JSON.stringify(quadToStringQuad(quad))}`);
        }
      }
    }
  }
}
