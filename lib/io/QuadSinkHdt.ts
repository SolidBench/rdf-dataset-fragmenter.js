import type * as RDF from '@rdfjs/types';
import { IQuadSinkFileOptions, QuadSinkFile } from './QuadSinkFile';
import { convertToHdt, pullHdtCppDockerImage } from './hdtUtil';

export class QuadSinkHdt extends QuadSinkFile {
    private readonly files: string[] = [];
    public constructor(options: IQuadSinkFileOptions) {
        super(options);
    }

    async push(iri: string, quad: RDF.Quad): Promise<void> {
        const path = this.getFilePath(iri);
        super.push(iri, quad);
        this.files.push(path);
    }
    async close(): Promise<void> {
        await pullHdtCppDockerImage();
        for (const file of this.files) {
            await convertToHdt(file);
        }
        await super.close();
    }
}