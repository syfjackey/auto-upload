import { OSType } from "./type";
export declare const logString: {
    red(logStr: string): void;
    green(logStr: string): void;
    blue(logStr: string): void;
};
export declare function getAbsolutePath(pathStr: string): string;
export declare function getRelativePath(pathStr: string): string;
export declare function getFileName(filePath: string, type?: OSType): string;
export declare function getJoinPath(pathList: [string, string], step?: OSType): string;
export declare function mappingPath(path: string, fromPath: string, toPath: string, type: OSType): string;
