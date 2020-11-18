'use strict';

var fs = require('fs');
var archiver = require('archiver');
var path = require('path');
var ora = require('ora');
var chalk = require('chalk');
var ssh2 = require('ssh2');
var readLine = require('readline-sync');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var archiver__default = /*#__PURE__*/_interopDefaultLegacy(archiver);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var ora__default = /*#__PURE__*/_interopDefaultLegacy(ora);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var readLine__default = /*#__PURE__*/_interopDefaultLegacy(readLine);

var ShellType;
(function (ShellType) {
    ShellType["cmd"] = "cmd";
    ShellType["file"] = "file";
})(ShellType || (ShellType = {}));
var OSType;
(function (OSType) {
    OSType["linux"] = "/";
    OSType["win"] = "\\";
})(OSType || (OSType = {}));
var FormatType;
(function (FormatType) {
    FormatType["upload"] = "upload";
    FormatType["download"] = "download";
})(FormatType || (FormatType = {}));

const dirName = require.main.path;
const logString = {
    red(logStr) {
        console.log(chalk__default['default'].red(logStr));
    },
    green(logStr) {
        console.log(chalk__default['default'].green(logStr));
    },
    blue(logStr) {
        console.log(chalk__default['default'].blue(logStr));
    }
};
function getAbsolutePath(pathStr) {
    if (path__default['default'].isAbsolute(pathStr))
        return pathStr;
    return path__default['default'].join(dirName, pathStr);
}
function getRelativePath(pathStr) {
    return path__default['default'].relative(dirName, pathStr);
}
function getFileName(filePath, type = OSType.win) {
    return filePath.substr(filePath.lastIndexOf(type) + 1);
}
function getJoinPath(pathList, step = OSType.linux) {
    return path__default['default'].join(...pathList).replace(/\\/gi, step);
}
function mappingPath(path, fromPath, toPath, type) {
    return getJoinPath([toPath, path.replace(fromPath, "./")], type);
}

var version = "1.0.0";

const spinner = ora__default['default']("文件压缩中...");
const zipName = `auto-upload-${version}`;
class ZipTools {
    constructor({ outDir = "./" + zipName, name = zipName, rootDir = "./dist", isIncludeDir = false }) {
        this.outDir = outDir;
        this.name = name;
        this.rootDir = rootDir;
        this.isIncludeDir = isIncludeDir;
    }
    zip() {
        return new Promise((resolve, reject) => {
            const outZipPath = getAbsolutePath(this.outDir);
            if (!fs__default['default'].existsSync(outZipPath)) {
                fs__default['default'].mkdirSync(outZipPath);
            }
            const ouputZip = path__default['default'].join(outZipPath, `${this.name}.zip`);
            const output = fs__default['default'].createWriteStream(ouputZip);
            const archive = archiver__default['default']("zip", {
                zlib: { level: 9 }
            });
            output.on("close", () => {
                logString.green(`\n压缩完成,路径为:${ouputZip}`);
                spinner.stop();
                resolve([ouputZip, getRelativePath(ouputZip), this]);
            });
            archive.on("error", function (err) {
                spinner.stop();
                reject(err);
            });
            archive.pipe(output);
            const rootDirPath = getAbsolutePath(this.rootDir);
            archive.directory(rootDirPath, this.isIncludeDir);
            logString.green(`开始压缩${rootDirPath}`);
            spinner.start();
            archive.finalize();
        });
    }
    clear(delPath = this.outDir) {
        const delDir = getAbsolutePath(delPath);
        this.deleteFolder(delDir);
    }
    deleteFolder(path) {
        let files = [];
        if (fs__default['default'].existsSync(path)) {
            files = fs__default['default'].readdirSync(path);
            files.forEach((file, index) => {
                let curPath = path + "/" + file;
                if (fs__default['default'].statSync(curPath).isDirectory()) {
                    this.deleteFolder(curPath);
                }
                else {
                    fs__default['default'].unlinkSync(curPath);
                }
            });
            fs__default['default'].rmdirSync(path);
        }
    }
}

