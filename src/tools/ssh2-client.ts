import { Client as SSH2Client } from "ssh2"
import fs from "fs"
import ora from "ora"
import { getAbsolutePath, getFileName, getJoinPath, logString, mappingPath } from "./utils"
import {
  Command,
  ShellType,
  CommandResult,
  ServerConfig,
  AbsoluteFilePath,
  AbsoluteDirPath,
  OSType,
  FilePath,
  DirPath,
  FormatType
} from "./type"
export default class Client {
  connPromise: Promise<SSH2Client>
  private conn: SSH2Client
  server: ServerConfig
  constructor(server: ServerConfig) {
    this.conn = new SSH2Client()
    this.connPromise = this.connect(server)
    this.server = server
  }
  private connect(server: ServerConfig): Promise<SSH2Client> {
    return new Promise((resolve, reject) => {
      this.conn
        .on("ready", () => {
          logString.green(`与服务端${server.host}:${server.port}连接成功`)
          resolve(this.conn)
        })
        .on("error", (err) => {
          logString.red(`与服务端${server.host}:${server.port}连接失败`)
          reject(err)
        })
        .on("end", () => {
          logString.red(`与服务端${server.host}:${server.port}的连接断开`)
        })
        .on("close", () => {
          logString.red(`与服务端${server.host}:${server.port}的连接关闭`)
        })
        .connect(server)
    })
  }
  shell(cmd: Command | Array<Command>, type: ShellType = ShellType.cmd): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      var buf = ""
      let cmdStr: Command = typeof cmd === "string" ? cmd : cmd.join("\n")
      if (type === ShellType.file) {
        cmdStr = fs.readFileSync(cmdStr, "utf-8")
      }
      this.connPromise.then(
        (): SSH2Client => {
          this.conn.shell(function (err, stream) {
            if (err) {
              console.log(err)
              reject(err)
            } else {
              var bData = false
              stream
                .on("data", function (data: string) {
                  if (bData == false) {
                    bData = true
                    stream.end(`${cmdStr}\nexit\n`)
                  }
                  buf = buf + "--间隔符--" + data
                })
                .on("close", function () {
                  resolve(buf)
                })
                .stderr.on("data", function (data) {
                  console.log("shell错误: " + data)
                  reject(data)
                })
            }
          })
          return this.conn
        }
      )
    })
  }
  exec(cmd: Command | Array<Command>, type: ShellType = ShellType.cmd): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      var buf = ""
      let cmdStr: Command = typeof cmd === "string" ? cmd : cmd.join("\n")
      if (type === ShellType.file) {
        cmdStr = fs.readFileSync(cmdStr, "utf-8")
      }
      this.connPromise.then(
        (): SSH2Client => {
          this.conn.exec(cmdStr, function (err, stream) {
            if (err) {
              console.log(err)
              reject(err)
            } else {
              var bData = false
              stream
                .on("data", function (data: string) {
                  if (bData == false) {
                    bData = true
                    stream.end()
                  }
                  buf = buf + data
                })
                .on("close", function () {
                  resolve(buf)
                })
                .stderr.on("data", function (data) {
                  console.log("exec错误: " + data)
                  reject(data)
                })
            }
          })
          return this.conn
        }
      )
    })
  }
  close(): void {
    this.conn.end()
  }
  uploadFile(
    localFile: FilePath,
    uploadDir: AbsoluteDirPath,
    reName?: string
  ): Promise<[AbsoluteFilePath, AbsoluteDirPath, string]> {
    return new Promise((resolve) => {
      const absoluteLocalFile = getAbsolutePath(localFile)
      const fileName = reName || getFileName(absoluteLocalFile)
      const spinner = ora("准备上传...")
      this.connPromise.then(() => {
        spinner.start()
        this.conn.sftp((err, sftp) => {
          if (err) {
            spinner.text = "发生错误,上传停止!"
            spinner.stop()
            logString.red(`发生错误,上传停止!`)
            throw err
          }
          spinner.text = "正在上传..."
          const uploadFilePath = getJoinPath([uploadDir, fileName])
          sftp.fastPut(absoluteLocalFile, uploadFilePath, (err) => {
            if (err) {
              spinner.text = "发生错误,上传停止!"
              logString.red(`发生错误,上传停止!`)
              throw err
            }
            spinner.stop()
            logString.green("文件上传成功")
            logString.blue(`上传地址:${uploadFilePath}`)
            resolve([uploadFilePath, uploadDir, fileName])
          })
        })
      })
    })
  }
  downloadFile(
    downloadFile: AbsoluteFilePath,
    localDir: DirPath,
    reName?: string
  ): Promise<[AbsoluteFilePath, AbsoluteDirPath, string]> {
    return new Promise((resolve) => {
      const fileName = reName || getFileName(downloadFile, OSType.linux)
      const spinner = ora("准备下载...")
      this.connPromise.then(() => {
        spinner.start()
        this.conn.sftp((err, sftp) => {
          if (err) {
            spinner.text = "发生错误,下载停止!"
            spinner.stop()
            logString.red(`发生错误,下载停止!`)
            throw err
          }
          spinner.text = "正在下载..."
          const absoluteLocalDir = getAbsolutePath(localDir)
          const localFilePath = getJoinPath([absoluteLocalDir, fileName])
          sftp.fastGet(downloadFile, localFilePath, (err) => {
            if (err) {
              spinner.text = "发生错误,下载停止!"
              logString.red(`发生错误,下载停止!`)
              throw err
            }
            spinner.stop()
            logString.green("文件下载成功")
            logString.blue(`下载地址:${localFilePath}`)
            resolve([localFilePath, absoluteLocalDir, fileName])
          })
        })
      })
    })
  }
  async uploadDir(fromDir: DirPath, toDir: DirPath) {
    const [dirList, fileList] = await this.getAndFormat(fromDir, toDir, FormatType.upload)
    return [dirList, fileList]
  }
  async downloadDir(fromDir: DirPath, toDir: DirPath) {
    const [dirList, fileList] = await this.getAndFormat(fromDir, toDir, FormatType.download)
    return [dirList, fileList]
  }
  private async GetFileAndDirList(
    formDir: DirPath,
    type: OSType
  ): Promise<[AbsoluteDirPath[], AbsoluteFilePath[]]> {
    const dirArr: AbsoluteDirPath[] = []
    const fileArr: AbsoluteFilePath[] = []
    if (type === OSType.win) {
      await this._winG(formDir, dirArr, fileArr)
    } else {
      await this._linuxG(formDir, dirArr, fileArr)
    }
    return [dirArr, fileArr]
  }
  private _winG(formDir: DirPath, dirArr: AbsoluteDirPath[], fileArr: AbsoluteFilePath[]) {
    const absoluteLocalPath = getAbsolutePath(formDir)
    const dirs = fs.readdirSync(absoluteLocalPath)
    for (var i = 0; i < dirs.length; i++) {
      const sPath = getJoinPath([absoluteLocalPath, dirs[i]], OSType.win)
      const stat = fs.statSync(sPath)
      if (stat.isDirectory()) {
        dirArr.push(sPath)
        this._winG(sPath, dirArr, fileArr)
      } else {
        fileArr.push(sPath)
      }
    }
  }
  private async _linuxG(
    formDir: AbsoluteDirPath,
    dirArr: AbsoluteDirPath[],
    fileArr: AbsoluteFilePath[]
  ) {
    const findFileCommand = `find ${formDir} -type f `
    const dataStr = await this.exec(findFileCommand)
    dataStr.split("\n").forEach((path) => {
      if (!!path === true) fileArr.push(path)
    })
    fileArr.forEach((path) => {
      dirArr.push(path.substring(0, path.lastIndexOf("/") + 1))
    })
  }
  private formatByOs(
    [dirArr, fileArr]: [AbsoluteDirPath[], AbsoluteFilePath[]],
    [fromDir, toDir]: [DirPath, DirPath],
    type: OSType
  ): [AbsoluteDirPath[], Array<[AbsoluteFilePath, AbsoluteFilePath]>] {
    const absoluteFromDir = getAbsolutePath(fromDir)
    const absoluteToDir = getAbsolutePath(toDir)
    let fileList: Array<[AbsoluteFilePath, AbsoluteFilePath]> = []
    let dirList: AbsoluteDirPath[] = []
    dirList = dirArr.map((dir) => {
      return mappingPath(dir, absoluteFromDir, absoluteToDir, type)
    })
    fileList = fileArr.map((file) => {
      return [file, mappingPath(file, absoluteFromDir, absoluteToDir, type)]
    })
    return [dirList, fileList]
  }
  private async getAndFormat(
    fromDir: DirPath,
    toDir: DirPath,
    type: FormatType
  ): Promise<[AbsoluteDirPath[], Array<[AbsoluteFilePath, AbsoluteFilePath]>]> {
    const [dirList, fileList] = await this.GetFileAndDirList(
      fromDir,
      type === FormatType.upload ? OSType.win : OSType.linux
    )
    return this.formatByOs(
      [dirList, fileList],
      [fromDir, toDir],
      type === FormatType.upload ? OSType.linux : OSType.win
    )
  }
}
