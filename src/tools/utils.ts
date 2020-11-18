import chalk from "chalk"
import path from "path"

import { OSType } from "./type"
const dirName = require.main!.path
export const logString = {
  red(logStr: string) {
    console.log(chalk.red(logStr))
  },
  green(logStr: string) {
    console.log(chalk.green(logStr))
  },
  blue(logStr: string) {
    console.log(chalk.blue(logStr))
  }
}
export function getAbsolutePath(pathStr: string): string {
  if (path.isAbsolute(pathStr)) return pathStr
  return path.join(dirName, pathStr)
}
export function getRelativePath(pathStr: string): string {
  return path.relative(dirName, pathStr)
}
export function getFileName(filePath: string, type: OSType = OSType.win): string {
  return filePath.substr(filePath.lastIndexOf(type) + 1)
}
export function getJoinPath(pathList: [string, string], step: OSType = OSType.linux) {
  return path.join(...pathList).replace(/\\/gi, step)
}
export function mappingPath(path:string,fromPath: string, toPath: string, type: OSType) {
  return getJoinPath([toPath, path.replace(fromPath, "./")], type)
}
