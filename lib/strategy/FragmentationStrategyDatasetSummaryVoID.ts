import { DatasetSummaryVoID } from '../summary/DatasetSummaryVoID';
import {
  FragmentationStrategyDatasetSummary,
  type IFragmentationStrategyDatasetSummaryOptions,
} from './FragmentationStrategyDatasetSummary';

export class FragmentationStrategyDatasetSummaryVoID extends FragmentationStrategyDatasetSummary<DatasetSummaryVoID> {
  public constructor(options: IFragmentationStrategyDatasetSummaryOptions) {
    super(options);
  }

  protected createSummary(dataset: string): DatasetSummaryVoID {
    return new DatasetSummaryVoID({ dataset });
  }
}
