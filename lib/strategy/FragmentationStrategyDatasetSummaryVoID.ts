import { DatasetSummaryVoID } from '../summary/DatasetSummaryVoID';
import {
  FragmentationStrategyDatasetSummary,
  type IFragmentationStrategyDatasetSummaryOptions,
} from './FragmentationStrategyDatasetSummary';

export class FragmentationStrategyDatasetSummaryVoID extends FragmentationStrategyDatasetSummary<DatasetSummaryVoID> {
  public constructor(args: IFragmentationStrategyDatasetSummaryOptions) {
    super(args);
  }

  protected getDatasetsForSubject(subject: string): Set<string> {
    let mapping = subject;
    for (const [ exp, sub ] of this.subjectToDataset) {
      if (exp.test(subject)) {
        mapping = subject.replace(exp, sub);
        break;
      }
    }
    return new Set([ mapping ]);
  }

  protected createSummary(dataset: string): DatasetSummaryVoID {
    return new DatasetSummaryVoID({ dataset });
  }
}
