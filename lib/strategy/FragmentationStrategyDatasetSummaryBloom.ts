import { DatasetSummaryBloom } from '../summary/DatasetSummaryBloom';
import {
  FragmentationStrategyDatasetSummary,
  type IFragmentationStrategyDatasetSummaryOptions,
} from './FragmentationStrategyDatasetSummary';

export class FragmentationStrategyDatasetSummaryBloom extends FragmentationStrategyDatasetSummary<DatasetSummaryBloom> {
  protected readonly hashBits: number;
  protected readonly hashCount: number;
  protected readonly locationPatterns: RegExp[];

  public constructor(options: IFragmentationStrategyDatasetSummaryBloomOptions) {
    super(options);
    this.hashBits = options.hashBits;
    this.hashCount = options.hashCount;
    this.locationPatterns = options.locationPatterns.map(exp => new RegExp(exp, 'u'));
  }

  protected createSummary(dataset: string): DatasetSummaryBloom {
    let iri = dataset;
    for (const exp of this.locationPatterns) {
      const match = exp.exec(dataset);
      if (match) {
        iri = match[0];
        break;
      }
    }
    return new DatasetSummaryBloom({ dataset, iri, hashBits: this.hashBits, hashCount: this.hashCount });
  }
}

export interface IFragmentationStrategyDatasetSummaryBloomOptions extends IFragmentationStrategyDatasetSummaryOptions {
  /**
   * Hash bitcount.
   */
  hashBits: number;
  /**
   * Hash function count.
   */
  hashCount: number;
  /**
   * Regular expressions used to remap the filters to different locations.
   */
  locationPatterns: string[];
}
