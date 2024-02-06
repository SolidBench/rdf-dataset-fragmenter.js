import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';

export const DF = new DataFactory();

export interface IDatasetSummaryCollector {
  register: (dataset: string, quad: RDF.Quad) => void;
  toQuads: () => Map<string, RDF.Quad[]>;
}

export interface IDatasetSummaryCollectorArgs {}

export abstract class DatasetSummaryCollector<T> implements IDatasetSummaryCollector {
  protected readonly summaries: Map<string, T>;

  public static readonly RDF_TYPE = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  public static readonly XSD_INTEGER = DF.namedNode('http://www.w3.org/2001/XMLSchema#integer');
  public static readonly XSD_BASE64 = DF.namedNode('http://www.w3.org/2001/XMLSchema#base64Binary');

  public constructor(args: IDatasetSummaryCollectorArgs) {
    this.summaries = new Map();
  }

  public abstract register(dataset: string, quad: RDF.Quad): void;
  public abstract toQuads(): Map<string, RDF.Quad[]>;
}
