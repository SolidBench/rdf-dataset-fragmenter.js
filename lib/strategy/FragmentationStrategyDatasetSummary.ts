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
  protected readonly datasetPatterns: RegExp[];

  private readonly blankNodeQuads: Map<string, RDF.Quad[]>;
  private readonly blankNodeDatasets: Map<string, Set<string>>;

  public constructor(options: IFragmentationStrategyDatasetSummaryOptions) {
    super();
    this.summaries = new Map();
    this.blankNodeQuads = new Map();
    this.blankNodeDatasets = new Map();
    this.datasetPatterns = options.datasetPatterns.map(exp => new RegExp(exp, 'u'));
  }

  protected abstract createSummary(dataset: string): T;

  protected subjectToDatasets(subject: string): Set<string> {
    const mappings = new Set<string>();
    for (const exp of this.datasetPatterns) {
      const matches = exp.exec(subject);
      if (matches) {
        for (const match of matches) {
          mappings.add(match);
        }
      }
    }
    return mappings;
  }

  protected async handleQuad(quad: RDF.Quad): Promise<void> {
    if (quad.subject.termType === 'NamedNode') {
      const datasets = this.subjectToDatasets(quad.subject.value);
      for (const dataset of datasets) {
        let summary = this.summaries.get(dataset);
        if (!summary) {
          summary = this.createSummary(dataset);
          this.summaries.set(dataset, summary);
        }
        summary.register(quad);
        if (quad.object.termType === 'BlankNode') {
          let blankNodeDatasets = this.blankNodeDatasets.get(quad.object.value);
          if (!blankNodeDatasets) {
            blankNodeDatasets = new Set();
            this.blankNodeDatasets.set(quad.object.value, blankNodeDatasets);
          }
          blankNodeDatasets.add(dataset);
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
    const blankNodeQueue = [ ...this.blankNodeDatasets.keys() ];
    const processedBlankNodes = new Set<string>();
    while (blankNodeQueue.length > 0) {
      const blankNode = blankNodeQueue.shift();
      if (blankNode && !processedBlankNodes.has(blankNode)) {
        processedBlankNodes.add(blankNode);
        const quads = this.blankNodeQuads.get(blankNode);
        if (quads) {
          const datasets = this.blankNodeDatasets.get(blankNode)!;
          for (const quad of quads) {
            for (const dataset of datasets) {
              this.summaries.get(dataset)!.register(quad);
              if (
                quad.object.termType === 'BlankNode' &&
                !this.blankNodeDatasets.has(quad.object.value) &&
                !processedBlankNodes.has(quad.object.value)
              ) {
                this.blankNodeDatasets.set(quad.object.value, new Set<string>([ dataset ]));
                blankNodeQueue.push(quad.object.value);
              }
            }
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
   * Regular expressions used to map subjects to datasets.
   */
  datasetPatterns: string[];
}
