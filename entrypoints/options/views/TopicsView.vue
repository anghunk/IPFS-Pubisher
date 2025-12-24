<template>
  <div class="topics-view">
    <div class="page-header">
      <div>
        <h2>{{ $t("topics.title") }}</h2>
        <p class="subtitle">{{ $t("topics.subtitle") }}</p>
      </div>
      <el-button type="primary" @click="showCreateDialog = true" size="large">
        <el-icon><Plus /></el-icon>
        {{ $t("topics.createTopic") }}
      </el-button>
    </div>

    <!-- 左右分栏布局 -->
    <div v-if="topics.length === 0" class="empty-state">
      <el-empty :description="$t('topics.emptyTitle')">
        <el-button type="primary" @click="showCreateDialog = true">
          {{ $t("topics.createFirst") }}
        </el-button>
      </el-empty>
    </div>

    <div v-else class="split-layout">
      <!-- 左侧话题列表 -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">话题列表</span>
          <span class="topic-count">{{ topics.length }} 个话题</span>
        </div>
        <div class="topic-list">
          <div
            v-for="topic in topics"
            :key="topic.id"
            class="topic-item"
            :class="{ active: selectedTopic?.id === topic.id }"
            @click="selectTopic(topic)"
          >
            <div class="topic-main">
              <div class="topic-name">{{ topic.name }}</div>
              <div class="topic-meta">
                <span class="article-count">{{ topic.articleIds.length }} 篇文章</span>
                <el-tag v-if="topic.ipnsUrl" size="small" type="warning" effect="light"
                  >已发布</el-tag
                >
              </div>
            </div>
            <div class="topic-actions" @click.stop>
              <el-tooltip content="编辑">
                <el-button size="small" circle @click="editTopic(topic)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-popconfirm
                title="确定删除这个话题？"
                @confirm="handleDeleteTopic(topic.id)"
                width="200"
              >
                <template #reference>
                  <el-button size="small" circle type="danger">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧文章列表 -->
      <div class="right-panel">
        <template v-if="selectedTopic">
          <!-- 话题信息头部 -->
          <div class="panel-header">
            <div class="topic-info-header">
              <h3>{{ selectedTopic.name }}</h3>
              <p v-if="selectedTopic.description" class="topic-desc">
                {{ selectedTopic.description }}
              </p>
              <p v-if="selectedTopic.author" class="topic-author">
                作者：{{ selectedTopic.author }}
              </p>
            </div>
            <div class="header-actions">
              <el-button v-if="!isManaging" type="primary" @click="enterManageMode">
                <el-icon><Setting /></el-icon>
                管理文章
              </el-button>
              <template v-else>
                <el-button @click="cancelManage">取消</el-button>
                <el-button type="primary" @click="saveManage">完成</el-button>
              </template>
            </div>
          </div>

          <!-- IPNS 发布状态（管理模式下隐藏） -->
          <div v-if="selectedTopic.ipnsUrl && !isManaging" class="ipns-status-bar">
            <el-tag size="small" type="warning" effect="light">永久链接</el-tag>
            <a :href="selectedTopic.ipnsUrl" target="_blank" class="ipns-link">
              {{ selectedTopic.ipnsUrl }}
            </a>
          
            <el-button
              type="warning"
              size="small"
              @click="publishTopic(selectedTopic)"
              :loading="publishingTopic === selectedTopic.id"
            >
              更新发布
            </el-button>
          </div>
          <div v-else-if="!isManaging" class="publish-bar">
            <span class="publish-hint">该话题尚未发布到 IPNS</span>
            <el-button
              type="warning"
              size="small"
              @click="publishTopic(selectedTopic)"
              :loading="publishingTopic === selectedTopic.id"
              :disabled="getTopicArticles(selectedTopic).length === 0"
            >
              <el-icon><Upload /></el-icon>
              发布到 IPNS
            </el-button>
          </div>

          <!-- 文章列表区域 -->
          <div class="articles-section">
            <div class="section-header">
              <span>{{ isManaging ? "选择要添加的文章" : "已添加的文章" }}</span>
              <span class="count-badge">{{
                isManaging
                  ? `已选 ${tempSelectedIds.length} 篇`
                  : `${getTopicArticles(selectedTopic).length} 篇`
              }}</span>
            </div>

            <!-- 非管理模式：显示已添加的文章 -->
            <div v-if="!isManaging" class="article-list">
              <div
                v-if="getTopicArticles(selectedTopic).length === 0"
                class="empty-articles"
              >
                <el-empty
                  description="暂无文章，点击右上角「管理文章」添加"
                  :image-size="80"
                />
              </div>
              <div
                v-for="article in getTopicArticles(selectedTopic)"
                :key="article.id"
                class="article-item readonly"
              >
                <div class="article-info">
                  <span class="article-title">{{ article.title }}</span>
                  <span class="article-meta">
                    {{ article.status === "published" ? "已发布" : "草稿" }} ·
                    {{ formatDate(article.createdAt) }}
                  </span>
                </div>
                <!-- 链接操作区 -->
                <div class="article-links" v-if="article.status === 'published'">
                  <!-- 永久链接 -->

                  <a
                    v-if="article.ipnsUrl"
                    :href="article.ipnsUrl"
                    target="_blank"
                    class="link-btn permanent"
                  >
                    <el-icon><Link /></el-icon>
                    <span>永久链接</span>
                  </a>
                  <a
                    v-if="article.cid"
                    :href="article.url"
                    target="_blank"
                    class="link-btn cid"
                  >
                    <span class="cid-text">CID:{{ truncateCid(article.cid) }}</span>
                  </a>
                </div>
                <span v-else class="draft-label">草稿</span>
              </div>
            </div>

            <!-- 管理模式：显示所有文章供选择 -->
            <div v-else class="article-list manage-mode">
              <div v-if="allArticles.length === 0" class="empty-articles">
                <el-empty
                  description="还没有发布过文章，请先去发布文章"
                  :image-size="80"
                />
              </div>
              <div
                v-for="article in allArticles"
                :key="article.id"
                class="article-item selectable"
                :class="{ selected: tempSelectedIds.includes(article.id) }"
                @click="toggleTempSelect(article.id)"
              >
                <el-checkbox
                  :model-value="tempSelectedIds.includes(article.id)"
                  @click.stop
                  @change="toggleTempSelect(article.id)"
                />
                <div class="article-info">
                  <span class="article-title">{{ article.title }}</span>
                  <span class="article-meta">
                    {{ article.status === "published" ? "已发布" : "草稿" }} ·
                    {{ formatDate(article.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 未选择话题时的提示 -->
        <div v-else class="no-selection">
          <el-empty description="请在左侧选择一个话题" :image-size="120" />
        </div>
      </div>
    </div>

    <!-- 创建/编辑话题对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTopic ? '编辑话题' : '创建话题'"
      width="500px"
    >
      <el-form :model="topicForm" label-position="top">
        <el-form-item label="话题名称" required>
          <el-input v-model="topicForm.name" placeholder="例如：技术博客、旅行日记" />
        </el-form-item>
        <el-form-item label="话题描述">
          <el-input
            v-model="topicForm.description"
            type="textarea"
            :rows="3"
            placeholder="简单介绍这个话题的内容"
          />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="topicForm.author" placeholder="作者名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeCreateDialog">取消</el-button>
        <el-button type="primary" @click="handleSaveTopic" :loading="saving">
          {{ editingTopic ? "保存" : "创建" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  Plus,
  Edit,
  Delete,
  Upload,
  Setting,
  Link,
  DocumentCopy,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import type { TopicList } from "../../../utils/storage";
import type { PublishRecord } from "../../../utils/storage";

const { t } = useI18n();

const topics = ref<TopicList[]>([]);
const allArticles = ref<PublishRecord[]>([]);
const showCreateDialog = ref(false);
const editingTopic = ref<TopicList | null>(null);
const selectedTopic = ref<TopicList | null>(null);
const saving = ref(false);
const publishingTopic = ref<string | null>(null);

// 管理模式状态
const isManaging = ref(false);
const tempSelectedIds = ref<string[]>([]);

const topicForm = ref({
  name: "",
  description: "",
  author: "",
});

onMounted(async () => {
  await loadTopics();
  await loadArticles();
  // 默认选中第一个话题
  if (topics.value.length > 0) {
    selectedTopic.value = topics.value[0];
  }
});

async function loadTopics() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "getTopics" });
    if (response.success) {
      topics.value = response.data;
      // 更新选中的话题数据
      if (selectedTopic.value) {
        const updated = topics.value.find((t) => t.id === selectedTopic.value!.id);
        if (updated) {
          selectedTopic.value = updated;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load topics:", e);
  }
}

async function loadArticles() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "getRecords" });
    if (response.success) {
      allArticles.value = response.data;
    }
  } catch (e) {
    console.error("Failed to load articles:", e);
  }
}

