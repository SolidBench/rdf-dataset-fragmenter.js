import * as fs from 'fs';
import { PassThrough } from 'stream';
import { DataFactory } from 'rdf-data-factory';
import { ParallelFileWriter } from '../../../lib/io/ParallelFileWriter';
import mocked = jest.mocked;

const mkdirp = require('mkdirp');
const stringifyStream = require('stream-to-string');

const DF = new DataFactory();

jest.mock('fs');
jest.mock('mkdirp');

describe('ParallelFileWriter', () => {
  let writer: ParallelFileWriter;
  let fileWriteStream: fs.WriteStream;
  beforeEach(() => {
    writer = new ParallelFileWriter({ streams: 3 });
    jest.resetAllMocks();
    fileWriteStream = <any> new PassThrough();
    mocked(fs.createWriteStream).mockReturnValue(fileWriteStream);
  });

  describe('getWriteStream', () => {
    it('should return a write stream', async() => {
      const writeStream = await writer.getWriteStream('/path/to/file.ttl', 'text/turtle');
      expect(writeStream).toBeInstanceOf(PassThrough);
    });

    it('should create the directory', async() => {
      await writer.getWriteStream('/path/to/file.ttl', 'text/turtle');
      expect(mkdirp).toHaveBeenNthCalledWith(1, '/path/to');
    });

    it('should open a file write stream in append-mode', async() => {
      await writer.getWriteStream('/path/to/file.ttl', 'text/turtle');
      expect(fs.createWriteStream).toHaveBeenNthCalledWith(1, '/path/to/file.ttl', { flags: 'a' });
    });

    it('should return a write stream that causes RDF serialization of quads', async() => {
      const writeStream = await writer.getWriteStream('/path/to/file.ttl', 'text/turtle');
      writeStream.write(DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')));
      writeStream.end();
      expect(await stringifyStream(fileWriteStream)).toEqual(`<ex:s1> <ex:p1> <ex:o1>.\n`);
    });

    it('should return the same write stream on repeated calls', async() => {
      const writeStream1 = await writer.getWriteStream('/path/to/file.ttl', 'text/turtle');
      const writeStream2 = await writer.getWriteStream('/path/to/file.ttl', 'text/turtle');
      const writeStream3 = await writer.getWriteStream('/path/to/file.ttl', 'text/turtle');
      expect(writeStream1).toBe(writeStream2);
      expect(writeStream1).toBe(writeStream3);
    });

    it('should return the different write streams for different files', async() => {
      const writeStream1 = await writer.getWriteStream('/path/to/file1.ttl', 'text/turtle');
      const writeStream2 = await writer.getWriteStream('/path/to/file2.ttl', 'text/turtle');
      const writeStream3 = await writer.getWriteStream('/path/to/file3.ttl', 'text/turtle');
      expect(writeStream1).not.toBe(writeStream2);
      expect(writeStream1).not.toBe(writeStream3);
      expect(writeStream2).not.toBe(writeStream3);
    });
  });

  describe('close', () => {
    it('should do nothing when no streams were opened', async() => {
      await writer.close();
    });

    it('should close opened streams', async() => {
      const writeStream1 = await writer.getWriteStream('/path/to/file1.ttl', 'text/turtle');
      const writeStream2 = await writer.getWriteStream('/path/to/file2.ttl', 'text/turtle');
      jest.spyOn(writeStream1, 'end');
      jest.spyOn(writeStream2, 'end');
      await writer.close();
      expect(writeStream1.end).toHaveBeenCalledTimes(1);
      expect(writeStream2.end).toHaveBeenCalledTimes(1);
    });
  });

  it('should only allow a fixed number of open streams', async() => {
    const fileWriteStream1 = <any> new PassThrough();
    const fileWriteStream2 = <any> new PassThrough();
    const fileWriteStream3 = <any> new PassThrough();
    const fileWriteStream4 = <any> new PassThrough();

    mocked(fs.createWriteStream).mockReturnValue(fileWriteStream1);
    const writeStream1 = await writer.getWriteStream('/path/to/file1.ttl', 'text/turtle');
    mocked(fs.createWriteStream).mockReturnValue(fileWriteStream2);
    const writeStream2 = await writer.getWriteStream('/path/to/file2.ttl', 'text/turtle');
    mocked(fs.createWriteStream).mockReturnValue(fileWriteStream3);
    const writeStream3 = await writer.getWriteStream('/path/to/file3.ttl', 'text/turtle');
    jest.spyOn(writeStream1, 'end');
    jest.spyOn(writeStream2, 'end');
    jest.spyOn(writeStream3, 'end');
    writeStream1.write(DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')));
    writeStream2.write(DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')));
    writeStream3.write(DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')));

    // Opening another one will cause the first one to close
    mocked(fs.createWriteStream).mockReturnValue(fileWriteStream4);
    const writeStream4 = await writer.getWriteStream('/path/to/file4.ttl', 'text/turtle');
    jest.spyOn(writeStream4, 'end');

    // Write some more to the open streams
    writeStream2.write(DF.quad(DF.namedNode('ex:s2.2'), DF.namedNode('ex:p2.2'), DF.namedNode('ex:o2.2')));
    writeStream4.write(DF.quad(DF.namedNode('ex:s4'), DF.namedNode('ex:p4'), DF.namedNode('ex:o4')));

    // Check if the first stream has ended
    expect(writeStream1.end).toHaveBeenCalledTimes(1);
    expect(writeStream2.end).not.toHaveBeenCalled();
    expect(writeStream3.end).not.toHaveBeenCalled();
    expect(writeStream4.end).not.toHaveBeenCalled();

    // Check if the file has been written
    expect(await stringifyStream(fileWriteStream1)).toEqual(`<ex:s1> <ex:p1> <ex:o1>.\n`);

    // Close all remaining streams
    await writer.close();
    expect(writeStream2.end).toHaveBeenCalled();
    expect(writeStream3.end).toHaveBeenCalled();
    expect(writeStream4.end).toHaveBeenCalled();

    // Check if the files has been written
    expect(await stringifyStream(fileWriteStream2)).toEqual(`<ex:s2> <ex:p2> <ex:o2>.\n<ex:s2.2> <ex:p2.2> <ex:o2.2>.\n`);
    expect(await stringifyStream(fileWriteStream3)).toEqual(`<ex:s3> <ex:p3> <ex:o3>.\n`);
    expect(await stringifyStream(fileWriteStream4)).toEqual(`<ex:s4> <ex:p4> <ex:o4>.\n`);
  });
});
