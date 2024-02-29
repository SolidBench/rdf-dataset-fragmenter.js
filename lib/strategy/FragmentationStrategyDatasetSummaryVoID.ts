import { DatasetSummaryVoID } from '../summary/DatasetSummaryVoID';
import { FragmentationStrategyDatasetSummary } from './FragmentationStrategyDatasetSummary';

export class FragmentationStrategyDatasetSummaryVoID extends FragmentationStrategyDatasetSummary<DatasetSummaryVoID> {
  protected createSummary(dataset: string): DatasetSummaryVoID {
    return new DatasetSummaryVoID({ dataset });
  }
}
