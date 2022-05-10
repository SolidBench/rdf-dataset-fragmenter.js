import { DataFactory } from 'rdf-data-factory';
import type { IQuadSink } from '../../../lib/io/IQuadSink';
import { QuadSinkFiltered } from '../../../lib/io/QuadSinkFiltered';

const DF = new DataFactory();

describe('QuadSinkFiltered', () => {
  let sink: QuadSinkFiltered;
  let sinkInner: IQuadSink;

  beforeEach(() => {
    sinkInner = {
      push: jest.fn(),
      close: jest.fn(),
    };
  });

  describe('for a truthy filter', () => {
    beforeEach(() => {
      sink = new QuadSinkFiltered(sinkInner, { matches: () => true });
    });

    describe('push', () => {
      it('should delegate to the inner sink', async() => {
        const quad1 = DF.quad(DF.namedNode('a:b'), DF.namedNode('a:b'), DF.namedNode('a:b'));
        const quad2 = DF.quad(DF.namedNode('b:b'), DF.namedNode('b:b'), DF.namedNode('b:b'));
        await sink.push('a', quad1);
        await sink.push('b', quad2);

        expect(sinkInner.push).toHaveBeenCalledWith('a', quad1);
        expect(sinkInner.push).toHaveBeenCalledWith('b', quad2);
      });
    });

    describe('end', () => {
      it('should delegate to the two sinks', async() => {
        await sink.close();

        expect(sinkInner.close).toHaveBeenCalled();
      });
    });
  });

  describe('for a conditional filter', () => {
    beforeEach(() => {
      sink = new QuadSinkFiltered(sinkInner, { matches: quad => quad.subject.value.startsWith('a') });
    });

    describe('push', () => {
      it('should delegate to the inner sink if the filter matches', async() => {
        const quad1 = DF.quad(DF.namedNode('a:b'), DF.namedNode('a:b'), DF.namedNode('a:b'));
        const quad2 = DF.quad(DF.namedNode('b:b'), DF.namedNode('b:b'), DF.namedNode('b:b'));
        await sink.push('a', quad1);
        await sink.push('b', quad2);

        expect(sinkInner.push).toHaveBeenCalledWith('a', quad1);
        expect(sinkInner.push).not.toHaveBeenCalledWith('b', quad2);
      });
    });

    describe('end', () => {
      it('should delegate to the two sinks', async() => {
        await sink.close();

        expect(sinkInner.close).toHaveBeenCalled();
      });
    });
  });
});
