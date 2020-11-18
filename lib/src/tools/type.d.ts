export declare type RelativeFilePath = string;
export declare type AbsoluteFilePath = string;
export declare type RelativeDirPath = string;
export declare type AbsoluteDirPath = string;
export declare type FilePath = RelativeFilePath | AbsoluteFilePath;
export declare type DirPath = RelativeDirPath | AbsoluteDirPath;
export interface ZipConfig {
    outDir?: RelativeDirPath;
    name?: string;
    rootDir?: RelativeDirPath;
    isIncludeDir?: string | false;
}
declare type IP = string;
declare type Port = number;
declare type KeyFromFile = string;
export declare type Command = string;
export declare type CommandResult = string;
export interface ServerConfig {
    host: IP;
    port: Port;
    username?: string;
    password?: string;
    privateKey?: KeyFromFile;
}
export declare enum ShellType {
    cmd = "cmd",
    file = "file"
}
export interface AutoUploadConfig {
    uploadDir: AbsoluteDirPath;
    localDir?: RelativeDirPath | AbsoluteDirPath;
}
export declare enum OSType {
    linux = "/",
    win = "\\"
}
export declare enum FormatType {
    upload = "upload",
    download = "download"
}
export {};
