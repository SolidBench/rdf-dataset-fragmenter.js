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
  shape: string;
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
  private readonly shapeMap: Record<string, IShapeEntry>;

  private readonly irisHandled: Set<string> = new Set();
  private readonly resourcesHandled: Set<string> = new Set();

  public static readonly rdfTypeNode = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  public static readonly shapeTreeNode = DF.namedNode('http://www.w3.org/ns/shapetrees#ShapeTree');
  public static readonly shapeTreeShapeNode = DF.namedNode('http://www.w3.org/ns/shapetrees#shape');
  public static readonly shapeTreeLocator = DF.namedNode('http://www.w3.org/ns/shapetrees#ShapeTreeLocator');
  public static readonly solidInstance = DF.namedNode('http://www.w3.org/ns/solid/terms#instance');
  public static readonly solidInstanceContainer = DF.namedNode('http://www.w3.org/ns/solid/terms#instanceContainer');
  public static readonly shapeIndexFileName: string = 'shapeIndex';

  /**
   * @param {Record<string, IShapeEntry>} shapeConfig - An object representing the a map like object
   * where the values follow the interface IShapeEntry @range {json}
   * @param {string} relativePath - the relatif path of the IRI
   * @param {boolean|undefined} tripleShapeTreeLocator - indicate if a shape locator triple is generated
   * @param {number|undefined} generationProbability - indicate if there is a probability [1, 100]
   * to generate shape information on a specific resource in a container @range {float}
   */
  public constructor(shapeConfig: Record<string, IShapeEntry>,
    relativePath?: string,
    tripleShapeTreeLocator?: boolean) {
    super();
    this.tripleShapeTreeLocator = tripleShapeTreeLocator;
    this.relativePath = relativePath;
    this.shapeMap = this.generateShapeMap(shapeConfig);
  }

  /**
   * Generate a map of the resource type and the shape information
   * @param {string} shapeFolder - directory containing the shape information
   * @returns {Record<string, IShapeEntry>} a map of the resource with their shape information
   */
  private generateShapeMap(shapeConfig: object): Record<string, IShapeEntry> {
    const shapeMap: Record<string, IShapeEntry> = {};
    for (const [ dataType, shapeEntry ] of Object.entries(shapeConfig)) {
      shapeMap[dataType] = {
        shape: readFileSync((<IShapeEntry>shapeEntry).shape).toString(),
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
      for (const [ resourceIndex, { shape, directory, name }] of Object.entries(this.shapeMap)) {
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

          const shapeTreeIRI = `${podIRI}/${FragmentationStrategyShape.shapeIndexFileName}`;

          // We add a triple in each file to locate the shape index if it is enable
          if (this.tripleShapeTreeLocator === true) {
            await FragmentationStrategyShape.generateShapeTreeLocator(quadSink, `${podIRI}/`, shapeTreeIRI, iri);
            this.irisHandled.add(iri);
          }

          if (!this.resourcesHandled.has(resourceId)) {
            await FragmentationStrategyShape.generateShapeIndexInformation(quadSink,
              resourceId,
              podIRI,
              shapeTreeIRI,
              directory,
              shape,
              name,
              positionContainerResourceNotInRoot === -1);
            this.irisHandled.add(iri);
            this.resourcesHandled.add(resourceId);
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
   * @param {string} podIRI - the iri of the pod
   * @param {string} shapeTreeIRI - the iri of the shapetree
   * @param {string} directory - the folder bounded binded by the shape
   * @param {string} shape - ShExC string
   * @param {string} shapeName - name of the targeted shape in the schema
   * @param {boolean} isInRootOfPod - indicate if the resource is at the root of the pod
   */
  public static async generateShapeIndexInformation(quadSink: IQuadSink,
    resourceId: string,
    podIRI: string,
    shapeTreeIRI: string,
    directory: string,
    shape: string,
    shapeName: string,
    isInRootOfPod: boolean): Promise<void> {
    const shapeIRI = `${podIRI}/${directory}_shape#${shapeName}`;
    // In Solid the path to a container end with a trailing "/"
    // hence when the resource is not in the root the content iri must be different.
    const contentIri = isInRootOfPod ? resourceId : `${podIRI}/${directory}/`;
    await FragmentationStrategyShape.generateShape(quadSink, shapeIRI, shape);
    await FragmentationStrategyShape.generateShapetreeTriples(quadSink,
      shapeTreeIRI,
      shapeIRI,
      isInRootOfPod,
      contentIri);
  }

  /**
   * Generate a triple to locate a shapetree file and push it into a quad sink
   * @param {IQuadSink} quadSink - a quad sink
   * @param {string} podIRI - the iri of the pod
   * @param {string} shapeTreeIRI - the iri of the shapetree
   * @param {string} iri - the targeted iri where the quad will be pushed
   */
  public static async generateShapeTreeLocator(quadSink: IQuadSink,
    podIRI: string,
    shapeTreeIRI: string,
    iri: string): Promise<void> {
    const shapeTreeIndicator = DF.quad(
      DF.namedNode(podIRI),
      this.shapeTreeLocator,
      DF.namedNode(shapeTreeIRI),
    );
    await quadSink.push(iri, shapeTreeIndicator);
  }

  /**
   * Generate the triples of a shapetree file that target the content and a shape
   * in a pod and push them into a quad sink .
   * The triples generated are not compliante with the shapetree specification because we are in the process
   * of creating a shape index method inspired from the type index and shapetree specification.
   * @param {IQuadSink} quadSink - a quad sink
   * @param {string} shapeTreeIRI - the iri of the shapetree
   * @param {string} shapeIRI - the iri of the target shape
   * @param {boolean} isInRootOfPod - indicate if the resource is at the root of the pod
   * @param {string} contentIri - the iri of the target resource
   */
  public static async generateShapetreeTriples(quadSink: IQuadSink,
    shapeTreeIRI: string,
    shapeIRI: string,
    isInRootOfPod: boolean,
    contentIri: string): Promise<void> {
    const blankNode = DF.blankNode();
    const shape = DF.quad(
      blankNode,
      this.shapeTreeShapeNode,
      DF.namedNode(shapeIRI),
    );
    // We need to indicate if the shape index target a single file or if it is a container that is targeted
    const target = DF.quad(
      blankNode,
      isInRootOfPod ? this.solidInstance : this.solidInstanceContainer,
      DF.namedNode(contentIri),
    );
    await quadSink.push(shapeTreeIRI, shape);
    await quadSink.push(shapeTreeIRI, target);
  }

  /**
   * Generate an ShExJ shape from a SheXC file and push the quads into a quad sink
   * @param {IQuadSink} quadSink - a quad sink
   * @param {string} shapeIRI - The iri of the target shape
   * @param {string} shapeShexc - ShExC string
   */
  public static async generateShape(quadSink: IQuadSink, shapeIRI: string, shapeShexc: string): Promise<void> {
    const shexParser = ShexParser.construct(shapeIRI);
    shapeShexc = shapeShexc.replace('$', shapeIRI);
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
}
