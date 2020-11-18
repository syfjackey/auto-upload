import fs from "fs"
import archiver from "archiver"
import path from "path"
import ora from "ora"
import { getAbsolutePath, getRelativePath, logString } from "./utils"
import { version } from "../../package.json"
import {
  AbsoluteDirPath,
  AbsoluteFilePath,
  DirPath,
  RelativeFilePath,
  ZipConfig
} from "./type"
const spinner = ora("文件压缩中...")
const zipName = `auto-upload-${version}`
export default class ZipTools {
  outDir: DirPath
  name: string
  rootDir: DirPath
  isIncludeDir: string | false
  constructor({
    outDir = "./" + zipName,
    name = zipName,
    rootDir = "./dist",
    isIncludeDir = false
  }: ZipConfig) {
    this.outDir = outDir
    this.name = name
    this.rootDir = rootDir
    this.isIncludeDir = isIncludeDir
  }
  zip(): Promise<[AbsoluteFilePath, RelativeFilePath, ZipTools]> {
    return new Promise((resolve, reject) => {
      const outZipPath = getAbsolutePath(this.outDir)
      if (!fs.existsSync(outZipPath)) {
        fs.mkdirSync(outZipPath)
      }
      const ouputZip = path.join(outZipPath, `${this.name}.zip`)
      const output = fs.createWriteStream(ouputZip)
      const archive = archiver("zip", {
        zlib: { level: 9 }
      })
      output.on("close", () => {
        logString.green(`\n压缩完成,路径为:${ouputZip}`)
        spinner.stop()
        resolve([ouputZip, getRelativePath(ouputZip), this])
      })
      archive.on("error", function (err) {
        spinner.stop()
        reject(err)
      })
      archive.pipe(output)
      const rootDirPath = getAbsolutePath(this.rootDir)
      archive.directory(rootDirPath, this.isIncludeDir)
      logString.green(`开始压缩${rootDirPath}`)
      spinner.start()
      archive.finalize()
    })
  }
  clear(delPath: DirPath = this.outDir) {
    const delDir = getAbsolutePath(delPath)
    this.deleteFolder(delDir)
  }
  private deleteFolder(path: AbsoluteDirPath): void {
    let files = []
    if (fs.existsSync(path)) {
      files = fs.readdirSync(path)
      files.forEach((file, index) => {
        let curPath = path + "/" + file
        if (fs.statSync(curPath).isDirectory()) {
          this.deleteFolder(curPath)
        } else {
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(path)
    }
  }
}
