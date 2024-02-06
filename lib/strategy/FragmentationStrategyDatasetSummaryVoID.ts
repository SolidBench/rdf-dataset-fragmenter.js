import type { IDatasetSummary } from '../summary/DatasetSummary';
import { DatasetSummaryVoID } from '../summary/DatasetSummaryVoID';
import { FragmentationStrategyDatasetSummary } from './FragmentationStrategyDatasetSummary';

/**
 * Fragmentation strategy that creates VoID dataset descriptions for datasets.
 */
export class FragmentationStrategyDatasetSummaryVoID extends FragmentationStrategyDatasetSummary {
  protected createDatasetSummary(dataset: string): IDatasetSummary {
    return new DatasetSummaryVoID({ dataset });
  }
}
