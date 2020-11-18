import ZipTools from "./tools/zip-tools"
import SSH2Client from "./tools/ssh2-client"
import fs from "fs"
import { getAbsolutePath, logString } from "./tools/utils"
import readLine from "readline-sync"
import {
  AbsoluteDirPath,
  AbsoluteFilePath,
  AutoUploadConfig,
  Command,
  DirPath,
  ServerConfig
} from "./tools/type"
const cmdList = {
  clearDir(uploadDir: AbsoluteDirPath): Command {
    return `if [ -d "${uploadDir}" ];then \r  rm -rf ${uploadDir} \r fi \r mkdir ${uploadDir}`
  },
  unZip(uploadDir: AbsoluteDirPath, fileName: string) {
    return [`cd ${uploadDir}`, `unzip ${fileName}`, `rm -rf ${fileName}`]
  }
}
async function autoUpLoad(
  { uploadDir, localDir = "./dist" }: AutoUploadConfig,
  serverConfig: ServerConfig
) {
  const absoluteLocalDir = getAbsolutePath(localDir)
  checkConfig(absoluteLocalDir, uploadDir, serverConfig)
  const zipTools = initZipTools(absoluteLocalDir)
  const ssh2Client = initSSH2Client(serverConfig)
  try {
    const [localZipFile] = await zipTools.zip()
    await uploadFilesToServer(ssh2Client, localZipFile, uploadDir)
  } catch (error) {
    logString.red(error)
  }
  logString.green('清理压缩文件...')
  clear(zipTools, ssh2Client)
  logEnd()
}
function checkConfig(
  localDir: DirPath,
  uploadDir: AbsoluteDirPath,
  serverConfig: ServerConfig
) {
  const absoluteLocalDir = getAbsolutePath(localDir)
  if (!fs.existsSync(localDir)) {
    throw new Error(`[${absoluteLocalDir}]目录不存在！`)
  }
  const stat = fs.lstatSync(localDir)
  const is_dir = stat.isDirectory()
  if (!is_dir) {
    throw new Error(`[${absoluteLocalDir}]非目录`)
  }
  if (!uploadDir || typeof uploadDir !== "string") {
    throw new Error(`必须输入上传目录！`)
  }
  if (!serverConfig || !serverConfig.host || !serverConfig.port) {
    throw new Error(`必须输入服务器IP和端口！`)
  }
}
function initZipTools(localDir: AbsoluteDirPath) {
  return new ZipTools({
    rootDir: localDir
  })
}
function initSSH2Client(serverConfig: ServerConfig) {
  if (!serverConfig.username) {
    const username = readLine.question(`${serverConfig.host} username :`)
    serverConfig.username = username
  }
  if (!serverConfig.password) {
    const password = readLine.question(`${serverConfig.host} password :`)
    serverConfig.password = password
  }
  return new SSH2Client(serverConfig)
}
async function uploadFilesToServer(
  ssh2Client: SSH2Client,
  localZipFile: AbsoluteFilePath,
  uploadDir: AbsoluteDirPath
): Promise<void> {
  await ClearUploadDir(ssh2Client, uploadDir)
  const [, , fileName] = await ssh2Client.uploadFile(localZipFile, uploadDir)  
  logString.green('开始解压文件...')
  await UnZip(ssh2Client, uploadDir, fileName)
}
async function ClearUploadDir(ssh2Client: SSH2Client, uploadDir: AbsoluteDirPath): Promise<string> {
  const chooiseClear = readLine.keyInYN(
    `${ssh2Client.server.host} : ${uploadDir} will be clear. please make sure!`
  )
  if (chooiseClear) {
    return await ssh2Client.shell(cmdList.clearDir(uploadDir))
  }
  throw new Error(`停止上传`)
}
async function UnZip(ssh2Client: SSH2Client, uploadDir: AbsoluteDirPath, fileName: string) {
  return await ssh2Client.shell(cmdList.unZip(uploadDir, fileName))
}
function clear(zip: ZipTools, ssh2Client: SSH2Client): void {
  zip.clear()
  ssh2Client.close()
}
function logEnd(): void {
  logString.green("所有操作结束")
}

export default autoUpLoad
