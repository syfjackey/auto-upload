const autoUploadTool = require("../lib/index.js")
const uploadConfig = {
  uploadDir: "/home/test", // 上传目录
  localDir: "./dist" // 本地相对目录 / 绝对目录
}
const serverConfig = {
  host: "xxx.xxx.xxx.xxx",
  port: xxx,
  username: "xxxx", // 非必填，如不填会要求手动输入
  password: "xxxx" // 非必填，如不填会要求手动输入
}
autoUploadTool(uploadConfig, serverConfig)
