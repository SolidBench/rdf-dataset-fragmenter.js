import * as fs from 'node:fs';
import * as mkdirpModule from 'mkdirp';
import { DataFactory } from 'rdf-data-factory';
import type { IQuadMatcher } from '../../../lib/quadmatcher/IQuadMatcher';
import { TransformCallbackMap } from '../../../lib/transformCallback/TransformCallbackMap';

const DF = new DataFactory();

jest.mock<typeof import('node:fs')>('node:fs', () => ({
  ...jest.requireActual<typeof import('node:fs')>('node:fs'),
  createWriteStream: jest.fn(),
}));

describe('TransformCallbackMap', () => {
  let matcher: IQuadMatcher;
  let fieldToMap: 'subject' | 'predicate' | 'object' | 'graph';
  let columns: string[];
  let file: string;
  let createWriteStreamMock: jest.MockedFunction<typeof fs.createWriteStream>;
  let mkdirpMock: jest.SpyInstance;
  let onMock: jest.Mock;
  let writeMock: jest.Mock;
  let endMock: jest.Mock;
  let transformCallbackMap: TransformCallbackMap;

  beforeEach(() => {
    onMock = jest.fn();
    writeMock = jest.fn();
    endMock = jest.fn();
    const fileStreamMock: any = {
      on: onMock,
      write: writeMock,
      end: endMock,
    };
    onMock.mockImplementation((event: string, listener: (...args: any[]) => void) => {
      if (event === 'open') {
        listener();
      }
      return fileStreamMock;
    });

    createWriteStreamMock = <jest.MockedFunction<typeof fs.createWriteStream>> fs.createWriteStream;
    createWriteStreamMock.mockReturnValue(fileStreamMock);
    mkdirpMock = jest.spyOn(mkdirpModule, 'mkdirp');
    mkdirpMock.mockResolvedValue(undefined);

    matcher = {
      matches: jest.fn(quad => quad.object.value === 'http://example.org/matched'),
    };
    fieldToMap = 'subject';
    columns = [ 'original', 'transformed' ];
    file = '/mock/output.csv';
    transformCallbackMap = new TransformCallbackMap(
      [ matcher ],
      fieldToMap,
      columns,
      file,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    expect(mkdirpMock).toHaveBeenCalledWith('/mock');
    expect(createWriteStreamMock).toHaveBeenCalledWith('/mock/output.csv');
    expect(writeMock).toHaveBeenCalledWith('original,transformed\n');
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
    expect(writeMock).toHaveBeenCalledWith('http://example.org/s-original,http://example.org/s-transformed\n');
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
    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(writeMock).toHaveBeenCalledWith('original,transformed\n');
  });

  it('should end initialized file stream', async() => {
    await transformCallbackMap.initializeCallback();
    transformCallbackMap.end();
    expect(endMock).toHaveBeenCalledTimes(1);
  });

  it('should not fail ending before initialization', () => {
    expect(() => transformCallbackMap.end()).not.toThrow();
  });
});
