import { DataFactory } from 'rdf-data-factory';
import { QuadTransformStream } from '../../../lib/transform/QuadTransformStream';

const DF = new DataFactory();

describe('QuadTransformStream', () => {
  it('should invoke transform callbacks with original and transformed quads', async() => {
    const quad = DF.quad(
      DF.namedNode('http://example.org/s1'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/o'),
    );
    const transformedQuad = DF.quad(
      DF.namedNode('http://example.org/s2'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/o'),
    );

    const transformer = {
      transform: jest.fn(() => [ transformedQuad ]),
    };

    const callback = {
      run: jest.fn(async() => {}),
      initializeCallback: jest.fn(async() => {}),
      end: jest.fn(),
    };

    const stream = new QuadTransformStream([ transformer ], [ callback ]);

    const finishPromise = new Promise(resolve => stream.on('finish', resolve));

    stream.write(quad);
    stream.end();

    await finishPromise;

    expect(callback.run).toHaveBeenCalledWith(quad, [ transformedQuad ]);
  });

  it('runTransformers should return the correct quads synchronously', () => {
    const quad = DF.quad(
      DF.namedNode('http://example.org/s1'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/o'),
    );
    const transformedQuad = DF.quad(
      DF.namedNode('http://example.org/s2'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/o'),
    );
    const transformer = { transform: jest.fn(() => [ transformedQuad ]) };
    const stream = new QuadTransformStream([ transformer ]);

    const result = stream.runTransformers(quad);
    expect(result).toEqual([ transformedQuad ]);
  });

  describe('QuadTransformStream error handling', () => {
    const quad = DF.quad(
      DF.namedNode('http://example.org/s'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/o'),
    );

    it('should pass an Error object directly to the stream when a callback rejects with an Error', async() => {
      const errorInstance = new Error('Direct error rejection');
      const callback = {
        run: jest.fn().mockRejectedValue(errorInstance),
      };

      const stream = new QuadTransformStream([], [ <any> callback ]);

      const errorPromise = new Promise(resolve => stream.on('error', resolve));

      stream.write(quad);

      const err = await errorPromise;
      expect(err).toBe(errorInstance);
      expect((<Error> err).message).toBe('Direct error rejection');
    });

    it('should wrap a string rejection in a new Error object before passing it to the stream', async() => {
      const rawError = 'String rejection';
      const callback = {
        run: jest.fn().mockRejectedValue(rawError),
      };

      const stream = new QuadTransformStream([], [ <any> callback ]);

      const errorPromise = new Promise(resolve => stream.on('error', resolve));

      stream.write(quad);

      const err = await errorPromise;
      expect(err).toBeInstanceOf(Error);
      expect((<Error> err).message).toBe(rawError);
    });
  });
});
