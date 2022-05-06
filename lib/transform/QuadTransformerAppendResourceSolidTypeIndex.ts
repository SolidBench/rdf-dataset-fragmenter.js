import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';

import { resolve } from 'relative-to-absolute-iri';
import { ResourceIdentifier } from './identifier/ResourceIdentifier';
import type { IQuadTransformer } from './IQuadTransformer';

const DF = new DataFactory();

/**
 * A quad transformer that appends SCL policies to resources of the given type.
 */
export class QuadTransformerAppendResourceSolidTypeIndex implements IQuadTransformer {
  public static readonly PREFIX_SOLID = 'http://www.w3.org/ns/solid/terms#';
  public static readonly IRI_SOLID_PUBLIC_TYPE_INDEX = DF.namedNode(`${QuadTransformerAppendResourceSolidTypeIndex.PREFIX_SOLID}publicTypeIndex`);
  public static readonly IRI_SOLID_TYPE_INDEX = DF.namedNode(`${QuadTransformerAppendResourceSolidTypeIndex.PREFIX_SOLID}TypeIndex`);
  public static readonly IRI_SOLID_LISTED_DOCUMENT = DF.namedNode(`${QuadTransformerAppendResourceSolidTypeIndex.PREFIX_SOLID}ListedDocument`);
  public static readonly IRI_SOLID_TYPE_REGISTRATION = DF.namedNode(`${QuadTransformerAppendResourceSolidTypeIndex.PREFIX_SOLID}TypeRegistration`);
  public static readonly IRI_SOLID_FOR_CLASS = DF.namedNode(`${QuadTransformerAppendResourceSolidTypeIndex.PREFIX_SOLID}forClass`);
  public static readonly IRI_SOLID_INSTANCE = DF.namedNode(`${QuadTransformerAppendResourceSolidTypeIndex.PREFIX_SOLID}instance`);
  public static readonly IRI_SOLID_INSTANCE_CONTAINER = DF.namedNode(`${QuadTransformerAppendResourceSolidTypeIndex.PREFIX_SOLID}instanceContainer`);
  public static readonly IRI_A = DF.namedNode(`http://www.w3.org/1999/02/22-rdf-syntax-ns#type`);

  public readonly resourceIdentifier: ResourceIdentifier<boolean>;
  private readonly typeIndex: string;
  private readonly entrySuffix: string;
  private readonly entryReference: string;
  private readonly entryContainer: boolean;

  /**
   * @param typeRegex The RDF type that should be used to capture resources.
   * @param profilePredicateRegex Predicate regex on the resource that contains a reference to the relevant Solid
   *                              profile.
   * @param typeIndex URL relative to the Solid profile URL for the type index.
   * @param entrySuffix String to append to the type index entry.
   * @param entryReference URL relative to the Solid profile URL for the type index instances reference.
   * @param entryContainer If the `entryReference` refers to a Solid container, otherwise it refers to a single index
   *                       file.
   */
  public constructor(
    typeRegex: string,
    profilePredicateRegex: string,
    typeIndex: string,
    entrySuffix: string,
    entryReference: string,
    entryContainer: boolean,
  ) {
    this.resourceIdentifier = new ResourceIdentifier<boolean>(
      typeRegex,
      profilePredicateRegex,
    );
    this.typeIndex = typeIndex;
    this.entrySuffix = entrySuffix;
    this.entryReference = entryReference;
    this.entryContainer = entryContainer;
  }

  public transform(quad: RDF.Quad): RDF.Quad[] {
    const returnQuads: RDF.Quad[] = [ quad ];

    // Add buffer entry on applicable resource type
    this.resourceIdentifier.tryInitializingBuffer(quad);

    // If this resource is buffered
    if (this.resourceIdentifier.isQuadBuffered(quad)) {
      const resource = this.resourceIdentifier.getBufferResource(quad);

      // Try to set the target
      this.resourceIdentifier.tryStoringTarget(resource, quad);

      // Check if resource is complete
      if (resource.target) {
        const typeIndex = DF.namedNode(resolve(this.typeIndex, resource.target.value));

        // Push quad for link from target profile to type index
        returnQuads.push(DF.quad(
          resource.target,
          QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_PUBLIC_TYPE_INDEX,
          typeIndex,
        ));

        // Push quads for the type index definition
        returnQuads.push(DF.quad(
          typeIndex,
          QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
          QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_TYPE_INDEX,
        ));
        returnQuads.push(DF.quad(
          typeIndex,
          QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
          QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_LISTED_DOCUMENT,
        ));

        // Push quads for type index entry
        const typeIndexEntry = DF.namedNode(typeIndex.value + this.entrySuffix);
        returnQuads.push(DF.quad(
          typeIndexEntry,
          QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
          QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_TYPE_REGISTRATION,
        ));
        returnQuads.push(DF.quad(
          typeIndexEntry,
          QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_FOR_CLASS,
          resource.type,
        ));
        returnQuads.push(DF.quad(
          typeIndexEntry,
          this.entryContainer ?
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_INSTANCE_CONTAINER :
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_INSTANCE,
          DF.namedNode(resolve(this.entryReference, resource.target.value)),
        ));

        // Clear the buffer, and set rewriting rule
        this.resourceIdentifier.applyMapping(quad, true);
      }
    }

    return returnQuads;
  }
}
