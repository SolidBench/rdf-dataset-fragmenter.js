import type { ReadStream, WriteStream } from 'tty';
import type { ILoaderProperties } from 'componentsjs';
import { Loader } from 'componentsjs';
import type { Fragmenter } from './Fragmenter';

/**
 * Generic run function for starting the fragmenter from a given config
 * @param args - Command line arguments.
 * @param stdin - Standard input stream.
 * @param stdout - Standard output stream.
 * @param stderr - Standard error stream.
 * @param properties - Components loader properties.
 */
export const runCustom = function(
  args: string[],
  stdin: ReadStream,
  stdout: WriteStream,
  stderr: WriteStream,
  properties: ILoaderProperties,
): void {
  (async(): Promise<void> => {
    if (args.length !== 1) {
      stderr.write(`Missing config path argument.
Usage:
  rdf-dataset-fragmenter path/to/config.json
`);
      return;
    }
    const configPath = args[0];

    // Setup from config file
    const loader = new Loader(properties);
    await loader.registerAvailableModuleResources();
    const fragmenter: Fragmenter = <Fragmenter> await loader
      .instantiateFromUrl('urn:rdf-dataset-fragmenter:default', configPath);
    return await fragmenter.fragment();
  })().then((): void => {
    // Done
  }).catch(error => process.stderr.write(`${error.stack}\n`));
};

/**
 * Run function for starting the server from the command line
 * @param moduleRootPath - Path to the module's root.
 */
export const runCli = function(moduleRootPath: string): void {
  const argv = process.argv.slice(2);
  runCustom(argv, process.stdin, process.stdout, process.stderr, { mainModulePath: moduleRootPath });
};
