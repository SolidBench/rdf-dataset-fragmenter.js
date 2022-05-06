import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { resolve } from 'relative-to-absolute-iri';
import { ResourceIdentifier } from './identifier/ResourceIdentifier';
import type { IQuadTransformer } from './IQuadTransformer';
import type { IValueModifier } from './value/IValueModifier';

const DF = new DataFactory();

/**
 * A quad transformer that matches all resources of the given type,
 * and rewrites its (subject) IRI (across all triples) so that it becomes part of the targeted resource.
 *
 * For example, a transformer matching on type `Post` for identifier predicate `hasId` and target predicate `hasCreator`
 * will modify all post IRIs to become a hash-based IRI inside the object IRI of `hasCreator`.
 * Concretely, `<ex:post1> a <Post>. <ex:post1> <hasId> '1'. <ex:post1> <hasCreator> <urn:person1>`
 * will become
 * `<urn:person1#Post1> a <Post>. <urn:person1#Post1> <hasId> '1'. <urn:person1#post1> <hasCreator> <urn:person1>`.
 *
 * WARNING: This transformer assumes that all the applicable resources
 * have `rdf:type` occurring as first triple with the resource IRI as subject.
 */
export class QuadTransformerRemapResourceIdentifier implements IQuadTransformer {
  private readonly newIdentifierSeparator: string;
  private readonly identifierPredicate: RegExp;
  private readonly identifierValueModifier: IValueModifier | undefined;
  private readonly keepSubjectFragment: boolean;
  public readonly resourceIdentifier: ResourceIdentifier<RDF.NamedNode>;

  /**
   * @param newIdentifierSeparator Separator string to use inbetween the target IRI and the identifier value
   *                               when minting a new resource IRI. This may also be a relative IRI.
   * @param typeRegex The RDF type that should be used to capture resources.
   * @param identifierPredicateRegex Predicate regex that contains a resource identifier.
   * @param targetPredicateRegex Predicate regex that contains an IRI onto which the resource identifier should be
   *                             remapped.
   * @param identifierValueModifier An optional value modifier that will be applied on matched identifier values.
   * @param keepSubjectFragment If the fragment of the original subject should be inherited onto the new identifier IRI.
   */
  public constructor(
    newIdentifierSeparator: string,
    typeRegex: string,
    identifierPredicateRegex: string,
    targetPredicateRegex: string,
    identifierValueModifier: IValueModifier | undefined,
    keepSubjectFragment: boolean | undefined,
  ) {
    this.newIdentifierSeparator = newIdentifierSeparator;
    this.identifierPredicate = new RegExp(identifierPredicateRegex, 'u');
    this.resourceIdentifier = new ResourceIdentifier<RDF.NamedNode>(
      typeRegex,
      targetPredicateRegex,
    );
    this.identifierValueModifier = identifierValueModifier;
    this.keepSubjectFragment = Boolean(keepSubjectFragment);
  }

  public transform(quad: RDF.Quad): RDF.Quad[] {
    // If a subject or object in the quad has been remapped (resource has been fully defined before)
    const modified = this.resourceIdentifier.forEachMappedResource(quad, (mapping, component) => {
      if (component === 'subject') {
        quad = DF.quad(mapping, quad.predicate, quad.object, quad.graph);
      } else {
        quad = DF.quad(quad.subject, quad.predicate, mapping, quad.graph);
      }
    });
    if (modified) {
      return [ quad ];
    }

    // Add buffer entry on applicable resource type
    if (this.resourceIdentifier.tryInitializingBuffer(quad)) {
      // We will emit the quad later
      return [];
    }

    // If this resource is buffered
    if (this.resourceIdentifier.isQuadBuffered(quad)) {
      const resource = this.resourceIdentifier.getBufferResource(quad);

      // Try to set the id
      if (this.identifierPredicate.exec(quad.predicate.value)) {
        if (resource.id) {
          throw new Error(`Illegal overwrite of identifier value on resource '${quad.subject.value}'`);
        }
        resource.id = quad.object;

        // Modify the value if needed
        if (this.identifierValueModifier) {
          resource.id = this.identifierValueModifier.apply(resource.id);
        }
      }

      // Try to set the target
      this.resourceIdentifier.tryStoringTarget(resource, quad);

      // Check if resource is complete
      if (resource.id && resource.target) {
        // Determine new resource IRI
        let resourceIri = DF.namedNode(
          resolve(this.newIdentifierSeparator + resource.id.value, resource.target.value),
        );

        // Inherit fragment if needed
        if (this.keepSubjectFragment) {
          const fragmentPos = quad.subject.value.indexOf('#');
          if (fragmentPos >= 0) {
            const fragment = quad.subject.value.slice(fragmentPos);
            resourceIri = DF.namedNode(resourceIri.value + fragment);
          }
        }

        // Clear the buffer, and set rewriting rule
        this.resourceIdentifier.applyMapping(quad, resourceIri);

        // Flush buffered quads
        return resource.quads
          .map(subQuad => DF.quad(resourceIri, subQuad.predicate, subQuad.object, subQuad.graph));
      }

      // Don't emit anything if our buffer is incomplete
      return [];
    }

    return [ quad ];
  }

  public end(): void {
    this.resourceIdentifier.onEnd();
  }
}
