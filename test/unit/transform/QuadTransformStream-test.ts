import { DataFactory } from 'rdf-data-factory';
import { QuadTransformStream } from '../../../lib/transform/QuadTransformStream';

const DF = new DataFactory();

describe('QuadTransformStream', () => {
  it('should invoke transform callbacks with original and transformed quads', () => {
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

    const result = stream.runTransformers(quad);

    expect(result).toEqual([ transformedQuad ]);
    expect(callback.run).toHaveBeenCalledWith(quad, [ transformedQuad ]);
  });
});
