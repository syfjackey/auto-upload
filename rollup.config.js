import ts from "rollup-plugin-typescript2"
import path from "path"
import commonjs from '@rollup/plugin-commonjs' // commonjs模块转换插件
import json from '@rollup/plugin-json';
const extensions = [".js", ".ts", ".tsx"]
const tsPlugin = ts({
  tsconfig: path.join(__dirname, "./tsconfig.json"), // 导入本地ts配置
  extensions
})
export default {
  input: "src/index.ts",
  output: {
    file: "lib/index.js",
    format: "cjs"
  },
  plugins: [json(),commonjs(), tsPlugin]
}
