import { DatasetSummaryVoID } from '../summary/DatasetSummaryVoID';
import { FragmentationStrategyDatasetSummary } from './FragmentationStrategyDatasetSummary';
import type { IFragmentationStrategyDatasetSummaryOptions } from './FragmentationStrategyDatasetSummary';

export class FragmentationStrategyDatasetSummaryVoID extends FragmentationStrategyDatasetSummary<DatasetSummaryVoID> {
  public constructor(options: IFragmentationStrategyDatasetSummaryVoIDOptions) {
    super(options);
  }

  protected createSummary(dataset: string): DatasetSummaryVoID {
    return new DatasetSummaryVoID({ dataset });
  }
}

export interface IFragmentationStrategyDatasetSummaryVoIDOptions extends IFragmentationStrategyDatasetSummaryOptions {}
