import { Fragmenter } from '../../lib/Fragmenter';

describe('Fragmenter', () => {
  let quadSource: any;
  let fragmentationStrategy: any;
  let quadSink: any;
  let fragmenter: Fragmenter;
  beforeEach(() => {
    quadSource = {
      getQuads: jest.fn(() => 'QUADS'),
    };
    fragmentationStrategy = {
      fragment: jest.fn(),
    };
    quadSink = {
      close: jest.fn(),
    };
    fragmenter = new Fragmenter({ quadSource, fragmentationStrategy, quadSink });
  });

  describe('fragment', () => {
    it('should handle an empty stream', async() => {
      await fragmenter.fragment();
      expect(quadSource.getQuads).toHaveBeenCalledTimes(1);
      expect(fragmentationStrategy.fragment).toHaveBeenCalledTimes(1);
      expect(fragmentationStrategy.fragment).toHaveBeenCalledWith('QUADS', quadSink);
      expect(quadSink.close).toHaveBeenCalledTimes(1);
    });
  });
});
