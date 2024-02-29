import { DatasetSummaryBloom } from '../summary/DatasetSummaryBloom';
import {
  FragmentationStrategyDatasetSummary,
  type IFragmentationStrategyDatasetSummaryOptions,
} from './FragmentationStrategyDatasetSummary';

export class FragmentationStrategyDatasetSummaryBloom extends FragmentationStrategyDatasetSummary<DatasetSummaryBloom> {
  protected readonly hashBits: number;
  protected readonly hashCount: number;
  protected readonly datasetToSummary: Map<RegExp, string>;

  public constructor(args: IFragmentationStrategyDatasetSummaryBloomOptions) {
    super(args);
    this.hashBits = args.hashBits;
    this.hashCount = args.hashCount;
    this.datasetToSummary = new Map(Object.entries(args.datasetToSummary).map(([ exp, sub ]) => [
      new RegExp(exp, 'u'), sub,
    ]));
  }

  protected getDatasetsForSubject(subject: string): Set<string> {
    const mappings = new Set<string>();
    for (const [ exp, sub ] of this.subjectToDataset) {
      if (exp.test(subject)) {
        mappings.add(subject.replace(exp, sub));
      }
    }
    return mappings;
  }

  protected createSummary(dataset: string): DatasetSummaryBloom {
    let iri = dataset;
    for (const [ exp, sub ] of this.datasetToSummary) {
      if (exp.test(dataset)) {
        iri = dataset.replace(exp, sub);
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
   * Mapping of regular expressions to their replacements.
   * Used to relocate summaries to different IRIs from the datasets.
   * @range {json}
   */
  datasetToSummary: Record<string, string>;
}