function selectTopic(topic: TopicList) {
  // 如果正在管理模式，先退出
  if (isManaging.value) {
    isManaging.value = false;
  }
  selectedTopic.value = topic;
}

function getTopicArticles(topic: TopicList): PublishRecord[] {
  return allArticles.value.filter((a) => topic.articleIds.includes(a.id));
}

function editTopic(topic: TopicList) {
  editingTopic.value = topic;
  topicForm.value = {
    name: topic.name,
    description: topic.description || "",
    author: topic.author || "",
  };
  showCreateDialog.value = true;
}

function closeCreateDialog() {
  showCreateDialog.value = false;
  editingTopic.value = null;
  topicForm.value = { name: "", description: "", author: "" };
}

async function handleSaveTopic() {
  if (!topicForm.value.name.trim()) {
    ElMessage.warning("请输入话题名称");
    return;
  }

  saving.value = true;
  try {
    if (editingTopic.value) {
      const response = await chrome.runtime.sendMessage({
        action: "updateTopic",
        id: editingTopic.value.id,
        data: topicForm.value,
      });
      if (response.success) {
        ElMessage.success("话题已更新");
      } else {
        throw new Error(response.error);
      }
    } else {
      const response = await chrome.runtime.sendMessage({
        action: "createTopic",
        data: topicForm.value,
      });
      if (response.success) {
        ElMessage.success("话题已创建");
        // 选中新创建的话题
        await loadTopics();
        const newTopic = topics.value.find((t) => t.name === topicForm.value.name);
        if (newTopic) {
          selectedTopic.value = newTopic;
        }
      } else {
        throw new Error(response.error);
      }
    }
    await loadTopics();
    closeCreateDialog();
  } catch (error: any) {
    ElMessage.error("操作失败: " + error.message);
  } finally {
    saving.value = false;
  }
}

