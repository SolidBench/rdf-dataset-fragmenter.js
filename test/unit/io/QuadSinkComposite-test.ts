import type { IQuadSink } from '../../../lib/io/IQuadSink';
import { QuadSinkComposite } from '../../../lib/io/QuadSinkComposite';

describe('QuadSinkComposite', () => {
  let sink: QuadSinkComposite;
  let sink1: IQuadSink;
  let sink2: IQuadSink;

  beforeEach(() => {
    sink1 = {
      push: jest.fn(),
      close: jest.fn(),
    };
    sink2 = {
      push: jest.fn(),
      close: jest.fn(),
    };
  });

  describe('for no sinks', () => {
    beforeEach(() => {
      sink = new QuadSinkComposite([]);
    });

    it('should handle a push and close', async() => {
      await sink.push('a', <any> {});
      await sink.close();
    });
  });

  describe('for 2 sinks', () => {
    beforeEach(() => {
      sink = new QuadSinkComposite([
        sink1,
        sink2,
      ]);
    });

    describe('push', () => {
      it('should delegate to the two sinks', async() => {
        const quad = <any> {};
        await sink.push('a', quad);

        expect(sink1.push).toHaveBeenCalledWith('a', quad);
        expect(sink2.push).toHaveBeenCalledWith('a', quad);
      });
    });

    describe('end', () => {
      it('should delegate to the two sinks', async() => {
        const quad = <any> {};
        await sink.close();

        expect(sink1.close).toHaveBeenCalled();
        expect(sink2.close).toHaveBeenCalled();
      });
    });
  });
});
