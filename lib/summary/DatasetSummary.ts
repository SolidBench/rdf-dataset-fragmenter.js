import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';

export const DF = new DataFactory();

export interface IDatasetSummaryOutput {
  iri: string;
  quads: RDF.Quad[];
}

export interface IDatasetSummary {
  register: (quad: RDF.Quad) => void;
  serialize: () => IDatasetSummaryOutput[];
}

export abstract class DatasetSummary implements IDatasetSummary {
  protected readonly dataset: string;

  /* eslint-disable ts/naming-convention */
  public static readonly RDF_TYPE = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  public static readonly XSD_INTEGER = DF.namedNode('http://www.w3.org/2001/XMLSchema#integer');
  public static readonly XSD_BASE64 = DF.namedNode('http://www.w3.org/2001/XMLSchema#base64Binary');
  /* eslint-enable ts/naming-convention */

  public constructor(args: IDatasetSummaryArgs) {
    this.dataset = args.dataset;
  }

  public abstract register(quad: RDF.Quad): void;
  public abstract serialize(): IDatasetSummaryOutput[];
}

export interface IDatasetSummaryArgs {
  /**
   * The IRI of the dataset being summarised.
   */
  dataset: string;
}
