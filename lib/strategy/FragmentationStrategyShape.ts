import { readFileSync } from 'fs';
import type * as RDF from '@rdfjs/types';
import * as ShexParser from '@shexjs/parser';
import { JsonLdParser } from 'jsonld-streaming-parser';
import { DataFactory } from 'rdf-data-factory';
import type { IQuadSink } from '../io/IQuadSink';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';
import { FragmentationStrategySubject } from './FragmentationStrategySubject';
// eslint-disable-next-line import/extensions
import * as SHEX_CONTEXT from './shex_context.json';

const DF = new DataFactory<RDF.Quad>();

interface IShapeEntry {
  /**
   * @description the ShExC string
   */
  shapes: string[];
  /**
   * @description the directory targeted by the shape
   */
  directory: string;
  /**
   * @description name of the targeted shape in the schema
   */
  name: string;
}

export class FragmentationStrategyShape extends FragmentationStrategyStreamAdapter {
  private readonly relativePath?: string;
  private readonly tripleShapeTreeLocator?: boolean;
  /**
   * @description A map of the resource type and shape
   */
  private readonly shapeMap: Record<string, IShapeEntry>;
  /**
   * @description The resource inside a storage
   */
  private readonly contentOfStorage: Set<string>;
  /**
 * @description The iris handled
 */
  private readonly irisHandled: Set<string> = new Set();

  /**
   * A map of the shape name with a function to generate a shape Iri
   */
  public readonly shapeIriMap: Record<string, (podIri: string) => string>;

  /**
   * @description A map of the storage and the resource type handled
   */
  private readonly contentHandledByPod: Map<string, Set<string>> = new Map();

  public static readonly SHAPE_INDEX_FILE_NAME: string = 'shapeIndex';

  public static readonly SHAPE_INDEX_PREFIX = 'https://shapeIndex.com#';

