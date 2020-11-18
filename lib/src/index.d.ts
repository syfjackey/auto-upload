import { AutoUploadConfig, ServerConfig } from "./tools/type";
declare function autoUpLoad({ uploadDir, localDir }: AutoUploadConfig, serverConfig: ServerConfig): Promise<void>;
export default autoUpLoad;
