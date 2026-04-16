import * as fs from 'node:fs';
import * as os from 'node:os';
import { join } from 'node:path';
import { DataFactory } from 'rdf-data-factory';
import type { IQuadMatcher } from '../../../lib/quadmatcher/IQuadMatcher';
import { TransformCallbackMap } from '../../../lib/transformCallback/TransformCallbackMap';

const DF = new DataFactory();
async function expectFileContentEventually(filePath: string, expected: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      if (content === expected) {
        return;
      }
    } catch {
      // Ignored while waiting for file flush.
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  await expect(fs.promises.readFile(filePath, 'utf8')).resolves.toBe(expected);
}

describe('TransformCallbackMap', () => {
  let matcher: IQuadMatcher;
  let fieldToMap: 'subject' | 'predicate' | 'object' | 'graph';
  let columns: string[];
  let file: string;
  let transformCallbackMap: TransformCallbackMap;

  beforeEach(() => {
    matcher = {
      matches: jest.fn(quad => quad.object.value === 'http://example.org/matched'),
    };
    fieldToMap = 'subject';
    columns = [ 'original', 'transformed' ];
    file = join(os.tmpdir(), `rdf-dataset-fragmenter-tests-map-${Date.now()}-${Math.random()}.csv`);
    transformCallbackMap = new TransformCallbackMap(
      [ matcher ],
      fieldToMap,
      columns,
      file,
    );
  });

  afterEach(async() => {
    await fs.promises.unlink(file).catch(() => {});
  });

  it('should be instantiated correctly', () => {
    expect(transformCallbackMap).toBeInstanceOf(TransformCallbackMap);
  });

  it('should throw if run is called before initialization', async() => {
    await expect(transformCallbackMap.run(
      DF.quad(DF.namedNode('http://example.org/s1'), DF.namedNode('http://example.org/p'), DF.namedNode('http://example.org/o')),
      [],
    )).rejects.toThrow('File stream is not initialized. Call initializeCallback() first.');
  });

  it('should initialize stream and write header', async() => {
    await transformCallbackMap.initializeCallback();
    transformCallbackMap.end();

    await expectFileContentEventually(file, 'original,transformed\n');
  });

  it('should write mapped values for matching transformed quads', async() => {
    await transformCallbackMap.initializeCallback();

    const original = DF.quad(
      DF.namedNode('http://example.org/s-original'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/o'),
    );
    const transformedMatch = DF.quad(
      DF.namedNode('http://example.org/s-transformed'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/matched'),
    );
    const transformedNoMatch = DF.quad(
      DF.namedNode('http://example.org/s-ignored'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/not-matched'),
    );

    await transformCallbackMap.run(original, [ transformedMatch, transformedNoMatch ]);
    transformCallbackMap.end();

    await expectFileContentEventually(file, 'original,transformed\nhttp://example.org/s-original,http://example.org/s-transformed\n');
  });

  it('should not write mapped values if no transformed quads match', async() => {
    await transformCallbackMap.initializeCallback();

    const original = DF.quad(
      DF.namedNode('http://example.org/s-original'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/o'),
    );
    const transformedNoMatch = DF.quad(
      DF.namedNode('http://example.org/s-ignored'),
      DF.namedNode('http://example.org/p'),
      DF.namedNode('http://example.org/not-matched'),
    );

    await transformCallbackMap.run(original, [ transformedNoMatch ]);
    transformCallbackMap.end();

    await expectFileContentEventually(file, 'original,transformed\n');
  });

  it('should not fail ending before initialization', () => {
    expect(() => transformCallbackMap.end()).not.toThrow();
  });
});
