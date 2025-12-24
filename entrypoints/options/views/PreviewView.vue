<template>
  <div class="preview-view">
    <div class="page-header">
      <div class="header-left article-links">
        <el-button @click="goBack" size="large" class="link-btn">
          {{ $t("preview.backToList") }}
        </el-button>
        <el-button @click="goToEditor" type="primary" size="large" class="link-btn">
          {{ $t("preview.editArticle") }}
        </el-button>
      </div>
      <!-- 链接显示区域 -->
      <div v-if="record?.status === 'published'" class="article-links">
        <!-- 永久链接 -->
        <el-button
          v-if="record?.ipnsUrl"
          @click="openUrl(record.ipnsUrl)"
          class="link-btn permanent"
        >
          <el-icon><Link /></el-icon>
          永久链接
        </el-button>

        <!-- CID 链接 -->
        <el-button
          v-if="record?.cid && record?.url"
          @click="openUrl(record.url)"
          class="link-btn cid"
        >
          <el-icon><Link /></el-icon>
          CID 链接
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="record" class="article-container">
      <article class="article-card">
        <header class="article-header">
          <h1>{{ record.title }}</h1>
          <div class="article-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(record.createdAt) }}
            </span>
            <span class="meta-item status-badge" :class="record.status">
              {{ record.status === "published" ? "已发布" : "草稿" }}
            </span>
          </div>
        </header>
        <div class="article-content markdown-body" v-html="renderedContent"></div>
      </article>
    </div>

    <div v-else class="empty-state">
      <el-empty :description="$t('preview.articleNotFound')">
        <el-button type="primary" @click="goBack">{{
          $t("preview.backToList")
        }}</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Link, DocumentCopy, Calendar, Edit } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { marked } from "marked";
import type { PublishRecord } from "../../../utils/storage";

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const record = ref<PublishRecord | null>(null);
const loading = ref(true);

const renderedContent = computed(() => {
  if (!record.value) return "";
  return marked.parse(record.value.content) as string;
});

onMounted(async () => {
  await loadRecord();
});

async function loadRecord() {
  loading.value = true;
  try {
    const response = await chrome.runtime.sendMessage({ action: "getRecords" });
    if (response.success) {
      const id = route.params.id as string;
      record.value = response.data.find((r: PublishRecord) => r.id === id) || null;
    }
  } catch (e) {
    console.error("Failed to load record:", e);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push("/list");
}

function goToEditor() {
  if (record.value) {
    router.push(`/editor/${record.value.id}`);
  }
}

function openUrl(url: string | undefined) {
  if (url) {
    window.open(url, "_blank");
  }
}

function openLink() {
  if (record.value) {
    window.open(record.value.url, "_blank");
  }
}

async function copyLink() {
  if (record.value) {
    await navigator.clipboard.writeText(record.value.url || "");
    ElMessage.success(t("preview.linkCopied"));
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("zh-CN");
}

function truncateCid(cid: string): string {
  if (cid.length <= 20) return cid;
  return cid.substring(0, 10) + "..." + cid.substring(cid.length - 8);
}
</script>

<style scoped lang="less">
@primary: #f5d104;
@primary-dark: #d4b503;
@bg-dark: #1a1a2e;

.preview-view {
  max-width: 900px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.loading-state {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
}

.article-container {
  .article-card {
    background: #fff;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }

  .article-header {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;

    h1 {
      margin: 0 0 16px 0;
      font-size: 28px;
      font-weight: 700;
      color: @bg-dark;
      line-height: 1.4;
    }

    .article-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      align-items: center;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #6b7280;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;

        &.published {
          background: #dcfce7;
          color: #16a34a;
        }

        &.draft {
          background: #f3f4f6;
          color: #6b7280;
        }
      }
    }
  }

  .article-content {
    font-size: 16px;
    line-height: 1.8;
    color: #374151;
  }
}

.article-links {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.link-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 5px;
  height: auto;
  font-size: 13px;
  font-weight: 500;
  justify-content: flex-start;
  background: @primary;
  border: 1px solid @primary-dark;
  color: @bg-dark;

  &:hover {
    background: @primary-dark;
    border-color: @primary-dark;
  }

  .link-url {
    font-size: 12px;
    font-weight: 400;
    margin-left: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 400px;
    color: @bg-dark;
    opacity: 0.8;
  }

  &.cid {
    .link-url {
      font-family: "Monaco", "Menlo", monospace;
    }
  }
}
.empty-state {
  background: #fff;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
}

// Markdown 渲染样式
.markdown-body {
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    color: @bg-dark;
    line-height: 1.4;
  }

  :deep(h1) {
    font-size: 2em;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.3em;
  }
  :deep(h2) {
    font-size: 1.5em;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.3em;
  }
  :deep(h3) {
    font-size: 1.25em;
  }
  :deep(h4) {
    font-size: 1em;
  }

  :deep(p) {
    margin: 0 0 16px 0;
  }

  :deep(a) {
    color: @primary-dark;
    text-decoration: none;

    &:hover {
      color: @primary;
      text-decoration: underline;
    }
  }

  :deep(code) {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "Monaco", "Menlo", monospace;
    font-size: 0.9em;
    color: #ef4444;
  }

  :deep(pre) {
    background: #1f2937;
    color: #e5e7eb;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;

    code {
      background: none;
      color: inherit;
      padding: 0;
    }
  }

  :deep(blockquote) {
    margin: 16px 0;
    padding: 12px 20px;
    border-left: 4px solid @primary;
    background: #fefce8;
    color: #6b7280;

    p:last-child {
      margin-bottom: 0;
    }
  }

  :deep(ul),
  :deep(ol) {
    margin: 16px 0;
    padding-left: 2em;
  }

  :deep(li) {
    margin: 8px 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;

    th,
    td {
      border: 1px solid #e5e7eb;
      padding: 10px 14px;
      text-align: left;
    }

    th {
      background: #f9fafb;
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: #f9fafb;
    }
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 24px 0;
  }
}

// 媒体查询适配
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

    .header-left,
    .header-actions {
      width: 100%;
    }

    .header-actions {
      justify-content: flex-end;
    }
  }

  .article-card {
    padding: 24px !important;

    .article-header {
      h1 {
        font-size: 22px;
      }

      .article-meta {
        flex-direction: column;
        gap: 8px;
      }
    }
  }

  .markdown-body {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .article-card {
    padding: 16px !important;
    border-radius: 12px !important;

    .article-header {
      margin-bottom: 20px;
      padding-bottom: 16px;

      h1 {
        font-size: 20px;
      }
    }
  }
}
</style>