  public static readonly RDF_TYPE_NODE = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  public static readonly RDF_TRUE = DF.literal('true', DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean'));

  public static readonly SHAPE_INDEX_LOCATION_NODE = DF.namedNode(`${FragmentationStrategyShape.SHAPE_INDEX_PREFIX}shapeIndexLocation`);
  public static readonly SHAPE_INDEX_CLASS_NODE = DF.namedNode(`${FragmentationStrategyShape.SHAPE_INDEX_PREFIX}ShapeIndex`);
  public static readonly SHAPE_INDEX_ENTRY_NODE = DF.namedNode(`${FragmentationStrategyShape.SHAPE_INDEX_PREFIX}entry`);
  public static readonly SHAPE_INDEX_BIND_BY_SHAPE_NODE = DF.namedNode(`${FragmentationStrategyShape.SHAPE_INDEX_PREFIX}bindByShape`);
  public static readonly SHAPE_INDEX_DOMAIN_NODE = DF.namedNode(`${FragmentationStrategyShape.SHAPE_INDEX_PREFIX}domain`);
  public static readonly SHAPE_INDEX_IS_COMPLETE_NODE = DF.namedNode(`${FragmentationStrategyShape.SHAPE_INDEX_PREFIX}isComplete`);

  public static readonly SOLID_INSTANCE_NODE = DF.namedNode('http://www.w3.org/ns/solid/terms#instance');
  public static readonly SOLID_INSTANCE_CONTAINER_NODE =
  DF.namedNode('http://www.w3.org/ns/solid/terms#instanceContainer');

  /**
   * @param {Record<string, IShapeEntry>} shapeConfig - A map of the shape path
   * where the values follow the interface IShapeEntry @range {json}
   * @param {string[]} contentOfStorage - The content of a storage
   * @param {string} relativePath - the relatif path of the IRI
   * @param {boolean|undefined} tripleShapeTreeLocator - indicate if a shape locator triple is generated
   */
  public constructor(
    shapeConfig: Record<string, IShapeEntry>,
    contentOfStorage: string[],
    relativePath?: string,
    tripleShapeTreeLocator?: boolean,
  ) {
    super();
    if (contentOfStorage.length === 0) {
      throw new Error('there should be at least one content type in the resource');
    }

    this.tripleShapeTreeLocator = tripleShapeTreeLocator;
    this.relativePath = relativePath;
    this.shapeMap = this.generateShapeMap(shapeConfig);
    this.contentOfStorage = new Set(contentOfStorage);
    this.shapeIriMap = this.generateShapeIriMap();
  }

  /**
   * Generate a map of functions to generate the shape IRI
   * @returns {Record<string, (podIri: string) => string>}
   */
  private generateShapeIriMap(): Record<string, (podIri: string) => string> {
    const resp: Record<string, (podIri: string) => string> = {};
    for (const { directory, name } of Object.values(this.shapeMap)) {
      resp[name] = (podIri: string) => `${podIri}/${directory}_shape#${name}`;
    }
    return resp;
  }

  /**
   * Generate a map of the resource type and the shape template
   * @param {Record<string, IShapeEntry[]>} shapeConfig - A map of the shape path
   * @returns {Record<string, IShapeEntry>} a map of the resource with their shape temple
   */
  private generateShapeMap(shapeConfig: object): Record<string, IShapeEntry> {
    const shapeMap: Record<string, IShapeEntry> = {};
    for (const [ dataType, shapeEntry ] of Object.entries(shapeConfig)) {
      if (shapeEntry.shapes.length === 0) {
        throw new Error('every resource type defined should have at least one entry');
      }
      const shapes = [];
      for (const shape of shapeEntry.shapes) {
        shapes.push(readFileSync(shape).toString());
      }
      shapeMap[dataType] = {
        shapes,
        directory: (<IShapeEntry>shapeEntry).directory,
        name: (<IShapeEntry>shapeEntry).name,
      };
    }
    return shapeMap;
  }

  /**
   * From a quad generate the IRI based on the {@link FragmentationStrategySubject}.
   * Evaluate if shape index information should be generated based on which quad has been handled and
   * the shape config file provides. Generate the right iri for the shape indexes.
   * The generation of the triples and the quad sink pushing is handled by other functions called by
   * handleQuad.
   * @param {RDF.Quad} quad - a quad
   * @param {IQuadSink} quadSink - a quad sink
   */
  public async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    // We cannot derive the resource type from a blank node
    if (quad.subject.termType === 'BlankNode') {
      return;
    }
    const iri = FragmentationStrategySubject.generateIri(quad, this.relativePath);
    // If iri already has been handled, we do nothing
    if (!this.irisHandled.has(iri)) {
      for (const [ resourceIndex, { shapes, directory, name: shapeName }] of Object.entries(this.shapeMap)) {
        // Find the position of the first character of the container
        const positionContainerResourceNotInRoot = iri.indexOf(`/${directory}/`);
        const positionContainerResourceInRoot = iri.indexOf(`/${resourceIndex}`);
        const positionContainer = positionContainerResourceNotInRoot !== -1 ?
          positionContainerResourceNotInRoot :
          positionContainerResourceInRoot;

        // We use as an id the path of the iri until the resource identifier.
        // It is a different discrimination mechanism than the one related to the iri because even
        // if we don't want to add shape index information we might want to add shapeTreeLocator in
        // every resource bounded by a shape.
        const resourceId = `${iri.slice(0, Math.max(0, positionContainer))}/${resourceIndex}`;
        if (positionContainer !== -1) {
          const podIRI = iri.slice(0, Math.max(0, positionContainer));

          const shapeIndexIri = `${podIRI}/${FragmentationStrategyShape.SHAPE_INDEX_FILE_NAME}`;

          // We add a triple in each file to locate the shape index if it is enable
          if (this.tripleShapeTreeLocator === true) {
            await FragmentationStrategyShape.generateShapeIndexLocationTriple(quadSink, `${podIRI}/`, shapeIndexIri, iri);
            this.irisHandled.add(iri);
          }

          let contentHandled = this.contentHandledByPod.get(podIRI);

          if (contentHandled === undefined || !contentHandled.has(resourceIndex)) {
            const randomIndex = Math.floor(Math.random() * (shapes.length - 1));
            const shape = shapes[randomIndex];

            if (contentHandled === undefined) {
              await FragmentationStrategyShape.instanciateShapeIndex(quadSink, shapeIndexIri, podIRI);
              this.contentHandledByPod.set(podIRI, new Set([ resourceIndex ]));
            } else {
              contentHandled.add(resourceIndex);
            }

            this.irisHandled.add(iri);

            await FragmentationStrategyShape.generateShapeIndexEntryInformation(quadSink,
              resourceId,
              podIRI,
              shapeIndexIri,
              shapeName,
              directory,
              shape,
              this.shapeIriMap,
              positionContainerResourceNotInRoot === -1);

            contentHandled = this.contentHandledByPod.get(podIRI);
            await FragmentationStrategyShape.setTheCompletenessOfTheShapeIndex(
              quadSink,
              // It will not be undefined because we add the value if it was undefined
              contentHandled!,
              this.contentOfStorage,
              shapeIndexIri,
            );
            return;
          }
        }
      }
    }
    this.irisHandled.add(iri);
  }

