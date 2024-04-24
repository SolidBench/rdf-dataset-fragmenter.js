import { DataFactory } from 'rdf-data-factory';
import { FragmentationConstant }
  from '../../../lib/strategy/FragmentationConstant';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

describe('FragmentationConstant', () => {
  let sink: any;
  describe('constructor', () => {
    it('should construct', () => {
      const locationIri = 'bar';

      const strategy = new FragmentationConstant(locationIri);

      expect(strategy).toBeDefined();
      expect(strategy.locationIri).toBe(locationIri);
    });
  });

  describe('fragment', () => {
    const locationIri = 'bar';
    let strategy: any;

    beforeEach(() => {
      strategy = new FragmentationConstant(locationIri);
      sink = {
        push: jest.fn(),
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle quads', async() => {
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

      expect(sink.push).toHaveBeenCalledTimes(quads.length);

      for (const [ i, quad ] of quads.entries()) {
        expect(sink.push).toHaveBeenNthCalledWith(i + 1,
          strategy.locationIri,
          quad);
      }
    });
  });
});
