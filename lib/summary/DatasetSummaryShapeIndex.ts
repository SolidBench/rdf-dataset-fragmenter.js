import type * as RDF from '@rdfjs/types';
import { DF, DatasetSummary, type IDatasetSummaryOutput, type IDatasetSummaryArgs } from './DatasetSummary';
import * as SHEX_CONTEXT from './shex_context.json';
import prand from 'pure-rand';

export enum ResourceFragmentation {
    DISTRIBUTED,
    SINGLE,
}

export interface IUndescribedDataModel {
    fragmentation: ResourceFragmentation;
    name: string;
}

export interface IShapeIndexEntry {
    shape: string;
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
    //object name, by iri of the predicate of the fragmentation
    // the object name must match the name of the shape
    datasetObjectFragmentationPredicate: Record<string, string>;
    shapeMap: Record<string, IShapeEntry>;
    contentOfStorage: Set<string>;
    randomGeneratorShapeSelection: prand.RandomGenerator;
    /**
     * dataset object divided by resource but not described by the fragmentation.
     * The key is an element of the path of those object and the object is the name from shape in an IShapeEntry object.
     * Example: key=>card; object=>card; triple=>http://localhost:3000/pods/00000030786325577964/profile/card#me
     */
    datasetObjectExeption: Record<string, IUndescribedDataModel>;
}

export class DatasetSummaryShapeIndex extends DatasetSummary {
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

    private readonly iriFragmentationOneFile: Set<string>; // http://localhost:3000/internal/FragmentationOneFile 
    private readonly iriFragmentationMultipleFiles: Set<string>; //http://localhost:3000/internal/FragmentationPerResource

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
     * dataset object divided by resource but not described by the fragmentation.
     * The key is an element of the path of those object and the object is the name from shape in an IShapeEntry object.
     * Example: key=>profile; object=>profile; triple=>http://localhost:3000/pods/00000030786325577964/profile/card#me
     */
    private readonly datasetObjectExeption: Record<string, IUndescribedDataModel>;

    public constructor(args: IDatasetSummaryShapeIndex) {
        super(args);
        this.iriFragmentationMultipleFiles = args.iriFragmentationMultipleFiles;
        this.iriFragmentationOneFile = args.iriFragmentationOneFile;
        this.datasetObjectFragmentationPredicate = args.datasetObjectFragmentationPredicate;
        this.shapeMap = args.shapeMap;
        this.contentOfStorage = args.contentOfStorage;
        this.datasetObjectExeption = args.datasetObjectExeption;
        this.randomGenerator = args.randomGeneratorShapeSelection;
    }

    public register(quad: RDF.Quad): void {
        for (const [dataModelObject, predicate] of Object.entries(this.datasetObjectFragmentationPredicate)) {
            if (quad.predicate.value === predicate && quad.subject.value.includes(this.dataset)) {
                const fragmentation = this.iriFragmentationMultipleFiles.has(quad.object.value) ? ResourceFragmentation.DISTRIBUTED : ResourceFragmentation.SINGLE;
                this.registerShapeIndexEntry(dataModelObject, fragmentation);
                return;
            }
        }

        for (const [pathElement, { name, fragmentation }] of Object.entries(this.datasetObjectExeption)) {
            if (quad.subject.value.includes(pathElement) && quad.subject.value.includes(this.dataset)) {
                this.registerShapeIndexEntry(name, fragmentation);
                return;
            }
        }
    }

    public serialize(): IDatasetSummaryOutput[] {
        return [];
    }

    private registerShapeIndexEntry(dataModelObject: string, fragmentation: ResourceFragmentation) {
        const shapeEntry = this.shapeMap[dataModelObject];
        if (shapeEntry) {
            const [randomIndex, newGenerator] =
                prand.uniformIntDistribution(0, shapeEntry.shapes.length - 1, this.randomGenerator);
            this.randomGenerator = newGenerator;
            const shape = shapeEntry.shapes[randomIndex];
            const iri = fragmentation === ResourceFragmentation.DISTRIBUTED ? `${this.dataset}/${shapeEntry.directory}/` :
                `${this.dataset}/${dataModelObject}`;

            const indexEntry: IShapeIndexEntry = {
                shape,
                ressourceFragmentation: fragmentation,
                iri
            };
            this.contentHandled.set(dataModelObject, indexEntry);
        }


    }
}