  /**
   * Generate all the mandatory shape index information and push them into a quad sink
   * @param {IQuadSink} quadSink - a quad sink
   * @param {string} resourceId - the id of the resource, may be used to locate the target of the shape index
   * @param {string} podIri - the iri of the pod
   * @param {string} shapeIndexIri - the iri of the shapetree
   * @param {string} shapeName - name of the targeted shape in the schema
   * @param {string} directory - the directory of the content
   * @param {string} shape - A shape template
   * @param {Record<string, (podIri: string) => string>} shapeIriMap - a map of the shape iri
   * @param {boolean} isInRootOfPod - indicate if the resource is at the root of the pod
   */
  public static async generateShapeIndexEntryInformation(quadSink: IQuadSink,
    resourceId: string,
    podIri: string,
    shapeIndexIri: string,
    shapeName: string,
    directory: string,
    shape: string,
    shapeIriMap: Record<string, (podIri: string) => string>,
    isInRootOfPod: boolean): Promise<void> {
    const shapeIRI = shapeIriMap[shapeName](podIri);
    // In Solid the path to a container end with a trailing "/"
    // hence when the resource is not in the root the content iri must be different.
    const contentIri = isInRootOfPod ? resourceId : `${podIri}/${directory}/`;
    await FragmentationStrategyShape.generateShape(quadSink, shapeIRI, shapeIriMap, shape, podIri);
    await FragmentationStrategyShape.generateShapeIndexEntry(quadSink,
      shapeIndexIri,
      shapeIRI,
      isInRootOfPod,
      contentIri);
  }

  /**
   * Generate a triple to locate a shape index file and push it into a quad sink
   * @param {IQuadSink} quadSink - a quad sink
   * @param {string} podIRI - the iri of the pod
   * @param {string} shapeIndexIri - the iri of the shapetree
   * @param {string} iri - the targeted iri where the quad will be pushed
   */
  public static async generateShapeIndexLocationTriple(quadSink: IQuadSink,
    podIRI: string,
    shapeIndexIri: string,
    iri: string): Promise<void> {
    const shapeTreeIndicator = DF.quad(
      DF.namedNode(podIRI),
      this.SHAPE_INDEX_LOCATION_NODE,
      DF.namedNode(shapeIndexIri),
    );
    await quadSink.push(iri, shapeTreeIndicator);
  }

  /**
   * Generate the triples of a shapetree file that target the content and a shape
   * in a pod and push them into a quad sink .
   * The triples generated are not compliante with the shape index specification because we are in the process
   * of creating a shape index method inspired from the type index and shapetree specification.
   * @param {IQuadSink} quadSink - a quad sink
   * @param {string} shapeIndexIri - the iri of the shape index
   * @param {string} shapeIRI - the iri of the target shape
   * @param {boolean} isInRootOfPod - indicate if the resource is at the root of the pod
   * @param {string} contentIri - the iri of the target resource
   */
  public static async generateShapeIndexEntry(quadSink: IQuadSink,
    shapeIndexIri: string,
    shapeIRI: string,
    isInRootOfPod: boolean,
    contentIri: string): Promise<void> {
    const shapeIndexNode = DF.namedNode(shapeIndexIri);
    const currentEntry = DF.blankNode();

    const entryTypeDefinition = DF.quad(
      shapeIndexNode,
      this.SHAPE_INDEX_ENTRY_NODE,
      currentEntry,
    );
    const bindByShape = DF.quad(
      currentEntry,
      this.SHAPE_INDEX_BIND_BY_SHAPE_NODE,
      DF.namedNode(shapeIRI),
    );

    // We need to indicate if the shape index target a single file or if it is a container that is targeted
    const target = DF.quad(
      currentEntry,
      isInRootOfPod ? this.SOLID_INSTANCE_NODE : this.SOLID_INSTANCE_CONTAINER_NODE,
      DF.namedNode(contentIri),
    );
    await quadSink.push(shapeIndexIri, entryTypeDefinition);
    await quadSink.push(shapeIndexIri, bindByShape);
    await quadSink.push(shapeIndexIri, target);
  }

