<template>
  <div class="settings-view">
    <div class="page-header">
      <h2>设置</h2>
      <p class="subtitle">配置 IPFS 发布相关选项</p>
    </div>

    <div class="settings-card">
      <div class="setting-section">
        <h3>IPFS 网关设置</h3>
        <p class="setting-desc">设置用于在线访问 IPFS 内容的网关地址</p>
        
        <el-form label-position="top">
          <el-form-item label="网关地址">
            <el-input 
              v-model="settings.gateway" 
              placeholder="https://ipfs.io/ipfs/"
              size="large"
            >
              <template #append>
                <el-button @click="testGateway" :loading="testing">
                  测试连接
                </el-button>
              </template>
            </el-input>
            <div class="input-tip">
              示例格式：https://ipfs.io/ipfs/ 或 https://dweb.link/ipfs/
            </div>
          </el-form-item>

          <el-form-item label="常用网关">
            <div class="gateway-presets">
              <el-tag 
                v-for="preset in gatewayPresets" 
                :key="preset.url"
                :type="settings.gateway === preset.url ? 'warning' : 'info'"
                class="preset-tag"
                @click="selectPreset(preset.url)"
              >
                {{ preset.name }}
              </el-tag>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="setting-section">
        <h3>本地节点设置</h3>
        <p class="setting-desc">配置本地 IPFS 节点 API 地址</p>
        
        <el-form label-position="top">
          <el-form-item label="API 地址">
            <el-input 
              v-model="settings.apiEndpoint" 
              placeholder="http://127.0.0.1:5001"
              size="large"
            />
            <div class="input-tip">
              默认为 IPFS Desktop 的本地 API 地址
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="form-actions">
        <el-button @click="resetSettings" size="large">恢复默认</el-button>
        <el-button type="primary" @click="saveSettings" size="large" :loading="saving">
          保存设置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

interface Settings {
  gateway: string;
  apiEndpoint: string;
}

const settings = ref<Settings>({
  gateway: 'https://ipfs.io/ipfs/',
  apiEndpoint: 'http://127.0.0.1:5001'
});

const testing = ref(false);
const saving = ref(false);

const gatewayPresets = [
  { name: 'IPFS.io', url: 'https://ipfs.io/ipfs/' },
  { name: 'Dweb.link', url: 'https://dweb.link/ipfs/' },
  { name: 'Cloudflare', url: 'https://cloudflare-ipfs.com/ipfs/' },
  { name: 'Pinata', url: 'https://gateway.pinata.cloud/ipfs/' },
  { name: 'W3s.link', url: 'https://w3s.link/ipfs/' }
];

onMounted(async () => {
  await loadSettings();
});

async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (response.success && response.data) {
      settings.value = { ...settings.value, ...response.data };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

function selectPreset(url: string) {
  settings.value.gateway = url;
}

async function testGateway() {
  if (!settings.value.gateway) {
    ElMessage.warning('请输入网关地址');
    return;
  }
  
  testing.value = true;
  try {
    // 使用一个已知的小 CID 来测试
    const testCid = 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX';
    const testUrl = `${settings.value.gateway}${testCid}`;
    
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    ElMessage.success('网关连接正常');
  } catch (error) {
    ElMessage.warning('网关可能不可用，但仍可保存');
  } finally {
    testing.value = false;
  }
}

async function saveSettings() {
  // 确保网关地址以 / 结尾
  if (settings.value.gateway && !settings.value.gateway.endsWith('/')) {
    settings.value.gateway += '/';
  }
  
  saving.value = true;
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'saveSettings', 
      data: settings.value 
    });
    
    if (response.success) {
      ElMessage.success('设置已保存');
    } else {
      throw new Error(response.error);
    }
  } catch (error: any) {
    ElMessage.error('保存失败: ' + error.message);
  } finally {
    saving.value = false;
  }
}

async function resetSettings() {
  settings.value = {
    gateway: 'https://ipfs.io/ipfs/',
    apiEndpoint: 'http://127.0.0.1:5001'
  };
  await saveSettings();
}
</script>

<style scoped lang="less">
@primary: #F5D104;
@primary-dark: #D4B503;
@bg-dark: #1a1a2e;

.settings-view {
  max-width: 700px;
}

.page-header {
  margin-bottom: 24px;
  
  h2 {
    margin: 0 0 4px 0;
    font-size: 24px;
    color: @bg-dark;
    font-weight: 600;
  }
  
  .subtitle {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
  }
}

.settings-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.setting-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-of-type {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: @bg-dark;
    font-weight: 600;
  }
  
  .setting-desc {
    margin: 0 0 20px 0;
    font-size: 13px;
    color: #6b7280;
  }
}

.input-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.gateway-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  .preset-tag {
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      transform: translateY(-1px);
    }
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

// 媒体查询适配
@media (max-width: 768px) {
  .settings-card {
    padding: 24px 20px;
  }
  
  .page-header h2 {
    font-size: 20px;
  }
  
  .form-actions {
    flex-direction: column-reverse;
    
    .el-button {
      width: 100%;
    }
  }
  
  .gateway-presets {
    .preset-tag {
      flex: 1;
      text-align: center;
      min-width: calc(50% - 4px);
    }
  }
}

@media (max-width: 480px) {
  .settings-card {
    padding: 16px;
    border-radius: 12px;
  }
  
  .page-header h2 {
    font-size: 18px;
  }
}
</style>
