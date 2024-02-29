import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from '../io/IQuadSink';
import type { IDatasetSummaryCollector } from '../summary/DatasetSummaryCollector';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';

/**
 * Fragmentation strategy that collects dataset summaries per dataset.
 */
export class FragmentationStrategyDatasetSummary extends FragmentationStrategyStreamAdapter {
  private readonly collectors: IDatasetSummaryCollector[];
  private readonly subjectToDataset: Map<RegExp, string>;

  private readonly blankNodeQuads: Map<string, RDF.Quad[]>;
  private readonly blankNodeDatasets: Map<string, Set<string>>;

  public constructor(options: IFragmentationStrategyDatasetSummaryOptions) {
    super();
    this.blankNodeQuads = new Map();
    this.blankNodeDatasets = new Map();
    this.collectors = options.collectors;
    this.subjectToDataset = new Map(Object.entries(options.subjectToDataset).map(([ exp, sub ]) => [
      new RegExp(exp, 'u'),
      sub,
    ]));
  }

  protected getMappings(iri: string, map: Map<RegExp, string>): Set<string> {
    const mappings = new Set<string>();
    for (const [ exp, sub ] of map) {
      if (exp.test(iri)) {
        mappings.add(iri.replace(exp, sub));
      }
    }
    return mappings;
  }

  protected registerDatasetQuad(dataset: string, quad: RDF.Quad): void {
    this.collectors.forEach(collector => collector.register(dataset, quad));
  }

  protected async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    if (quad.subject.termType === 'NamedNode') {
      const subjectDatasets = this.getMappings(quad.subject.value, this.subjectToDataset);
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
    for (const collector of this.collectors) {
      await collector.flush(quadSink);
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
  /**
   * Collectors used to generate the actual descriptions.
   */
  collectors: IDatasetSummaryCollector[];
}