async function handleDeleteTopic(id: string) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "deleteTopic",
      id,
    });
    if (response.success) {
      ElMessage.success("话题已删除");
      // 如果删除的是当前选中的话题，清空选择
      if (selectedTopic.value?.id === id) {
        selectedTopic.value = null;
      }
      await loadTopics();
      // 选中第一个话题
      if (topics.value.length > 0 && !selectedTopic.value) {
        selectedTopic.value = topics.value[0];
      }
    }
  } catch (error: any) {
    ElMessage.error("删除失败: " + error.message);
  }
}

// 管理模式相关
function enterManageMode() {
  if (!selectedTopic.value) return;
  isManaging.value = true;
  // 复制当前已选的文章 ID
  tempSelectedIds.value = [...selectedTopic.value.articleIds];
}

function cancelManage() {
  isManaging.value = false;
  tempSelectedIds.value = [];
}

async function saveManage() {
  if (!selectedTopic.value) return;

  try {
    // 计算需要添加和移除的文章
    const currentIds = selectedTopic.value.articleIds;
    const toAdd = tempSelectedIds.value.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !tempSelectedIds.value.includes(id));

    // 执行添加操作
    for (const articleId of toAdd) {
      await chrome.runtime.sendMessage({
        action: "addArticleToTopic",
        topicId: selectedTopic.value.id,
        articleId,
      });
    }

    // 执行移除操作
    for (const articleId of toRemove) {
      await chrome.runtime.sendMessage({
        action: "removeArticleFromTopic",
        topicId: selectedTopic.value.id,
        articleId,
      });
    }

    await loadTopics();
    isManaging.value = false;
    tempSelectedIds.value = [];
    ElMessage.success("文章列表已更新");
  } catch (error: any) {
    ElMessage.error("保存失败: " + error.message);
  }
}

function toggleTempSelect(articleId: string) {
  const index = tempSelectedIds.value.indexOf(articleId);
  if (index > -1) {
    tempSelectedIds.value.splice(index, 1);
  } else {
    tempSelectedIds.value.push(articleId);
  }
}

async function publishTopic(topic: TopicList) {
  if (topic.articleIds.length === 0) {
    ElMessage.warning("请先添加文章到话题中");
    return;
  }

  const publishedCount = allArticles.value.filter(
    (a) => topic.articleIds.includes(a.id) && a.status === "published"
  ).length;

  if (publishedCount === 0) {
    ElMessage.warning("话题中没有已发布的文章，请先发布文章");
    return;
  }

  const isRepublish = !!topic.ipnsUrl;
  publishingTopic.value = topic.id;

  try {
    const response = await chrome.runtime.sendMessage({
      action: "publishTopicToIpns",
      topicId: topic.id,
    });

    if (response.success) {
      await loadTopics();
      if (isRepublish) {
        ElMessage({
          type: "success",
          message: "话题已更新发布！永久链接内容将在约 5 分钟后更新",
          duration: 5000,
        });
      } else {
        ElMessage.success("话题发布成功，已生成永久链接！");
      }
    } else {
      throw new Error(response.error);
    }
  } catch (error: any) {
    ElMessage.error("发布失败: " + error.message);
  } finally {
    publishingTopic.value = null;
  }
}

