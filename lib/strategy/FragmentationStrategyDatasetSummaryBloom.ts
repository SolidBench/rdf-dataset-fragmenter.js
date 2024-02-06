import type { IDatasetSummary } from '../summary/DatasetSummary';
import { DatasetSummaryBloom } from '../summary/DatasetSummaryBloom';
import type { IFragmentationStrategyDatasetSummaryOptions } from './FragmentationStrategyDatasetSummary';
import { FragmentationStrategyDatasetSummary } from './FragmentationStrategyDatasetSummary';

/**
 * Fragmentation strategy that creates Bloom filters for datasets.
 */
export class FragmentationStrategyDatasetSummaryBloom extends FragmentationStrategyDatasetSummary {
  private readonly hashBits: number;
  private readonly hashCount: number;

  public constructor(options: IFragmentationStrategyDatasetSummaryBloomOptions) {
    super(options);
    this.hashBits = options.hashBits;
    this.hashCount = options.hashCount;
  }

  protected createDatasetSummary(dataset: string): IDatasetSummary {
    return new DatasetSummaryBloom({ dataset, hashBits: this.hashBits, hashCount: this.hashCount });
  }
}

export interface IFragmentationStrategyDatasetSummaryBloomOptions extends IFragmentationStrategyDatasetSummaryOptions {
  /**
   * The number of bits to use for the Bloom filters.
   * @default {256}
   */
  hashBits: number;
  /**
   * The number of hash functions to use for the Bloom filters.
   * @default {4}
   */
  hashCount: number;
}