class Client {
    constructor(server) {
        this.conn = new ssh2.Client();
        this.connPromise = this.connect(server);
        this.server = server;
    }
    connect(server) {
        return new Promise((resolve, reject) => {
            this.conn
                .on("ready", () => {
                logString.green(`与服务端${server.host}:${server.port}连接成功`);
                resolve(this.conn);
            })
                .on("error", (err) => {
                logString.red(`与服务端${server.host}:${server.port}连接失败`);
                reject(err);
            })
                .on("end", () => {
                logString.red(`与服务端${server.host}:${server.port}的连接断开`);
            })
                .on("close", () => {
                logString.red(`与服务端${server.host}:${server.port}的连接关闭`);
            })
                .connect(server);
        });
    }
    shell(cmd, type = ShellType.cmd) {
        return new Promise((resolve, reject) => {
            var buf = "";
            let cmdStr = typeof cmd === "string" ? cmd : cmd.join("\n");
            if (type === ShellType.file) {
                cmdStr = fs__default['default'].readFileSync(cmdStr, "utf-8");
            }
            this.connPromise.then(() => {
                this.conn.shell(function (err, stream) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    else {
                        var bData = false;
                        stream
                            .on("data", function (data) {
                            if (bData == false) {
                                bData = true;
                                stream.end(`${cmdStr}\nexit\n`);
                            }
                            buf = buf + "--间隔符--" + data;
                        })
                            .on("close", function () {
                            resolve(buf);
                        })
                            .stderr.on("data", function (data) {
                            console.log("shell错误: " + data);
                            reject(data);
                        });
                    }
                });
                return this.conn;
            });
        });
    }
    exec(cmd, type = ShellType.cmd) {
        return new Promise((resolve, reject) => {
            var buf = "";
            let cmdStr = typeof cmd === "string" ? cmd : cmd.join("\n");
            if (type === ShellType.file) {
                cmdStr = fs__default['default'].readFileSync(cmdStr, "utf-8");
            }
            this.connPromise.then(() => {
                this.conn.exec(cmdStr, function (err, stream) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    else {
                        var bData = false;
                        stream
                            .on("data", function (data) {
                            if (bData == false) {
                                bData = true;
                                stream.end();
                            }
                            buf = buf + data;
                        })
                            .on("close", function () {
                            resolve(buf);
                        })
                            .stderr.on("data", function (data) {
                            console.log("exec错误: " + data);
                            reject(data);
                        });
                    }
                });
                return this.conn;
            });
        });
    }
    close() {
        this.conn.end();
    }
    uploadFile(localFile, uploadDir, reName) {
        return new Promise((resolve) => {
            const absoluteLocalFile = getAbsolutePath(localFile);
            const fileName = reName || getFileName(absoluteLocalFile);
            const spinner = ora__default['default']("准备上传...");
            this.connPromise.then(() => {
                spinner.start();
                this.conn.sftp((err, sftp) => {
                    if (err) {
                        spinner.text = "发生错误,上传停止!";
                        spinner.stop();
                        logString.red(`发生错误,上传停止!`);
                        throw err;
                    }
                    spinner.text = "正在上传...";
                    const uploadFilePath = getJoinPath([uploadDir, fileName]);
                    sftp.fastPut(absoluteLocalFile, uploadFilePath, (err) => {
                        if (err) {
                            spinner.text = "发生错误,上传停止!";
                            logString.red(`发生错误,上传停止!`);
                            throw err;
                        }
                        spinner.stop();
                        logString.green("文件上传成功");
                        logString.blue(`上传地址:${uploadFilePath}`);
                        resolve([uploadFilePath, uploadDir, fileName]);
                    });
                });
            });
        });
    }
    downloadFile(downloadFile, localDir, reName) {
        return new Promise((resolve) => {
            const fileName = reName || getFileName(downloadFile, OSType.linux);
            const spinner = ora__default['default']("准备下载...");
            this.connPromise.then(() => {
                spinner.start();
                this.conn.sftp((err, sftp) => {
                    if (err) {
                        spinner.text = "发生错误,下载停止!";
                        spinner.stop();
                        logString.red(`发生错误,下载停止!`);
                        throw err;
                    }
                    spinner.text = "正在下载...";
                    const absoluteLocalDir = getAbsolutePath(localDir);
                    const localFilePath = getJoinPath([absoluteLocalDir, fileName]);
                    sftp.fastGet(downloadFile, localFilePath, (err) => {
                        if (err) {
                            spinner.text = "发生错误,下载停止!";
                            logString.red(`发生错误,下载停止!`);
                            throw err;
                        }
                        spinner.stop();
                        logString.green("文件下载成功");
                        logString.blue(`下载地址:${localFilePath}`);
                        resolve([localFilePath, absoluteLocalDir, fileName]);
                    });
                });
            });
        });
    }
    async uploadDir(fromDir, toDir) {
        const [dirList, fileList] = await this.getAndFormat(fromDir, toDir, FormatType.upload);
        return [dirList, fileList];
    }
    async downloadDir(fromDir, toDir) {
        const [dirList, fileList] = await this.getAndFormat(fromDir, toDir, FormatType.download);
        return [dirList, fileList];
    }
    async GetFileAndDirList(formDir, type) {
        const dirArr = [];
        const fileArr = [];
        if (type === OSType.win) {
            await this._winG(formDir, dirArr, fileArr);
        }
        else {
            await this._linuxG(formDir, dirArr, fileArr);
        }
        return [dirArr, fileArr];
    }
    _winG(formDir, dirArr, fileArr) {
        const absoluteLocalPath = getAbsolutePath(formDir);
        const dirs = fs__default['default'].readdirSync(absoluteLocalPath);
        for (var i = 0; i < dirs.length; i++) {
            const sPath = getJoinPath([absoluteLocalPath, dirs[i]], OSType.win);
            const stat = fs__default['default'].statSync(sPath);
            if (stat.isDirectory()) {
                dirArr.push(sPath);
                this._winG(sPath, dirArr, fileArr);
            }
            else {
                fileArr.push(sPath);
            }
        }
    }
    async _linuxG(formDir, dirArr, fileArr) {
        const findFileCommand = `find ${formDir} -type f `;
        const dataStr = await this.exec(findFileCommand);
        dataStr.split("\n").forEach((path) => {
            if (!!path === true)
                fileArr.push(path);
        });
        fileArr.forEach((path) => {
            dirArr.push(path.substring(0, path.lastIndexOf("/") + 1));
        });
    }
    formatByOs([dirArr, fileArr], [fromDir, toDir], type) {
        const absoluteFromDir = getAbsolutePath(fromDir);
        const absoluteToDir = getAbsolutePath(toDir);
        let fileList = [];
        let dirList = [];
        dirList = dirArr.map((dir) => {
            return mappingPath(dir, absoluteFromDir, absoluteToDir, type);
        });
        fileList = fileArr.map((file) => {
            return [file, mappingPath(file, absoluteFromDir, absoluteToDir, type)];
        });
        return [dirList, fileList];
    }
    async getAndFormat(fromDir, toDir, type) {
        const [dirList, fileList] = await this.GetFileAndDirList(fromDir, type === FormatType.upload ? OSType.win : OSType.linux);
        return this.formatByOs([dirList, fileList], [fromDir, toDir], type === FormatType.upload ? OSType.linux : OSType.win);
    }
}

