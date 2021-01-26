import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

import type { IQuadTransformer } from './IQuadTransformer';

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
export class QuadTransformerResourceTypeToPredicateTargetHash implements IQuadTransformer {
  private readonly hashPrefix: string;
  private readonly type: RegExp;
  private readonly identifierPredicate: RegExp;
  private readonly targetPredicate: RegExp;

  public readonly buffer: Record<string, IResource>;
  public readonly subjectMapping: Record<string, RDF.NamedNode>;

  public constructor(
    hashPrefix: string,
    typeRegex: string,
    identifierPredicateRegex: string,
    targetPredicateRegex: string,
  ) {
    this.hashPrefix = hashPrefix;
    this.type = new RegExp(typeRegex, 'u');
    this.identifierPredicate = new RegExp(identifierPredicateRegex, 'u');
    this.targetPredicate = new RegExp(targetPredicateRegex, 'u');

    this.buffer = {};
    this.subjectMapping = {};
  }

  public transform(quad: RDF.Quad): RDF.Quad[] {
    // If this subject has been remapped (resource has been fully defined before)
    if (quad.subject.termType === 'NamedNode' && this.subjectMapping[quad.subject.value]) {
      return [ DF.quad(this.subjectMapping[quad.subject.value], quad.predicate, quad.object, quad.graph) ];
    }

    // Add buffer entry on applicable resource type
    if (quad.subject.termType === 'NamedNode' &&
      quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
      quad.object.termType === 'NamedNode' && this.type.exec(quad.object.value)) {
      this.buffer[quad.subject.value] = { quads: [ quad ]};

      // We will emit the quad later
      return [];
    }

    // If this resource is buffered
    if (quad.subject.termType === 'NamedNode' && this.buffer[quad.subject.value]) {
      const resource = this.buffer[quad.subject.value];

      // Try to set the id
      if (this.identifierPredicate.exec(quad.predicate.value)) {
        if (quad.object.termType !== 'Literal') {
          throw new Error(`Expected identifier value of type Literal on resource '${quad.subject.value}'`);
        }
        if (resource.id) {
          throw new Error(`Illegal overwrite of identifier value on resource '${quad.subject.value}'`);
        }
        resource.id = quad.object.value;
      }

      // Try to set the creator
      if (this.targetPredicate.exec(quad.predicate.value)) {
        if (quad.object.termType !== 'NamedNode') {
          throw new Error(`Expected target value of type NamedNode on resource '${quad.subject.value}'`);
        }
        if (resource.creator) {
          throw new Error(`Illegal overwrite of target value on resource '${quad.subject.value}'`);
        }
        resource.creator = quad.object;
      }

      // Append the full quad
      resource.quads.push(quad);

      // Check if resource is complete
      if (resource.id && resource.creator) {
        // Determine new resource IRI
        const hashPos = resource.creator.value.indexOf('#');
        const separator = hashPos < 0 ? '#' : '_';
        const resourceIri = DF.namedNode(resource.creator.value + separator + this.hashPrefix + resource.id);

        // Clear the buffer, and set rewriting rule
        delete this.buffer[quad.subject.value];
        this.subjectMapping[quad.subject.value] = resourceIri;

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
    // After processing is done, check if buffer is clear
    if (Object.keys(this.buffer).length > 0) {
      throw new Error(`Detected non-finalized resources in the buffer: ${Object.keys(this.buffer)}`);
    }
  }
}

export interface IResource {
  id?: string;
  creator?: RDF.NamedNode;
  quads: RDF.Quad[];
}
