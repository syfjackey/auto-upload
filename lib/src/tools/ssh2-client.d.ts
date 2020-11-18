import { Client as SSH2Client } from "ssh2";
import { Command, ShellType, CommandResult, ServerConfig, AbsoluteFilePath, AbsoluteDirPath, FilePath, DirPath } from "./type";
export default class Client {
    connPromise: Promise<SSH2Client>;
    private conn;
    server: ServerConfig;
    constructor(server: ServerConfig);
    private connect;
    shell(cmd: Command | Array<Command>, type?: ShellType): Promise<CommandResult>;
    exec(cmd: Command | Array<Command>, type?: ShellType): Promise<CommandResult>;
    close(): void;
    uploadFile(localFile: FilePath, uploadDir: AbsoluteDirPath, reName?: string): Promise<[AbsoluteFilePath, AbsoluteDirPath, string]>;
    downloadFile(downloadFile: AbsoluteFilePath, localDir: DirPath, reName?: string): Promise<[AbsoluteFilePath, AbsoluteDirPath, string]>;
    uploadDir(fromDir: DirPath, toDir: DirPath): Promise<(string[] | [string, string][])[]>;
    downloadDir(fromDir: DirPath, toDir: DirPath): Promise<(string[] | [string, string][])[]>;
    private GetFileAndDirList;
    private _winG;
    private _linuxG;
    private formatByOs;
    private getAndFormat;
}
