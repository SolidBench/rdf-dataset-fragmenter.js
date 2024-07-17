import type * as RDF from '@rdfjs/types';
import * as ShexParser from '@shexjs/parser';
import { JsonLdParser } from 'jsonld-streaming-parser';
import prand from 'pure-rand';
import { DF, DatasetSummary, type IDatasetSummaryOutput, type IDatasetSummaryArgs } from './DatasetSummary';

/* eslint-disable-next-line import/extensions */
import * as SHEX_CONTEXT from './shex-context.json';

/* eslint-disable ts/naming-convention */
export enum ResourceFragmentation {
  DISTRIBUTED,
  SINGLE,
}
/* eslint-enable ts/naming-convention */

export interface IUndescribedDataModel {
  fragmentation: ResourceFragmentation;
  name: string;
}

export interface IShapeIndexEntry {
  shape: string;
  shapeInfo: {
    name: string;
    directory: string;
  };
  iri: string;
  ressourceFragmentation: ResourceFragmentation;
}

export interface IShapeEntry {
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

export interface IDatasetSummaryShapeIndex extends IDatasetSummaryArgs {
  iriFragmentationOneFile: Set<string>;
  iriFragmentationMultipleFiles: Set<string>;
  // Object name, by iri of the predicate of the fragmentation
  // the object name must match the name of the shape
  datasetObjectFragmentationPredicate: Record<string, string>;
  shapeMap: Record<string, IShapeEntry>;
  contentOfStorage: Set<string>;
  randomGeneratorShapeSelection: prand.RandomGenerator;
  /**
   * Dataset object divided by resource but not described by the fragmentation.
   * The key is an element of the path of those object and the object is the name from shape in an IShapeEntry object.
   * Example: key=>card; object=>card; triple=>http://localhost:3000/pods/00000030786325577964/profile/card#me
   */
  datasetObjectExeption: Record<string, IUndescribedDataModel>;
}

export class DatasetSummaryShapeIndex extends DatasetSummary {
  /* eslint-disable ts/naming-convention */
  public static readonly SHAPE_INDEX_FILE_NAME: string = 'shapeIndex';

  public static readonly SHAPE_INDEX_PREFIX = 'https://shapeIndex.com#';

  public static readonly RDF_TYPE_NODE = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  public static readonly RDF_TRUE = DF.literal('true', DF.namedNode('http://www.w3.org/2001/XMLSchema#boolean'));
  public static readonly RDF_STRING_TYPE = DF.namedNode('http://www.w3.org/2001/XMLSchema#string');

  public static readonly SHAPE_INDEX_LOCATION_NODE = DF.namedNode(`${DatasetSummaryShapeIndex.SHAPE_INDEX_PREFIX}shapeIndexLocation`);
  public static readonly SHAPE_INDEX_CLASS_NODE = DF.namedNode(`${DatasetSummaryShapeIndex.SHAPE_INDEX_PREFIX}ShapeIndex`);
  public static readonly SHAPE_INDEX_ENTRY_NODE = DF.namedNode(`${DatasetSummaryShapeIndex.SHAPE_INDEX_PREFIX}entry`);
  public static readonly SHAPE_INDEX_BIND_BY_SHAPE_NODE = DF.namedNode(`${DatasetSummaryShapeIndex.SHAPE_INDEX_PREFIX}bindByShape`);
  public static readonly SHAPE_INDEX_DOMAIN_NODE = DF.namedNode(`${DatasetSummaryShapeIndex.SHAPE_INDEX_PREFIX}domain`);
  public static readonly SHAPE_INDEX_IS_COMPLETE_NODE = DF.namedNode(`${DatasetSummaryShapeIndex.SHAPE_INDEX_PREFIX}isComplete`);

  public static readonly SOLID_INSTANCE_NODE = DF.namedNode('http://www.w3.org/ns/solid/terms#instance');
  public static readonly SOLID_INSTANCE_CONTAINER_NODE =
    DF.namedNode('http://www.w3.org/ns/solid/terms#instanceContainer');
    /* eslint-enable ts/naming-convention */

  /**
   * Iri that describe the fragmentation into a single file for exemple:
   * http://localhost:3000/internal/FragmentationOneFile
   */
  private readonly iriFragmentationOneFile: Set<string>;
  /**
   * Iri that describe the fragmentation into multiple files for exemple:
   * http://localhost:3000/internal/FragmentationPerResource
   */
  private readonly iriFragmentationMultipleFiles: Set<string>;

