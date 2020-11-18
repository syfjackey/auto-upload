import { AbsoluteFilePath, DirPath, RelativeFilePath, ZipConfig } from "./type";
export default class ZipTools {
    outDir: DirPath;
    name: string;
    rootDir: DirPath;
    isIncludeDir: string | false;
    constructor({ outDir, name, rootDir, isIncludeDir }: ZipConfig);
    zip(): Promise<[AbsoluteFilePath, RelativeFilePath, ZipTools]>;
    clear(delPath?: DirPath): void;
    private deleteFolder;
}
