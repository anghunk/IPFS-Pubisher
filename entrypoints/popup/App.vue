<template>
  <div class="popup-app">
    <div class="logo">
      <img src="/icon/128.png" alt="IPFS Publisher" />
    </div>
    <h2>IPFS Publisher</h2>
    <p class="desc">一键发布 Markdown 内容到 IPFS 的浏览器扩展</p>

    <el-button type="primary" @click="openPublisher" class="open-btn">
      打开发布器
    </el-button>

    <div class="status-indicator" :class="nodeStatus">
      <span class="dot"></span>
      <span>{{ nodeStatus === 'connected' ? 'IPFS 已连接' : 'IPFS 未连接' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Upload, Edit } from "@element-plus/icons-vue";

const nodeStatus = ref<"connected" | "disconnected">("disconnected");

onMounted(async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: "checkNode" });
    nodeStatus.value = response.available ? "connected" : "disconnected";
  } catch {
    nodeStatus.value = "disconnected";
  }
});

function openPublisher() {
  chrome.runtime.sendMessage({ action: "open_options_page" });
  window.close();
}
</script>

<style scoped lang="less">
.popup-app {
  width: 280px;
  padding: 24px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);

  .logo {
    margin-bottom: 12px;

    img {
      width: 64px;
      height: 64px;
    }
  }

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    color: #1f2937;
  }

  .desc {
    margin: 0 0 20px 0;
    font-size: 13px;
    color: #6b7280;
  }

  .open-btn {
    width: 100%;
    height: 44px;
    font-size: 15px;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
    font-size: 12px;
    color: #6b7280;
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
    }
    
    &.connected .dot {
      background: #22c55e;
    }
  }
}
</style>
