import { readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type * as RDF from '@rdfjs/types';
import * as ShexParser from '@shexjs/parser';
import { JsonLdParser } from 'jsonld-streaming-parser';
import { DataFactory } from 'rdf-data-factory';
import type { IQuadSink } from '../io/IQuadSink';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';
import { FragmentationStrategySubject } from './FragmentationStrategySubject';
// eslint-disable-next-line import/extensions
import SHEX_CONTEXT from './shex_context.json';

const DF = new DataFactory<RDF.Quad>();

interface IShapeEntry {
  shape: string;
  folder: string;
}

export class FragmentationStrategyShape extends FragmentationStrategyStreamAdapter {
  private readonly relativePath?: string;
  private readonly tripleShapeTreeLocator?: boolean;
  private readonly shapeMap: Map<string, IShapeEntry>;

  private readonly iriHandled: Set<string> = new Set();
  private readonly resourceHandled: Set<string> = new Set();

  public static readonly rdfTypeNode = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  public static readonly shapeTreeNode = DF.namedNode('http://www.w3.org/ns/shapetrees#ShapeTree');
  public static readonly shapeTreeShapeNode = DF.namedNode('http://www.w3.org/ns/shapetrees#shape');
  public static readonly shapeTreeLocator = DF.namedNode('http://www.w3.org/ns/shapetrees#ShapeTreeLocator');
  public static readonly solidInstance = DF.namedNode('http://www.w3.org/ns/solid/terms#instance');
  public static readonly solidInstanceContainer = DF.namedNode('http://www.w3.org/ns/solid/terms#instanceContainer');
  public static readonly shapeTreeFileName: string = 'shapetree';

  public constructor(shapeFolder: string, relativePath?: string, tripleShapeTreeLocator?: boolean) {
    super();
    this.tripleShapeTreeLocator = tripleShapeTreeLocator;
    this.relativePath = relativePath;
    this.shapeMap = this.generateShapeMap(shapeFolder);
  }

  private generateShapeMap(shapeFolder: string): Map<string, IShapeEntry> {
    const shapeMap: Map<string, IShapeEntry> = new Map();
    const config = JSON.parse(readFileSync(join(shapeFolder, 'config.json')).toString());
    const shapes = config.shapes;
    for (const [ dataType, shapeEntry ] of Object.entries(shapes)) {
      shapeMap.set(dataType, {
        shape: join(shapeFolder, (<IShapeEntry>shapeEntry).shape),
        folder: (<IShapeEntry>shapeEntry).folder,
      });
    }
    return shapeMap;
  }

  protected async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    const iri = FragmentationStrategySubject.generateIri(quad, this.relativePath);
    if (!this.iriHandled.has(iri)) {
      for (const [ resourceIndex, { shape, folder }] of this.shapeMap) {
        const positionContainerResourceNotInRoot = iri.indexOf(`/${folder}/`);
        const positionContainerResourceIsRoot = iri.indexOf(`/${resourceIndex}`);

        if (positionContainerResourceNotInRoot !== -1 || positionContainerResourceIsRoot !== -1) {
          const resourceId = positionContainerResourceNotInRoot !== -1 ?
            `${iri.slice(0, Math.max(0, positionContainerResourceNotInRoot))}/${resourceIndex}` :
            `${iri.slice(0, Math.max(0, positionContainerResourceIsRoot))}/${resourceIndex}`;

          const podIRI = positionContainerResourceNotInRoot !== -1 ?
            iri.slice(0, Math.max(0, positionContainerResourceNotInRoot)) :
            iri.slice(0, Math.max(0, positionContainerResourceIsRoot));
          const shapeTreeIRI = `${podIRI}/${FragmentationStrategyShape.shapeTreeFileName}`;
          if (this.tripleShapeTreeLocator === true) {
            await FragmentationStrategyShape.generateShapeTreeLocator(quadSink, `${podIRI}/`, shapeTreeIRI, iri);
          }

          if (!this.resourceHandled.has(resourceId)) {
            await FragmentationStrategyShape.generateShapeIndexInformation(quadSink,
              this.iriHandled,
              this.resourceHandled,
              resourceId,
              iri,
              podIRI,
              shapeTreeIRI,
              folder,
              shape,
              positionContainerResourceNotInRoot === -1);
            return;
          }
        }
      }
    }
  }

  public static async generateShapeIndexInformation(quadSink: IQuadSink,
    iriHandled: Set<string>,
    resourceHandled: Set<string>,
    resourceId: string,
    iri: string,
    podIRI: string,
    shapeTreeIRI: string,
    folder: string,
    shapePath: string,
    isInRootOfPod: boolean): Promise<void> {
    const shapeIRI = `${podIRI}/${folder}_shape`;
    const contentIri = isInRootOfPod ? resourceId : `${podIRI}/${folder}/`;
    const promises = [
      FragmentationStrategyShape.generateShape(quadSink, shapeIRI, shapePath),
      FragmentationStrategyShape.generateShapetreeTriples(quadSink, shapeTreeIRI, shapeIRI, isInRootOfPod, contentIri),
    ];

    await Promise.all(promises);

    iriHandled.add(iri);
    resourceHandled.add(resourceId);
  }

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

  // TODO when the vocabulary will be done, it is needed to handle the header of the shapetree iri
  // AKA saying that the resource is a shape index, make sure it is declare only one time
  // like bun the blank node to the resource
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
    const target = DF.quad(
      blankNode,
      isInRootOfPod ? this.solidInstance : this.solidInstanceContainer,
      DF.namedNode(contentIri),
    );
    await Promise.all(
      [
        quadSink.push(shapeTreeIRI, shape),
        quadSink.push(shapeTreeIRI, target),
      ],
    );
  }

  public static async generateShape(quadSink: IQuadSink, shapeIRI: string, shapePath: string): Promise<void> {
    const shexParser = ShexParser.construct(shapeIRI);
    const shapeShexc = (await readFile(shapePath)).toString();
    const shapeJSONLD = shexParser.parse(shapeShexc);
    const stringShapeJsonLD = JSON.stringify(shapeJSONLD);

    return new Promise((resolve, reject) => {
      // Stringigy streams
      const promises: Promise<void>[] = [];
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
          promises.push(quadSink.push(shapeIRI, quad));
        })
        // We ignore this because it is difficult to provide a valid Shex document that
        // would not be parsable in RDF when it has been in ShExJ

        // eslint-disable-next-line no-inline-comments
        .on('error', /* istanbul ignore next */(error: any) => {
          reject(error);
        })
        .on('end', async() => {
          await Promise.all(promises);
          resolve();
        });

      jsonldParser.write(stringShapeJsonLD);
      jsonldParser.end();
    });
  }

  protected async flush(quadSink: IQuadSink): Promise<void> {
    await super.flush(quadSink);
  }
}
