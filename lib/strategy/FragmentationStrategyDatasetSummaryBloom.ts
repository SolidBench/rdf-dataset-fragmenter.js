import { DatasetSummaryBloom } from '../summary/DatasetSummaryBloom';
import type { IFragmentationStrategyDatasetSummaryOptions } from './FragmentationStrategyDatasetSummary';
import { FragmentationStrategyDatasetSummary } from './FragmentationStrategyDatasetSummary';

export class FragmentationStrategyDatasetSummaryBloom extends FragmentationStrategyDatasetSummary<DatasetSummaryBloom> {
  protected readonly hashBits: number;
  protected readonly hashCount: number;
  protected readonly locationPatterns: RegExp[];

  public constructor(options: IFragmentationStrategyDatasetSummaryBloomOptions) {
    super(options);
    this.hashBits = options.hashBits;
    this.hashCount = options.hashCount;
    this.locationPatterns = options.locationPatterns.map(p => new RegExp(p, 'u'));
  }

  protected createSummary(dataset: string): DatasetSummaryBloom {
    let location = dataset;
    for (const exp of this.locationPatterns) {
      const match = exp.exec(dataset);
      if (match) {
        location = match[0];
        break;
      }
    }
    return new DatasetSummaryBloom({ dataset, location, hashBits: this.hashBits, hashCount: this.hashCount });
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
   * Regular expressions used to group Bloom filters together.
   */
  locationPatterns: string[];
}
