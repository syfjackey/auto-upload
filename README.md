# auto-upload-linux
自动压缩指定目录，并上传至服务器指定目录。

## 适用范围

本地文件上传至linux服务器，linux需支持ssh2和unzip

## 如何使用

```js
const autoUploadTool = require("auto-upload-linux")
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
```