  private readonly datasetObjectFragmentationPredicate: Record<string, string>;

  /**
   * @description A map of the resource type and shape
   */
  private readonly shapeMap: Record<string, IShapeEntry>;

  /**
   * @description A random generator
   */
  private randomGenerator: prand.RandomGenerator;

  /**
   * @description A map of the storage and the resource type handled
   */
  private readonly contentHandled: Map<string, IShapeIndexEntry> = new Map();
  /**
   * The content of a storage.
   * It is used to determine if the shape index is complete.
   */
  private readonly contentOfStorage: Set<string>;
  /**
   * Dataset object divided by resource but not described by the fragmentation.
   * The key is an element of the path of those object and the object is the name from shape in an IShapeEntry object.
   * Example: key=>profile; object=>profile; triple=>http://localhost:3000/pods/00000030786325577964/profile/card#me
   */
  private readonly datasetObjectExeption: Record<string, IUndescribedDataModel>;

  private readonly handledUndescribedObject: Set<string> = new Set();

  private readonly shapeIndexIri: string;

  public constructor(args: IDatasetSummaryShapeIndex) {
    super(args);
    this.iriFragmentationMultipleFiles = args.iriFragmentationMultipleFiles;
    this.iriFragmentationOneFile = args.iriFragmentationOneFile;
    this.datasetObjectFragmentationPredicate = args.datasetObjectFragmentationPredicate;
    this.shapeMap = args.shapeMap;
    this.contentOfStorage = args.contentOfStorage;
    this.datasetObjectExeption = args.datasetObjectExeption;
    this.randomGenerator = args.randomGeneratorShapeSelection;
    this.shapeIndexIri = `${this.dataset}/${DatasetSummaryShapeIndex.SHAPE_INDEX_FILE_NAME}`;
  }

  public register(quad: RDF.Quad): void {
    for (const [ dataModelObject, predicate ] of Object.entries(this.datasetObjectFragmentationPredicate)) {
      if (quad.predicate.value === predicate && quad.subject.value.includes(this.dataset)) {
        const fragmentation = this.iriFragmentationMultipleFiles.has(quad.object.value) ?
          ResourceFragmentation.DISTRIBUTED :
          ResourceFragmentation.SINGLE;
        this.registerShapeIndexEntry(dataModelObject, fragmentation);
        break;
      }
    }

    for (const [ pathElement, { name, fragmentation }] of Object.entries(this.datasetObjectExeption)) {
      if (quad.subject.value.includes(pathElement) &&
                quad.subject.value.includes(this.dataset) &&
                !this.handledUndescribedObject.has(name)) {
        this.registerShapeIndexEntry(name, fragmentation);
        this.handledUndescribedObject.add(name);
        return;
      }
    }
  }

  public registerShapeIndexEntry(dataModelObject: string, fragmentation: ResourceFragmentation): void {
    const shapeEntry = this.shapeMap[dataModelObject];
    if (shapeEntry) {
      const [ randomIndex, newGenerator ] =
                prand.uniformIntDistribution(0, shapeEntry.shapes.length - 1, this.randomGenerator);
      this.randomGenerator = newGenerator;
      const shape = shapeEntry.shapes[randomIndex];
      const iri = fragmentation === ResourceFragmentation.DISTRIBUTED ?
                `${this.dataset}/${shapeEntry.directory}/` :
                `${this.dataset}/${dataModelObject}`;

      const indexEntry: IShapeIndexEntry = {
        shape,
        shapeInfo: {
          name: shapeEntry.name,
          directory: shapeEntry.directory,
        },
        ressourceFragmentation: fragmentation,
        iri,
      };
      this.contentHandled.set(dataModelObject, indexEntry);
    }
  }

  public async serialize(): Promise<IDatasetSummaryOutput[]> {
    const [ shapeIndexEntry, shapes ] = await this.serializeShapeIndexEntries();
    if (shapeIndexEntry.quads.length === 0) {
      return [];
    }
    const shapeIndex = this.serializeShapeIndexInstance();
    /* eslint-disable unicorn/prefer-spread */
    shapeIndex.quads = shapeIndex.quads.concat(shapeIndexEntry.quads);
    shapeIndex.quads = shapeIndex.quads.concat(this.serializeCompletenessOfShapeIndex().quads);
    return [
      shapeIndex,
    ].concat(shapes);
    /* eslint-enable unicorn/prefer-spread */
  }

