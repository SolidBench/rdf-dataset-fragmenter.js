import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { ResourceIdentifier } from './identifier/ResourceIdentifier';
import type { IQuadTransformer } from './IQuadTransformer';

const DF = new DataFactory();

/**
 * A quad transformer that wraps over other quad transformers,
 * and varies based on the configured resource type.
 *
 * Concretely, it will match all resources of the given type,
 * and evenly distribute these resources to the different quad transformers.
 * It will make sure that different triples from a given resources will remain coupled.
 *
 * WARNING: This transformer assumes that all the applicable resources
 * have `rdf:type` occurring as first triple with the resource IRI as subject.
 */
export class QuadTransformerCompositeVaryingResource implements IQuadTransformer {
  private readonly transformers: IQuadTransformer[];
  public readonly resourceIdentifier: ResourceIdentifier<IQuadTransformer>;

  public constructor(
    typeRegex: string,
    targetPredicateRegex: string,
    transformers: IQuadTransformer[],
  ) {
    this.transformers = transformers;
    this.resourceIdentifier = new ResourceIdentifier<IQuadTransformer>(
      typeRegex,
      targetPredicateRegex,
    );
  }

  public transform(quad: RDF.Quad): RDF.Quad[] {
    // If a subject or object in the quad has been remapped (resource has been fully defined before)
    const isBuffered = this.resourceIdentifier.isQuadBuffered(quad);
    if (!isBuffered) {
      let quads = [ quad ];
      const modified = this.resourceIdentifier.forEachMappedResource(quad, transformer => {
        quads = quads.flatMap(subQuad => transformer.transform(subQuad));
      });
      if (modified) {
        return quads;
      }
    }

    // Add buffer entry on applicable resource type
    if (this.resourceIdentifier.tryInitializingBuffer(quad)) {
      // We will emit the quad later
      return [];
    }

    // If this resource is buffered
    if (isBuffered) {
      const resource = this.resourceIdentifier.getBufferResource(quad);

      // Try to set the target
      this.resourceIdentifier.tryStoringTarget(resource, quad);

      // Check if resource is complete
      if (resource.target) {
        // Determine a transformer based on the creator IRI
        let creatorHash = 0;
        for (let i = 0; i < resource.target.value.length; i++) {
          creatorHash += resource.target.value.charCodeAt(i);
        }
        creatorHash = Math.abs(creatorHash);
        const transformerIndex = creatorHash % this.transformers.length;
        const transformer = this.transformers[transformerIndex];

        // Clear the buffer, and set rewriting rule
        this.resourceIdentifier.applyMapping(quad, transformer);

        // Flush buffered quads
        return resource.quads.flatMap(subQuad => {
          // Run through transformers in a loop until the quads don't change anymore
          let subQuadsOut = [];
          let subQuadsLoop = [ subQuad ];
          while (subQuadsOut.length !== subQuadsLoop.length) {
            subQuadsOut = subQuadsLoop;
            for (const subQuadLoop of subQuadsOut) {
              // eslint-disable-next-line @typescript-eslint/no-loop-func
              this.resourceIdentifier.forEachMappedResource(subQuadLoop, (subTransformer, component) => {
                // Pass the current quad component as allowed component to the transformer,
                // so that no other components of that quad are considered by the transformer.
                subQuadsLoop = subQuadsLoop
                  .flatMap(subSubQuadLoop => {
                    // Only map a transformer to a quad that matches.
                    if (component === 'subject' && subSubQuadLoop.subject.value === subQuadLoop.subject.value) {
                      return subTransformer.transform(subSubQuadLoop, component);
                    }
                    if (component === 'object' && subSubQuadLoop.object.value === subQuadLoop.object.value) {
                      return subTransformer.transform(subSubQuadLoop, component);
                    }
                    return subSubQuadLoop;
                  });
              });
            }
          }
          subQuadsOut = subQuadsLoop;

          return subQuadsOut;
        });
      }

      // Don't emit anything if our buffer is incomplete
      return [];
    }

    return [ quad ];
  }

  public end(): void {
    this.resourceIdentifier.onEnd();

    // Terminate all transformers
    for (const transformer of this.transformers) {
      if (transformer.end) {
        transformer.end();
      }
    }
  }
}
