import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from '../io/IQuadSink';
import type { IDatasetSummary } from '../summary/DatasetSummary';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';

/**
 * Fragmentation strategy that collects dataset summaries per dataset.
 */
export abstract class FragmentationStrategyDatasetSummary<T extends IDatasetSummary>
  extends FragmentationStrategyStreamAdapter {
  protected readonly summaries: Map<string, T>;
  protected readonly subjectToDataset: Map<RegExp, string>;

  private readonly blankNodeQuads: Map<string, RDF.Quad[]>;
  private readonly blankNodeDatasets: Map<string, Set<string>>;

  public constructor(options: IFragmentationStrategyDatasetSummaryOptions) {
    super();
    this.summaries = new Map();
    this.blankNodeQuads = new Map();
    this.blankNodeDatasets = new Map();
    this.subjectToDataset = new Map(Object.entries(options.subjectToDataset).map(([ exp, sub ]) => [
      new RegExp(exp, 'u'),
      sub,
    ]));
  }

  protected abstract getDatasetsForSubject(subject: string): Set<string>;

  protected abstract createSummary(dataset: string): T;

  protected registerDatasetQuad(dataset: string, quad: RDF.Quad): void {
    let summary = this.summaries.get(dataset);
    if (!summary) {
      summary = this.createSummary(dataset);
      this.summaries.set(dataset, summary);
    }
    summary.register(quad);
  }

  protected async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    if (quad.subject.termType === 'NamedNode') {
      const subjectDatasets = this.getDatasetsForSubject(quad.subject.value);
      for (const dataset of subjectDatasets) {
        this.registerDatasetQuad(dataset, quad);
        if (quad.object.termType === 'BlankNode') {
          let objectDatasets = this.blankNodeDatasets.get(quad.object.value);
          if (!objectDatasets) {
            objectDatasets = new Set();
            this.blankNodeDatasets.set(quad.object.value, objectDatasets);
          }
          objectDatasets.add(dataset);
        }
      }
    } else if (quad.subject.termType === 'BlankNode') {
      let blanks = this.blankNodeQuads.get(quad.subject.value);
      if (!blanks) {
        blanks = [];
        this.blankNodeQuads.set(quad.subject.value, blanks);
      }
      blanks.push(quad);
    }
  }

  protected async flush(quadSink: IQuadSink): Promise<void> {
    const blankNodesQueue = [ ...this.blankNodeDatasets.keys() ];
    while (blankNodesQueue.length > 0) {
      const blankNode = blankNodesQueue.shift()!;
      const blankNodeQuads = this.blankNodeQuads.get(blankNode);
      if (blankNodeQuads) {
        const datasets = this.blankNodeDatasets.get(blankNode)!;
        for (const quad of blankNodeQuads) {
          for (const dataset of datasets) {
            this.registerDatasetQuad(dataset, quad);
          }
          if (quad.object.termType === 'BlankNode' && !this.blankNodeDatasets.has(quad.object.value)) {
            this.blankNodeDatasets.set(quad.object.value, datasets);
            blankNodesQueue.push(quad.object.value);
          }
        }
      }
    }
    this.blankNodeQuads.clear();
    this.blankNodeDatasets.clear();
    for (const [ key, summary ] of this.summaries) {
      const output = summary.serialize();
      for (const quad of output.quads) {
        await quadSink.push(output.iri, quad);
      }
      this.summaries.delete(key);
    }
    await super.flush(quadSink);
  }
}

export interface IFragmentationStrategyDatasetSummaryOptions {
  /**
   * Mapping of regular expressions to their replacements.
   * Used to determine the dataset for a given subject IRI.
   * @range {json}
   */
  subjectToDataset: Record<string, string>;
}