const cmdList = {
    clearDir(uploadDir) {
        return `if [ -d "${uploadDir}" ];then \r  rm -rf ${uploadDir} \r fi \r mkdir ${uploadDir}`;
    },
    unZip(uploadDir, fileName) {
        return [`cd ${uploadDir}`, `unzip ${fileName}`, `rm -rf ${fileName}`];
    }
};
async function autoUpLoad({ uploadDir, localDir = "./dist" }, serverConfig) {
    const absoluteLocalDir = getAbsolutePath(localDir);
    checkConfig(absoluteLocalDir, uploadDir, serverConfig);
    const zipTools = initZipTools(absoluteLocalDir);
    const ssh2Client = initSSH2Client(serverConfig);
    try {
        const [localZipFile] = await zipTools.zip();
        await uploadFilesToServer(ssh2Client, localZipFile, uploadDir);
    }
    catch (error) {
        logString.red(error);
    }
    logString.green('清理压缩文件...');
    clear(zipTools, ssh2Client);
    logEnd();
}
function checkConfig(localDir, uploadDir, serverConfig) {
    const absoluteLocalDir = getAbsolutePath(localDir);
    if (!fs__default['default'].existsSync(localDir)) {
        throw new Error(`[${absoluteLocalDir}]目录不存在！`);
    }
    const stat = fs__default['default'].lstatSync(localDir);
    const is_dir = stat.isDirectory();
    if (!is_dir) {
        throw new Error(`[${absoluteLocalDir}]非目录`);
    }
    if (!uploadDir || typeof uploadDir !== "string") {
        throw new Error(`必须输入上传目录！`);
    }
    if (!serverConfig || !serverConfig.host || !serverConfig.port) {
        throw new Error(`必须输入服务器IP和端口！`);
    }
}
function initZipTools(localDir) {
    return new ZipTools({
        rootDir: localDir
    });
}
function initSSH2Client(serverConfig) {
    if (!serverConfig.username) {
        const username = readLine__default['default'].question(`${serverConfig.host} username :`);
        serverConfig.username = username;
    }
    if (!serverConfig.password) {
        const password = readLine__default['default'].question(`${serverConfig.host} password :`);
        serverConfig.password = password;
    }
    return new Client(serverConfig);
}
async function uploadFilesToServer(ssh2Client, localZipFile, uploadDir) {
    await ClearUploadDir(ssh2Client, uploadDir);
    const [, , fileName] = await ssh2Client.uploadFile(localZipFile, uploadDir);
    logString.green('开始解压文件...');
    await UnZip(ssh2Client, uploadDir, fileName);
}
async function ClearUploadDir(ssh2Client, uploadDir) {
    const chooiseClear = readLine__default['default'].keyInYN(`${ssh2Client.server.host} : ${uploadDir} will be clear. please make sure!`);
    if (chooiseClear) {
        return await ssh2Client.shell(cmdList.clearDir(uploadDir));
    }
    throw new Error(`停止上传`);
}
async function UnZip(ssh2Client, uploadDir, fileName) {
    return await ssh2Client.shell(cmdList.unZip(uploadDir, fileName));
}
function clear(zip, ssh2Client) {
    zip.clear();
    ssh2Client.close();
}
function logEnd() {
    logString.green("所有操作结束");
}

module.exports = autoUpLoad;
