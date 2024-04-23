import prand from 'pure-rand';
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
      jest.restoreAllMocks();
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

      const spy = jest.spyOn(prand, 'uniformIntDistribution')
        .mockImplementationOnce(() => <any>[ 52, this ])
        .mockImplementationOnce(() => <any>[ 32, this ])
        .mockImplementationOnce(() => <any>[ 10.44, this ])
        .mockImplementationOnce(() => <any>[ 34, this ]);

      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(spy).toHaveBeenCalledTimes(4);
      expect(wrappedStrategy.handleQuad).toHaveBeenCalledTimes(2);
      expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(1, quads[1], sink);
      expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(2, quads[2], sink);
    });

    it('should handle the correct quads given a generation probability with a seed', async() => {
      strategy = new FragmentationStrategyProbabilityQuadHandling(wrappedStrategy, 33, undefined, undefined, 0);
      /**
       * The seed will returns: 33, 46, 29, 41
       */
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

      await strategy.fragment(streamifyArray([ ...quads ]), sink);

      expect(wrappedStrategy.handleQuad).toHaveBeenCalledTimes(2);
      expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(1, quads[0], sink);
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

        const spy = jest.spyOn(prand, 'uniformIntDistribution')
          .mockImplementationOnce(() => <any>[ 100, this ])
          .mockImplementationOnce(() => <any>[ 32, this ])
          .mockImplementationOnce(() => <any>[ 10.44, this ])
          .mockImplementationOnce(() => <any>[ 22, this ])
          .mockImplementationOnce(() => <any>[ 32, this ])
          .mockImplementationOnce(() => <any>[ 99, this ])
          .mockImplementationOnce(() => <any>[ 9, this ]);

        await strategy.fragment(streamifyArray([ ...quads ]), sink);

        expect(spy).toHaveBeenCalledTimes(7);
        expect(wrappedStrategy.handleQuad).toHaveBeenCalledTimes(2);
        expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(1, quads[4], sink);
        expect(wrappedStrategy.handleQuad).toHaveBeenNthCalledWith(2, quads[6], sink);
      });
  });
});
