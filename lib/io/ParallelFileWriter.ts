import * as fs from 'fs';
import { dirname } from 'path';
import type { Writable } from 'stream';
import { PassThrough } from 'stream';
import type * as RDF from '@rdfjs/types';
import AsyncLock = require('async-lock');
import LRUCache = require('lru-cache');
import { mkdirp } from 'mkdirp';
import rdfSerializer from 'rdf-serialize';

/**
 * A parallel file writer enables the writing to an infinite number of files in parallel.
 *
 * It works around system I/O limitations regarding the maximum number of open file descriptors
 * by internally only having a certain number of open file streams,
 * and intelligently closing/re-opening streams when needed using an LRU strategy.
 */
export class ParallelFileWriter {
  private readonly cache: LRUCache<string, IWriteEntry>;
  private readonly lock: AsyncLock;
  private fileClosingPromises: Promise<void>[];

  public constructor(options: IParallelFileWriterOptions) {
    this.cache = new LRUCache({
      max: options.streams,
      dispose: (key, value) => this.closeWriteEntry(key, value),
      noDisposeOnSet: true,
    });
    this.lock = new AsyncLock();
    this.fileClosingPromises = [];
  }

  /**
   * Get a write stream that accepts RDF/JS quads for the given file path.
   * It will automatically be serialized to the RDF format of the given content type.
   *
   * The returned stream is only safe to use until another call to this method.
   *
   * This is safe with regards to non-existing folders.
   * If any of the parent folders do not exist, they will be created.
   *
   * @param path Path to the file to write to.
   * @param contentType The content type to serialize for.
   *                    Note that this only should be content types that enable appending
   */
  public async getWriteStream(path: string, contentType: string): Promise<RDF.Stream & Writable> {
    return this.lock.acquire('getWriteStream', () => this.getWriteStreamUnsafe(path, contentType));
  }

  protected async getWriteStreamUnsafe(path: string, contentType: string): Promise<RDF.Stream & Writable> {
    // Try to get the stream from cache, or open a new one if not yet open.
    let writeEntry = this.cache.get(path);
    if (!writeEntry) {
      // Before opening new streams, wait for previous file closings to end
      await Promise.all(this.fileClosingPromises);
      this.fileClosingPromises = [];

      // Open the file stream, and prepare the RDF serializer
      const writeStream: RDF.Stream & Writable = <any> new PassThrough({ objectMode: true });
      const folder = dirname(path);
      await mkdirp(folder);
      const fileStream = fs.createWriteStream(path, { flags: 'a' });
      rdfSerializer.serialize(writeStream, { contentType }).pipe(fileStream);
      writeEntry = { writeStream, fileStream };
      this.cache.set(path, writeEntry);
    }
    return writeEntry.writeStream;
  }

  /**
   * Close all open streams.
   */
  public async close(): Promise<void> {
    // Add listeners to be able to await stream closing
    const outputStreamPromises = this.cache.keys()
      .map(key => this.cache.get(key)!.fileStream)
      .map(fileStream => new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      }));

    // Close all output streams
    this.cache.forEach(writeEntry => writeEntry.writeStream.end());

    // Wait for all streams to close
    await Promise.all(outputStreamPromises);
  }

  protected closeWriteEntry(path: string, writeEntry: IWriteEntry): void {
    this.fileClosingPromises.push(new Promise((resolve, reject) => {
      writeEntry.fileStream.on('finish', resolve);
      writeEntry.fileStream.on('error', reject);
    }));
    writeEntry.writeStream.end();
  }
}

export interface IWriteEntry {
  writeStream: RDF.Stream & Writable;
  fileStream: fs.WriteStream;
}

export interface IParallelFileWriterOptions {
  streams: number;
}
