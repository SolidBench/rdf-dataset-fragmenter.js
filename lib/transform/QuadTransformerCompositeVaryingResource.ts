import type * as RDF from '@rdfjs/types';
import { ResourceIdentifier } from './identifier/ResourceIdentifier';
import type { IQuadTransformer } from './IQuadTransformer';

/**
 * A quad transformer that wraps over other quad transformers,
 * and varies between based based on the configured resource type.
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
    this.resourceIdentifier = new ResourceIdentifier<IQuadTransformer>(typeRegex, targetPredicateRegex);
  }

  public transform(quad: RDF.Quad): RDF.Quad[] {
    // If a subject or object in the quad has been remapped (resource has been fully defined before)
    let quads = [ quad ];
    const modified = this.resourceIdentifier.forEachMappedResource(quad, transformer => {
      quads = quads.flatMap(subQuad => transformer.transform(subQuad));
    });
    if (modified) {
      return quads;
    }

    // Add buffer entry on applicable resource type
    if (this.resourceIdentifier.tryInitializingBuffer(quad)) {
      // We will emit the quad later
      return [];
    }

    // If this resource is buffered
    if (this.resourceIdentifier.isQuadBuffered(quad)) {
      const resource = this.resourceIdentifier.getBufferResource(quad);

      // Try to set the target
      this.resourceIdentifier.tryStoringTarget(resource, quad);

      // Check if resource is complete
      if (resource.target) {
        // Determine a transformer based on the creator IRI
        let creatorHash = 0;
        for (let i = 0; i < resource.target.value.length; i++) {
          // eslint-disable-next-line no-bitwise
          creatorHash += resource.target.value.charCodeAt(i);
        }
        creatorHash = Math.abs(creatorHash);
        const transformerIndex = creatorHash % this.transformers.length;
        const transformer = this.transformers[transformerIndex];

        // Clear the buffer, and set rewriting rule
        this.resourceIdentifier.applyMapping(quad, transformer);

        // Flush buffered quads
        return resource.quads.flatMap(subQuad => transformer.transform(subQuad));
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
