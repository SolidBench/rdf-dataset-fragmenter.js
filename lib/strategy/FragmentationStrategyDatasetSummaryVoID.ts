import { DatasetSummaryVoID } from '../summary/DatasetSummaryVoID';
import { FragmentationStrategyDatasetSummary } from './FragmentationStrategyDatasetSummary';

export class FragmentationStrategyDatasetSummaryVoID extends FragmentationStrategyDatasetSummary<DatasetSummaryVoID> {
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
