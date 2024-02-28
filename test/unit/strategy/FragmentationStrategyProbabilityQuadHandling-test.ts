import { DataFactory } from 'rdf-data-factory';
import { FragmentationStrategyProbabilityQuadHandling }
  from '../../../lib/strategy/FragmentationStrategyProbabilityQuadHandling';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

describe('FragmentationWrapperProbabilityQuadHandling', () => {
  let sink: any;
  let wrappedStrategy: any;
  let strategy: FragmentationStrategyProbabilityQuadHandling;

  describe('constructor', () => {
    beforeEach(() => {
      wrappedStrategy = {
        handleQuad: jest.fn(),
      };
    });
    it('should throw given a generationProbability below than 0', () => {
      expect(() => new FragmentationStrategyProbabilityQuadHandling(wrappedStrategy, -1)).toThrow();
    });

    it('should throw given a generationProbability higher than 100', () => {
      expect(() => new FragmentationStrategyProbabilityQuadHandling(wrappedStrategy, 1_000)).toThrow();
    });
  });

  describe('fragment', () => {
    beforeEach(() => {
      sink = {
        push: jest.fn(),
      };
      wrappedStrategy = {
        handleQuad: jest.fn(),
      };
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should not handle an empty stream', async() => {
      strategy = new FragmentationStrategyProbabilityQuadHandling(wrappedStrategy, 23);
      await strategy.fragment(streamifyArray([]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle every quad given a generation probability of 100', async() => {
      strategy = new FragmentationStrategyProbabilityQuadHandling(wrappedStrategy, 100);
      const quads = [
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo1'),
          DF.namedNode('bar1'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo2'),
          DF.namedNode('bar2'),
        ),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(wrappedStrategy.handleQuad).toHaveBeenCalledTimes(quads.length);

      for (const [ i, quad ] of quads.entries()) {
        expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(i + 1, quad, sink);
      }
    });

    it('should not handle given a generation probability of 0', async() => {
      strategy = new FragmentationStrategyProbabilityQuadHandling(wrappedStrategy, 0);
      const quads = [
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo1'),
          DF.namedNode('bar1'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo2'),
          DF.namedNode('bar2'),
        ),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(wrappedStrategy.handleQuad).toHaveBeenCalledTimes(0);
    });

    it('should handle the correct quads given a generation probability', async() => {
      strategy = new FragmentationStrategyProbabilityQuadHandling(wrappedStrategy, 33);
      const quads = [
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo'),
          DF.namedNode('bar'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo1'),
          DF.namedNode('bar1'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo2'),
          DF.namedNode('bar2'),
        ),
        DF.quad(
          DF.blankNode(),
          DF.namedNode('foo3'),
          DF.namedNode('bar3'),
        ),
      ];

      const spy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.52)
        .mockReturnValueOnce(0.32)
        .mockReturnValueOnce(0.104_4)
        .mockReturnValueOnce(0.34);

      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(spy).toHaveBeenCalledTimes(4);
      expect(wrappedStrategy.handleQuad).toHaveBeenCalledTimes(2);
      expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(1, quads[1], sink);
      expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(2, quads[2], sink);
    });

    it('should handle the correct quads given a generation probability and skipResourceType flag activated',
      async() => {
        strategy = new FragmentationStrategyProbabilityQuadHandling(wrappedStrategy, 33, true);
        const quads = [
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000065/foo/aaa'),
            DF.namedNode('foo'),
            DF.namedNode('bar'),
          ),
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000065/foo/bar'),
            DF.namedNode('foo1'),
            DF.namedNode('bar1'),
          ),
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000065/foo/bar'),
            DF.namedNode('foo2'),
            DF.namedNode('bar2'),
          ),
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000065/foo'),
            DF.namedNode('foo3'),
            DF.namedNode('bar3'),
          ),
          DF.quad(
            DF.blankNode(),
            DF.namedNode('foo2'),
            DF.namedNode('bar2'),
          ),
          DF.quad(
            DF.blankNode(),
            DF.namedNode('foo2'),
            DF.namedNode('bar2'),
          ),
          DF.quad(
            DF.namedNode('http://localhost:3000/pods/00000000000000000022/foo'),
            DF.namedNode('foo3'),
            DF.namedNode('bar3'),
          ),
        ];

        const spy = jest.spyOn(Math, 'random')
          .mockReturnValueOnce(100)
          .mockReturnValueOnce(0.32)
          .mockReturnValueOnce(0.104_4)
          .mockReturnValueOnce(0.22)
          .mockReturnValueOnce(0.32)
          .mockReturnValueOnce(0.99)
          .mockReturnValueOnce(0.09);

        await strategy.fragment(streamifyArray([ ...quads ]), sink);

        expect(spy).toHaveBeenCalledTimes(7);
        expect(wrappedStrategy.handleQuad).toHaveBeenCalledTimes(2);
        expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(1, quads[4], sink);
        expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(2, quads[6], sink);
      });
  });
});
