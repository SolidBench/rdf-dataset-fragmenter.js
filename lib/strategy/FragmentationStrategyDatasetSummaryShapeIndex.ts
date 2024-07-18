import { readFileSync } from 'node:fs';
import prand from 'pure-rand';
import type { IShapeEntry, IUndescribedDataModel } from '../summary/DatasetSummaryShapeIndex';
import { DatasetSummaryShapeIndex } from '../summary/DatasetSummaryShapeIndex';
import {
  FragmentationStrategyDatasetSummary,
  type IFragmentationStrategyDatasetSummaryOptions,
} from './FragmentationStrategyDatasetSummary';

export interface IFragmentationStrategyDatasetSummaryShapeIndexOptions
  extends IFragmentationStrategyDatasetSummaryOptions {
  shapeConfig: Record<string, IShapeEntry>;
  contentOfStorage: string[];
  tripleShapeIndexLocator?: boolean;
  randomSeed?: number;
  iriFragmentationOneFile: string[];
  iriFragmentationMultipleFiles: string[];
  // Object name, by iri of the predicate of the fragmentation
  // the object name must match the name of the shape
  datasetObjectFragmentationPredicate: Record<string, string>;
  /**
   * Dataset object divided by resource but not described by the fragmentation.
   * The key is an element of the path of those object and the object is the name from shape in an IShapeEntry object.
   * Example: key=>profile; object=>profile; triple=>http://localhost:3000/pods/00000030786325577964/profile/card#me
   */
  datasetObjectExeption: Record<string, IUndescribedDataModel>;
  /**
   * Probability to generate a shape index entry.
   * Should be between 0 and 100.
   */
  generationProbability?: number;
}

export class FragmentationStrategyDatasetShapeIndex
  extends FragmentationStrategyDatasetSummary<DatasetSummaryShapeIndex> {
  /**
   * @description A map of the resource type and shape
   */
  private readonly shapeMap: Record<string, IShapeEntry>;
  /**
   * The content of a storage.
   * It is used to determine if the shape index is complete.
   */
  private readonly contentOfStorage: Set<string>;
  /**
   * The initial random seed for stochastic shape generation.
   */
  private randomSeed: number;
  /**
   * Iri (place at the object position) of indicating the fragmentation of the ressource into a single file.
   * For exemple http://localhost:3000/internal/FragmentationOneFile
   */
  private readonly iriFragmentationOneFile: Set<string>;
  /**
   * Iri (place at the object position) of indicating the fragmentation of the ressource into a multiple files.
   * For exemple http://localhost:3000/internal/FragmentationPerResource
   */
  private readonly iriFragmentationMultipleFiles: Set<string>;
  /**
   * Iri (place at the object predicate) indicating the resource being fragmented.
   * For exemple http://localhost:3000/internal/postsFragmentation .
   * The key is the predicate and the object is the name from shape in an IShapeEntry object
   */
  private readonly datasetObjectFragmentationPredicate: Record<string, string>;
  /**
   * Dataset object divided by resource but not described by the fragmentation.
   * The key is an element of the path of those object and the object is the name from shape in an IShapeEntry object.
   * Example: key=>profile; object=>profile; triple=>http://localhost:3000/pods/00000030786325577964/profile/card#me
   */
  private readonly datasetObjectExeption: Record<string, IUndescribedDataModel>;
  /**
   * Probability to generate a shape index entry.
   * Should be between 0 and 100.
   */
  private readonly generationProbability?: number;

  public constructor(options: IFragmentationStrategyDatasetSummaryShapeIndexOptions) {
    super(options);

    this.shapeMap = this.generateShapeMap(options.shapeConfig);
    this.contentOfStorage = new Set(options.contentOfStorage);
    this.iriFragmentationMultipleFiles = new Set(options.iriFragmentationMultipleFiles);
    this.iriFragmentationOneFile = new Set(options.iriFragmentationOneFile);
    this.datasetObjectFragmentationPredicate = options.datasetObjectFragmentationPredicate;
    this.datasetObjectExeption = options.datasetObjectExeption;
    this.generationProbability = options.generationProbability;

    if (options.randomSeed === undefined) {
      const seed = Date.now() * Math.random();
      this.randomSeed = seed;
    } else {
      this.randomSeed = options.randomSeed;
    }
  }

  protected createSummary(dataset: string): DatasetSummaryShapeIndex {
    const summary = new DatasetSummaryShapeIndex({
      dataset,
      iriFragmentationMultipleFiles: this.iriFragmentationMultipleFiles,
      iriFragmentationOneFile: this.iriFragmentationOneFile,
      datasetObjectFragmentationPredicate: this.datasetObjectFragmentationPredicate,
      shapeMap: this.shapeMap,
      randomGeneratorShapeSelection: prand.xoroshiro128plus(this.randomSeed),
      contentOfStorage: this.contentOfStorage,
      datasetObjectExeption: this.datasetObjectExeption,
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
        shapes,
        directory: (shapeEntry).directory,
        name: (shapeEntry).name,
      };
    }
    return shapeMap;
  }
}
