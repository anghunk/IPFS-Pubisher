import { defineConfig } from 'wxt';
import pkg from './package.json';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // 将所有输出写入同一目录
  // https://wxt.dev/guide/resources/upgrading.html#default-output-directories-changed
  outDirTemplate: '{{browser}}-mv{{manifestVersion}}',
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'IPFS Publisher',
    version: pkg.version,
    description: '一键发布 Markdown 内容到 IPFS 的浏览器扩展',
    permissions: ['storage'],
    host_permissions: ['http://127.0.0.1:5001/*'],
    action: {
      default_title: '打开 IPFS 发布器',
    },
  },
});
