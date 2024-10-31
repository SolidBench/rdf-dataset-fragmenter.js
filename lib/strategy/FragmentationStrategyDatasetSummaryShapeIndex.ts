import { readFileSync } from 'node:fs';
import type { IShapeEntry, IUndescribedDataModel } from '../summary/DatasetSummaryShapeIndex';
import { DatasetSummaryShapeIndex } from '../summary/DatasetSummaryShapeIndex';
import {
  FragmentationStrategyDatasetSummary,
  type IFragmentationStrategyDatasetSummaryOptions,
} from './FragmentationStrategyDatasetSummary';

export interface IFragmentationStrategyDatasetSummaryShapeIndexOptions
  extends IFragmentationStrategyDatasetSummaryOptions {
  /**
   * Information about the shape used in the datasets
   * @range {json}
   */
  shapeConfig: Record<string, IShapeEntry>;
  /**
   * All the ressource type of a dataset
   */
  resourceTypesOfDatasets: string[];
  /**
   * The initial random seed for stochastic shape index generation operations.
   */
  randomSeed?: number;
  /**
   * Iri (place at the object position) indicating the fragmentation of the ressource into a multiple files.
   * For exemple http://localhost:3000/internal/FragmentationPerResource
   */
  iriFragmentationOneFile: string[];
  /**
   * Iri (place at the object position) indicating the fragmentation of the ressource into a multiple files.
   * For exemple http://localhost:3000/internal/FragmentationPerResource
   */
  iriFragmentationMultipleFiles: string[];
  /**
   * Ressource name (same as the key of shapeConfig) by iri of the predicate of the fragmentation
   * the object name must match the name of the shape
   * @range {json}
   */
  datasetResourceFragmentationPredicate: Record<string, string>;
  /**
   * Dataset object divided by resource but not described by the fragmentation.
   * The key is an element of the path of those object and the object is the name from shape in an IShapeEntry object.
   * Example: key=>profile; object=>profile; triple=>http://localhost:3000/pods/00000030786325577964/profile/card#me
   * @range {json}
   */
  datasetResourceFragmentationException: Record<string, IUndescribedDataModel>;
  /**
   * Probability to generate a shape index entry.
   * Should be between 0 and 100.
   */
  generationProbability?: number;
}

export class FragmentationStrategyDatasetSummaryShapeIndex
  extends FragmentationStrategyDatasetSummary<DatasetSummaryShapeIndex> {
  /**
   * @description A map of the resource type and shape
   */
  private readonly shapeMap: Record<string, IShapeEntry>;
  /**
   * The content of a storage.
   * It is used to determine if the shape index is complete.
   */
  private readonly resourceTypesOfDatasets: Set<string>;
  /**
   * The initial random seed for stochastic shape index generation.
   */
  private randomSeed: number;
  /**
   * IRI (place at the object position) of indicating the fragmentation of the ressource into a single file.
   * For exemple http://localhost:3000/internal/FragmentationOneFile
   */
  private readonly iriFragmentationOneFile: Set<string>;
  /**
   * IRI (place at the object position) of indicating the fragmentation of the ressource into a multiple files.
   * For exemple http://localhost:3000/internal/FragmentationPerResource
   */
  private readonly iriFragmentationMultipleFiles: Set<string>;
  /**
   * IRI (place at the object predicate) indicating the resource being fragmented.
   * For exemple http://localhost:3000/internal/postsFragmentation .
   * The key is the predicate and the object is the name from shape in an IShapeEntry object
   */
  private readonly datasetObjectFragmentationPredicate: Record<string, string>;
  /**
   * Dataset object divided by resource but not described by the fragmentation.
   * The key is an element of the path of those object and the object is the name from shape in an IShapeEntry object.
   * Example: key=>profile; object=>profile; triple=>http://localhost:3000/pods/00000030786325577964/profile/card#me
   */
  private readonly datasetResourceFragmentationException: Record<string, IUndescribedDataModel>;
  /**
   * Probability to generate a shape index entry.
   * Should be between 0 and 100.
   */
  private readonly generationProbability?: number;

  public constructor(options: IFragmentationStrategyDatasetSummaryShapeIndexOptions) {
    super(options);

    this.shapeMap = this.generateShapeMap(options.shapeConfig);
    this.resourceTypesOfDatasets = new Set(options.resourceTypesOfDatasets);
    this.iriFragmentationMultipleFiles = new Set(options.iriFragmentationMultipleFiles);
    this.iriFragmentationOneFile = new Set(options.iriFragmentationOneFile);
    this.datasetObjectFragmentationPredicate = options.datasetResourceFragmentationPredicate;
    this.datasetResourceFragmentationException = options.datasetResourceFragmentationException;
    this.generationProbability = options.generationProbability;

    if (options.randomSeed) {
      this.randomSeed = options.randomSeed;
    } else {
      const seed = Date.now() * Math.random();
      this.randomSeed = seed;
    }
  }

  protected createSummary(dataset: string): DatasetSummaryShapeIndex {
    const summary = new DatasetSummaryShapeIndex({
      dataset,
      iriFragmentationMultipleFiles: this.iriFragmentationMultipleFiles,
      iriFragmentationOneFile: this.iriFragmentationOneFile,
      datasetResourceFragmentationPredicate: this.datasetObjectFragmentationPredicate,
      shapeMap: this.shapeMap,
      randomSeed: this.randomSeed,
      contentTypesOfDatasets: this.resourceTypesOfDatasets,
      datasetResourceFragmentationException: this.datasetResourceFragmentationException,
      generationProbability: this.generationProbability,
    });
    this.randomSeed += 1;
    return summary;
  }

  /**
   * Generate a map of the resource type and the shape template
   * @param {Record<string, IShapeEntry>} shapeConfig - A map of the shape path
   * @returns {Record<string, IShapeEntry>} a map of the resource with their shape temple
   */
  private generateShapeMap(shapeConfig: Record<string, IShapeEntry>): Record<string, IShapeEntry> {
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
        ...shapeEntry,
        shapes,
      };
    }
    return shapeMap;
  }
}
