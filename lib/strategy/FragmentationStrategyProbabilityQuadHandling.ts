import type * as RDF from '@rdfjs/types';
import prand from 'pure-rand';
import type { IQuadSink } from '../io/IQuadSink';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';
import { FragmentationStrategySubject } from './FragmentationStrategySubject';

export class FragmentationStrategyProbabilityQuadHandling extends FragmentationStrategyStreamAdapter {
  private readonly generationProbability: number;
  private readonly strategy: FragmentationStrategyStreamAdapter;
  private readonly partitionByResourceType: boolean;
  private readonly resourceHasBeenSkipped: Set<string> = new Set();
  private readonly relativePath?: string;
  /**
   * A random generator
   */
  private randomGenerator: prand.RandomGenerator;
  /**
     * @param {FragmentationStrategyStreamAdapter} strategy - the strategy handling the quads
     * @param {number} generationProbability - The probability of the quad to be handled by the strategy
     */
  public constructor(strategy: FragmentationStrategyStreamAdapter,
    generationProbability: number,
    partitionByResourceType?: boolean,
    relativePath?: string,
    randomSeed?: number) {
    super();
    this.strategy = strategy;
    this.generationProbability = generationProbability;
    this.partitionByResourceType = partitionByResourceType ?? false;
    this.relativePath = relativePath;
    if (this.generationProbability !== undefined &&
      (this.generationProbability > 100 || this.generationProbability < 0)) {
      throw new Error('The probability to generate shape information should be between 0 and 100');
    }
    if (randomSeed === undefined) {
      const seed = Date.now() * Math.random();
      this.randomGenerator = prand.xoroshiro128plus(seed);
    } else {
      this.randomGenerator = prand.xoroshiro128plus(randomSeed);
    }
  }

  /**
     * Determine if the shape information should be generated.
     * returns always true if the probability is not defined.
     * @returns {boolean} indicate if the shape information should be generated
     */
  private shouldGenerate(): boolean {
    const [ randomIndex, newGenerator ] =
      prand.uniformIntDistribution(0, 100, this.randomGenerator);
    this.randomGenerator = newGenerator;
    return randomIndex <= this.generationProbability;
  }

  /**
     * Pass the quad handling to the strategy wrapped based on the probability defined by the wrapper.
     * Will skip resource type of a container if the flag partitionByResourceType is activated.
     * @param {RDF.Quad} quad - a quad
     * @param {IQuadSink} quadSink - a quad sink
   */
  public async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    const shouldGenerate = this.shouldGenerate();

    if (shouldGenerate && !this.partitionByResourceType) {
      await this.strategy.handleQuad(quad, quadSink);
      return;
    }

    if (!shouldGenerate && !this.partitionByResourceType) {
      return;
    }

    if (shouldGenerate && quad.subject.termType === 'BlankNode') {
      await this.strategy.handleQuad(quad, quadSink);
      return;
    }

    if (!shouldGenerate && quad.subject.termType === 'BlankNode') {
      return;
    }

    const iri = FragmentationStrategySubject.generateIri(quad, this.relativePath);
    const urlSplit = new URL(iri).pathname.split('/');
    const resource = urlSplit[3];
    const containerPosition = iri.indexOf(resource) + resource.length;
    const container = iri.slice(0, Math.max(0, containerPosition));

    if (!shouldGenerate && this.partitionByResourceType) {
      this.resourceHasBeenSkipped.add(container);
      return;
    }

    if (shouldGenerate &&
      this.partitionByResourceType &&
      !this.resourceHasBeenSkipped.has(container)) {
      await this.strategy.handleQuad(quad, quadSink);
    }
  }
}
