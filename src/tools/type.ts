export type RelativeFilePath = string
export type AbsoluteFilePath = string
export type RelativeDirPath = string
export type AbsoluteDirPath = string
export type FilePath=RelativeFilePath | AbsoluteFilePath
export type DirPath =RelativeDirPath | AbsoluteDirPath
export interface ZipConfig {
  outDir?: RelativeDirPath
  name?: string
  rootDir?: RelativeDirPath
  isIncludeDir?: string | false
}
type IP = string
type Port = number
type KeyFromFile = string
export type Command = string
export type CommandResult = string
export interface ServerConfig {
  host: IP
  port: Port
  username?: string
  password?: string
  privateKey?: KeyFromFile
}
export enum ShellType {
  cmd = "cmd",
  file = "file"
}
export interface AutoUploadConfig {
  uploadDir: AbsoluteDirPath
  localDir?: RelativeDirPath | AbsoluteDirPath
}
export enum OSType{
  linux='/',
  win='\\'
}
export enum FormatType {
  upload = "upload",
  download = "download"
}