async function copyLink(url: string) {
  await navigator.clipboard.writeText(url);
  ElMessage.success("链接已复制");
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateCid(cid: string): string {
  if (cid.length <= 16) return cid;
  return cid.substring(0, 8) + "..." + cid.substring(cid.length - 6);
}
</script>

<style scoped lang="less">
@primary: #f5d104;
@primary-dark: #d4b503;
@border-color: #e5e7eb;
@bg-light: #f9fafb;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    margin: 0 0 4px 0;
    font-size: 24px;
    color: #1a1a2e;
    font-weight: 600;
  }

  .subtitle {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
  }
}

.empty-state {
  background: #fff;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
}

// 左右分栏布局
.split-layout {
  display: flex;
  gap: 24px;
  height: calc(100vh - 180px);
  min-height: 500px;
}

// 左侧面板
.left-panel {
  width: 320px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 14px;
  border: 1px solid @border-color;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid @border-color;
    background: @bg-light;

    .panel-title {
      font-size: 15px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .topic-count {
      font-size: 12px;
      color: #9ca3af;
    }
  }

  .topic-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .topic-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 8px;
    border: 1px solid transparent;

    &:hover {
      background: @bg-light;
    }

    &.active {
      background: #fefce8;
      border-color: @primary;
    }

    .topic-main {
      flex: 1;
      min-width: 0;

      .topic-name {
        font-size: 14px;
        font-weight: 500;
        color: #1a1a2e;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .topic-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .article-count {
          font-size: 12px;
          color: #9ca3af;
        }
      }
    }

    .topic-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.15s;
    }

    &:hover .topic-actions {
      opacity: 1;
    }
  }
}

// 右侧面板
.right-panel {
  flex: 1;
  background: #fff;
  border-radius: 14px;
  border: 1px solid @border-color;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    border-bottom: 1px solid @border-color;
    background: @bg-light;

    .topic-info-header {
      h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #1a1a2e;
        font-weight: 600;
      }

      .topic-desc {
        margin: 0 0 4px 0;
        font-size: 13px;
        color: #6b7280;
      }

      .topic-author {
        margin: 0;
        font-size: 12px;
        color: #9ca3af;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .ipns-status-bar,
  .publish-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    background: #fffbeb;
    border-bottom: 1px solid #fde68a;

    .ipns-link {
      flex: 1;
      font-size: 12px;
      color: @primary-dark;
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:hover {
        text-decoration: underline;
      }
    }

    .publish-hint {
      flex: 1;
      font-size: 13px;
      color: #9ca3af;
    }
  }

  .articles-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 24px;
      border-bottom: 1px solid @border-color;
      font-size: 14px;
      color: #6b7280;

      .count-badge {
        font-size: 12px;
        color: @primary-dark;
        background: #fefce8;
        padding: 4px 10px;
        border-radius: 12px;
      }
    }

    .article-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;

      &.manage-mode {
        background: @bg-light;
      }
    }

    .empty-articles {
      padding: 40px 0;
      text-align: center;
    }

    .article-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      margin-bottom: 8px;
      background: #fff;
      border: 1px solid @border-color;
      transition: all 0.15s;

      &.readonly {
        cursor: default;
      }

      &.selectable {
        cursor: pointer;

        &:hover {
          border-color: #d1d5db;
        }

        &.selected {
          background: #fefce8;
          border-color: @primary;
        }
      }

      .article-info {
        flex: 1;
        min-width: 0;

        .article-title {
          display: block;
          font-size: 14px;
          color: #1a1a2e;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .article-meta {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }
      }

      .view-link {
        color: #9ca3af;
        padding: 6px;
        border-radius: 6px;
        transition: all 0.15s;

        &:hover {
          color: @primary-dark;
          background: #fefce8;
        }
      }

      .article-links {
        display: flex;
        gap: 4px;
        flex-shrink: 0;

        .link-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          text-decoration: none;
          transition: all 0.15s;

          &.permanent {
            color: @primary-dark;
            background: #fefce8;
            border: 1px solid #fde68a;

            &:hover {
              background: #fef3c7;
            }
          }

          &.cid {
            color: #6b7280;
            background: @bg-light;
            border: 1px solid @border-color;

            &:hover {
              background: #f3f4f6;
            }

            .cid-text {
              font-family: "Monaco", "Menlo", monospace;
              font-size: 11px;
            }
          }
        }
      }

      .draft-label {
        font-size: 12px;
        color: #9ca3af;
        background: @bg-light;
        padding: 4px 10px;
        border-radius: 6px;
      }
    }
  }

  .no-selection {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// 响应式
@media (max-width: 1024px) {
  .split-layout {
    flex-direction: column;
    height: auto;
  }

  .left-panel {
    width: 100%;
    max-height: 300px;
  }

  .right-panel {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .el-button {
      width: 100%;
    }
  }
}
</style>