  /**
   * Instanciate a shape index
   * @param {IQuadSink} quadSink - a quad sink
   * @param {string} shapeIndexIri - the iri of the shape index
   * @param {string} podIRI - the iri of the pod
   */
  public static async instanciateShapeIndex(quadSink: IQuadSink, shapeIndexIri: string, podIRI: string): Promise<void> {
    const shapeIndexNode = DF.namedNode(shapeIndexIri);
    const typeDefinition = DF.quad(
      shapeIndexNode,
      FragmentationStrategyShape.RDF_TYPE_NODE,
      FragmentationStrategyShape.SHAPE_INDEX_CLASS_NODE,
    );

    const domain = DF.quad(
      shapeIndexNode,
      FragmentationStrategyShape.SHAPE_INDEX_DOMAIN_NODE,
      DF.namedNode(`${podIRI}/.*`),
    );

    await quadSink.push(shapeIndexIri, typeDefinition);
    await quadSink.push(shapeIndexIri, domain);
  }

  /**
   * Add a triple to set if the shape index is complete based
   * on if all the entry of the storage has been defined
   * @param quadSink - a quad sink
   * @param handledResources - the resource that has been handled
   * @param expectedResources - all the resource of the storage
   * @param shapeIndexIri - the iri of the shape index
   */
  public static async setTheCompletenessOfTheShapeIndex(
    quadSink: IQuadSink,
    handledResources: Set<string>,
    expectedResources: Set<string>,
    shapeIndexIri: string,
  ): Promise<void> {
    // We check if all the resource has been handled
    if (handledResources.size !== expectedResources.size) {
      return;
    }
    for (const val of handledResources) {
      if (!expectedResources.has(val)) {
        return;
      }
    }
    // All the resource has been handled so we indicate it with a triple
    const isComplete = DF.quad(
      DF.namedNode(shapeIndexIri),
      this.SHAPE_INDEX_IS_COMPLETE_NODE,
      this.RDF_TRUE,
    );

    await quadSink.push(shapeIndexIri, isComplete);
  }

  /**
   * Generate an ShExJ shape from a SheXC file and push the quads into a quad sink
   * @param {IQuadSink} quadSink - a quad sink
   * @param {string} shapeIRI - The iri of the target shape
   * @param {Record<string, (podIri: string) => string>} shapeIriMap - a map of the shape iri
   * @param {string} shapeShexc - ShExC string
   * @param {string} podIri - the iri of the pod
   */
  public static async generateShape(quadSink: IQuadSink,
    shapeIRI: string,
    shapeIriMap: Record<string, (podIri: string) => string>,
    shapeShexc: string,
    podIri: string): Promise<void> {
    const shexParser = ShexParser.construct(shapeIRI);
    shapeShexc = this.transformShapeTemplateIntoShape(shapeShexc, shapeIRI, podIri, shapeIriMap);
    const shapeJSONLD = shexParser.parse(shapeShexc);
    const stringShapeJsonLD = JSON.stringify(shapeJSONLD);
    const quads: RDF.Quad[] = [];

    return new Promise((resolve, reject) => {
      // The jsonLD is not valid without the context field and the library doesn't include it
      // because a ShExJ MAY contain a @context field
      // https://shex.io/shex-semantics/#shexj
      const jsonldParser = new JsonLdParser({
        streamingProfile: false,
        context: SHEX_CONTEXT,
        skipContextValidation: true,
      });
      jsonldParser
        .on('data', async(quad: RDF.Quad) => {
          quads.push(quad);
        })
        // We ignore this because it is difficult to provide a valid ShEx document that
        // would not be parsable in RDF given it has been already parsed in ShExJ

        // eslint-disable-next-line no-inline-comments
        .on('error', /* istanbul ignore next */(error: any) => {
          reject(error);
        })
        .on('end', async() => {
          for (const quad of quads) {
            await quadSink.push(shapeIRI, quad);
          }
          resolve();
        });

      jsonldParser.write(stringShapeJsonLD);
      jsonldParser.end();
    });
  }

  /**
   * Transform a shape template into a shape
   * @param {string} shapeShexc - the shape template
   * @param {string} shapeIRI - the shape Iri
   * @param {string} podIri - the iri of the pod
   * @param {Record<string, (podIri: string) => string>} shapeIriMap - a map of the shape iri
   * @returns {string} A shape
   */
  public static transformShapeTemplateIntoShape(shapeShexc: string,
    shapeIRI: string,
    podIri: string,
    shapeIriMap: Record<string, (podIri: string) => string>): string {
    shapeShexc = shapeShexc.replace('$', shapeIRI);
    for (const [ key, shapeIriFn ] of Object.entries(shapeIriMap)) {
      shapeShexc = shapeShexc.replaceAll(`{:${key}}`, shapeIriFn(podIri));
    }
    return shapeShexc;
  }
}
