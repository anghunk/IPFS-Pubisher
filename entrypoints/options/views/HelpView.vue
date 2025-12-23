<template>
  <div class="help-view">
    <div class="page-header">
      <h2>{{ $t('help.title') }}</h2>
      <p class="subtitle">{{ $t('help.subtitle') }}</p>
    </div>

    <div class="help-card">
      <!-- 步骤 1: 安装 IPFS Desktop -->
      <div class="help-section">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3>{{ $t('help.step1Title') }}</h3>
          <p>{{ $t('help.step1Desc') }}</p>
          <a href="https://docs.ipfs.tech/install/ipfs-desktop/" target="_blank" class="download-link">
            {{ $t('help.downloadIpfs') }} →
          </a>
        </div>
      </div>

      <!-- 步骤 2: 启动 IPFS Desktop -->
      <div class="help-section">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>{{ $t('help.step2Title') }}</h3>
          <p>{{ $t('help.step2Desc') }}</p>
          <div class="check-item">
            <span class="check-icon">✓</span>
            <span>{{ $t('help.checkWebui') }}</span>
            <a href="http://127.0.0.1:5001/webui/" target="_blank">http://127.0.0.1:5001/webui/</a>
          </div>
        </div>
      </div>

      <!-- 步骤 3: 配置 CORS -->
      <div class="help-section">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3>{{ $t('help.step3Title') }}</h3>
          <p>{{ $t('help.step3Desc') }}</p>
          
          <div class="config-steps">
            <p class="config-step">{{ $t('help.configStep1') }}</p>
            <p class="config-step">{{ $t('help.configStep2') }}</p>
            <p class="config-step">{{ $t('help.configStep3') }}</p>
          </div>

          <div class="code-block">
            <div class="code-header">
              <span>API.HTTPHeaders</span>
              <el-button size="small" @click="copyConfig">{{ copied ? $t('common.copied') : $t('common.copy') }}</el-button>
            </div>
            <pre><code>{{ configCode }}</code></pre>
          </div>
          
          <p class="warning-text">{{ $t('help.restartNote') }}</p>
        </div>
      </div>

      <!-- 步骤 4: 验证连接 -->
      <div class="help-section">
        <div class="step-number">4</div>
        <div class="step-content">
          <h3>{{ $t('help.step4Title') }}</h3>
          <p>{{ $t('help.step4Desc') }}</p>
          
          <div class="status-check">
            <span class="status-dot" :class="nodeStatus"></span>
            <span>{{ nodeStatus === 'connected' ? $t('nav.ipfsConnected') : $t('nav.ipfsDisconnected') }}</span>
            <el-button size="small" @click="checkConnection" :loading="checking">
              {{ $t('help.recheck') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const nodeStatus = ref<'connected' | 'disconnected'>('disconnected');
const checking = ref(false);
const copied = ref(false);

const configCode = `"API": {
  "HTTPHeaders": {
    "Access-Control-Allow-Origin": [
      "https://webui.ipfs.io",
      "http://webui.ipfs.io.ipns.localhost:8080",
      "*"
    ],
    "Access-Control-Allow-Methods": ["GET", "POST", "PUT"],
    "Access-Control-Allow-Headers": ["Authorization"],
    "Access-Control-Expose-Headers": ["Location"],
    "Access-Control-Allow-Credentials": ["true"]
  }
}`;

onMounted(async () => {
  await checkConnection();
});

async function checkConnection() {
  checking.value = true;
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkNode' });
    nodeStatus.value = response.available ? 'connected' : 'disconnected';
  } catch {
    nodeStatus.value = 'disconnected';
  } finally {
    checking.value = false;
  }
}

async function copyConfig() {
  try {
    await navigator.clipboard.writeText(configCode);
    copied.value = true;
    ElMessage.success(t('common.copied'));
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    ElMessage.error('复制失败');
  }
}
</script>

<style scoped lang="less">
@primary: #F5D104;
@primary-dark: #D4B503;
@bg-dark: #1a1a2e;

.help-view {
  max-width: 750px;
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

.help-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.help-section {
  display: flex;
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:first-child {
    padding-top: 0;
  }
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.step-number {
  width: 36px;
  height: 36px;
  background: @primary;
  color: @bg-dark;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: @bg-dark;
    font-weight: 600;
  }
  
  p {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.6;
  }
}

.download-link {
  display: inline-block;
  color: @primary-dark;
  font-weight: 500;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 14px;
  
  .check-icon {
    color: #22c55e;
    font-weight: bold;
  }
  
  a {
    color: @primary-dark;
    margin-left: auto;
  }
}

.config-steps {
  margin-bottom: 16px;
  
  .config-step {
    margin: 0;
    padding: 8px 0;
    padding-left: 20px;
    position: relative;
    font-size: 14px;
    color: #374151;
    
    &::before {
      content: "•";
      position: absolute;
      left: 0;
      color: @primary-dark;
    }
  }
}

.code-block {
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  
  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #2d2d2d;
    
    span {
      color: #9ca3af;
      font-size: 12px;
    }
  }
  
  pre {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    
    code {
      color: #e5e7eb;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
  }
}

.warning-text {
  color: #f59e0b !important;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &::before {
    content: "⚠️";
  }
}

.status-check {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  
  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ef4444;
    
    &.connected {
      background: #22c55e;
    }
  }
}

@media (max-width: 768px) {
  .help-card {
    padding: 24px 20px;
  }
  
  .help-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .step-number {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}
</style>
