/**
 * IPFS 通信逻辑封装
 * 使用本地 IPFS Desktop 节点
 */

export interface IpfsUploadResult {
  cid: string;
  url: string;
}

// IPFS API 地址
const IPFS_API = 'http://127.0.0.1:5001/api/v0';

/**
 * 上传内容到 IPFS
 * @param content 文本内容
 * @param filename 文件名
 * @param mimeType MIME 类型（默认为 text/html）
 */
export async function uploadToIpfs(content: string, filename: string, mimeType: string = 'text/html'): Promise<IpfsUploadResult> {
  const formData = new FormData();
  const blob = new Blob([content], { type: mimeType });
  formData.append('file', blob, filename);

  try {
    const response = await fetch(`${IPFS_API}/add?pin=true`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS API Error: ${response.status}`);
    }

    const text = await response.text();
    // IPFS 返回 NDJSON 格式，取最后一行
    const lines = text.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const data = JSON.parse(lastLine);
    const cid = data.Hash;

    return {
      cid: cid,
      url: `https://ipfs.io/ipfs/${cid}`,
    };
  } catch (error: any) {
    console.error('Upload failed:', error);
    throw new Error(`上传失败: ${error.message}`);
  }
}

/**
 * 检查 IPFS 节点是否可用
 */
export async function checkIpfsNode(): Promise<boolean> {
  try {
    const response = await fetch(`${IPFS_API}/id`, {
      method: 'POST',
    });
    return response.ok;
  } catch {
    return false;
  }
}