  public async serializeShapeIndexEntries(): Promise<[IDatasetSummaryOutput, IDatasetSummaryOutput[]]> {
    const output: IDatasetSummaryOutput = {
      iri: this.shapeIndexIri,
      quads: [],
    };
    const shapeOutputs: IDatasetSummaryOutput[] = [];

    const shapeIndexNode = DF.namedNode(this.shapeIndexIri);
    for (const entry of this.contentHandled.values()) {
      const currentEntry = DF.blankNode(entry.shapeInfo.name);
      const entryTypeDefinition = DF.quad(
        shapeIndexNode,
        DatasetSummaryShapeIndex.SHAPE_INDEX_ENTRY_NODE,
        currentEntry,
      );
      const bindByShape = DF.quad(
        currentEntry,
        DatasetSummaryShapeIndex.SHAPE_INDEX_BIND_BY_SHAPE_NODE,
        DF.namedNode(this.generateShapeIri(entry.shapeInfo)),
      );
      const target = DF.quad(
        currentEntry,
        entry.ressourceFragmentation === ResourceFragmentation.SINGLE ?
          DatasetSummaryShapeIndex.SOLID_INSTANCE_NODE :
          DatasetSummaryShapeIndex.SOLID_INSTANCE_CONTAINER_NODE,
        DF.namedNode(entry.iri),
      );
      shapeOutputs.push(await this.serializeShape(entry.shape, this.generateShapeIri(entry.shapeInfo)));

      output.quads.push(entryTypeDefinition, bindByShape, target);
    }
    return [ output, shapeOutputs ];
  }

  public serializeShapeIndexInstance(): IDatasetSummaryOutput {
    const shapeIndexNode = DF.namedNode(this.shapeIndexIri);
    const typeDefinition = DF.quad(
      shapeIndexNode,
      DatasetSummaryShapeIndex.RDF_TYPE_NODE,
      DatasetSummaryShapeIndex.SHAPE_INDEX_CLASS_NODE,
    );

    const domain = DF.quad(
      shapeIndexNode,
      DatasetSummaryShapeIndex.SHAPE_INDEX_DOMAIN_NODE,
      DF.literal(`${this.dataset}/.*`, DatasetSummaryShapeIndex.RDF_STRING_TYPE),
    );

    return {
      iri: this.shapeIndexIri,
      quads: [ typeDefinition, domain ],
    };
  }

  public serializeCompletenessOfShapeIndex(): IDatasetSummaryOutput {
    // We check if all the resource has been handled
    if (this.contentHandled.size !== this.contentOfStorage.size) {
      return {
        iri: this.shapeIndexIri,
        quads: [],
      };
    }
    for (const val of this.contentHandled.keys()) {
      if (!this.contentOfStorage.has(val)) {
        return {
          iri: this.shapeIndexIri,
          quads: [],
        };
      }
    }
    // All the resource has been handled so we indicate it with a triple
    const isComplete = DF.quad(
      DF.namedNode(this.shapeIndexIri),
      DatasetSummaryShapeIndex.SHAPE_INDEX_IS_COMPLETE_NODE,
      DatasetSummaryShapeIndex.RDF_TRUE,
    );

    return {
      iri: this.shapeIndexIri,
      quads: [ isComplete ],
    };
  }

  public async serializeShape(shapeShexc: string, shapeIRI: string): Promise<IDatasetSummaryOutput> {
    const shexParser = ShexParser.construct(shapeIRI);
    shapeShexc = this.transformShapeTemplateIntoShape(shapeShexc, shapeIRI);
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
        .on('data', (quad: RDF.Quad) => {
          quads.push(quad);
        })
      // We ignore this because it is difficult to provide a valid ShEx document that
      // would not be parsable in RDF given it has been already parsed in ShExJ

        .on('error', /* istanbul ignore next */(error: any) => {
          reject(error);
        })
        .on('end', () => {
          resolve({
            iri: shapeIRI,
            quads,
          });
        });

      jsonldParser.write(stringShapeJsonLD);
      jsonldParser.end();
    });
  }

  public generateShapeIri(entry: { directory: string; name: string }): string {
    return `${this.dataset}/${entry.directory}_shape#${entry.name}`;
  }

  public transformShapeTemplateIntoShape(shapeShexc: string, shapeIRI: string): string {
    shapeShexc = shapeShexc.replace('$', shapeIRI);
    for (const entry of Object.values(this.shapeMap)) {
      shapeShexc = shapeShexc.replaceAll(`{:${entry.name}}`, this.generateShapeIri(entry));
    }
    return shapeShexc;
  }
}
