import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { IQuadSink } from '../io/IQuadSink';

export const DF = new DataFactory();

export interface IDatasetSummary {}

export interface IDatasetSummaryCollector {
  register: (dataset: string, quad: RDF.Quad) => void;
  flush: (sink: IQuadSink) => Promise<void>;
}

export abstract class DatasetSummaryCollector<T extends IDatasetSummary> implements IDatasetSummaryCollector {
  protected readonly summaries: Map<string, T>;

  public static readonly RDF_TYPE = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  public static readonly XSD_INTEGER = DF.namedNode('http://www.w3.org/2001/XMLSchema#integer');
  public static readonly XSD_BASE64 = DF.namedNode('http://www.w3.org/2001/XMLSchema#base64Binary');

  public constructor(args: IDatasetSummaryCollectorArgs) {
    this.summaries = new Map();
  }

  protected getDatasetSummary(dataset: string): T {
    let summary = this.summaries.get(dataset);
    if (!summary) {
      summary = this.createDatasetSummary();
      this.summaries.set(dataset, summary);
    }
    return summary;
  }

  public abstract register(dataset: string, quad: RDF.Quad): void;
  public abstract flush(sink: IQuadSink): Promise<void>;

  protected abstract createDatasetSummary(): T;
}

export interface IDatasetSummaryCollectorArgs {}
