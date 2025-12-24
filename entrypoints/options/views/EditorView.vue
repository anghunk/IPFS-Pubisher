<template>
  <div class="editor-view">
    <div class="page-header">
      <h2>{{ isEditing ? $t("editor.editTitle") : $t("editor.title") }}</h2>
      <p class="subtitle">{{ $t("editor.subtitle") }}</p>
    </div>

    <div class="editor-card">
      <el-form :model="form" label-position="top">
        <el-form-item :label="$t('editor.articleTitle')">
          <el-input
            v-model="form.title"
            :placeholder="$t('editor.titlePlaceholder')"
            :disabled="saving"
            size="large"
          />
        </el-form-item>

        <el-form-item :label="$t('editor.articleContent')">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="16"
            :placeholder="$t('editor.contentPlaceholder')"
            :disabled="saving"
          />
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button @click="cancelEdit" size="large">
          {{ $t("common.cancel") }}
        </el-button>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!canSave"
          @click="handleSave"
          size="large"
          class="save-btn"
        >
          {{ saving ? "保存中..." : "保存文章" }}
        </el-button>
      </div>
    </div>

    <!-- 保存成功提示 -->
    <div v-if="saveSuccess" class="save-result">
      <el-alert type="success" :closable="false" show-icon>
        <template #title>文章已保存</template>
        <template #default>
          <div class="result-content">
            <p>文章已保存到本地，您可以在文章列表中查看并发布到 IPFS。</p>
            <el-button type="primary" size="small" @click="goToList">
              查看文章列表
            </el-button>
          </div>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import type { PublishRecord } from "../../../utils/storage";

const { t } = useI18n();

const emit = defineEmits(["update-count"]);

const route = useRoute();
const router = useRouter();

const editingRecord = ref<PublishRecord | null>(null);
const saving = ref(false);
const saveSuccess = ref(false);

const form = ref({
  title: "",
  content: "",
});

const isEditing = computed(() => !!editingRecord.value);

const canSave = computed(() => {
  return form.value.title.trim() && form.value.content.trim() && !saving.value;
});

onMounted(async () => {
  if (route.params.id) {
    await loadRecord(route.params.id as string);
  }
});

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      await loadRecord(newId as string);
    } else {
      cancelEdit();
    }
  }
);

async function loadRecord(id: string) {
  try {
    const response = await chrome.runtime.sendMessage({ action: "getRecords" });
    if (response.success) {
      const record = response.data.find((r: PublishRecord) => r.id === id);
      if (record) {
        editingRecord.value = record;
        form.value.title = record.title;
        form.value.content = record.content;
      }
    }
  } catch (e) {
    console.error("Failed to load record:", e);
  }
}

function cancelEdit() {
  editingRecord.value = null;
  form.value.title = "";
  form.value.content = "";
  saveSuccess.value = false;
  router.push("/list");
}

function goToList() {
  router.push("/list");
}

async function handleSave() {
  if (!canSave.value) return;

  saving.value = true;
  saveSuccess.value = false;

  try {
    const payload: any = {
      action: "save",
      title: form.value.title.trim(),
      content: form.value.content.trim(),
    };

    if (editingRecord.value) {
      payload.id = editingRecord.value.id;
    }

    const response = await chrome.runtime.sendMessage(payload);

    if (response.success) {
      saveSuccess.value = true;
      
      // 如果是新建，清空表单
      if (!editingRecord.value) {
        form.value.title = "";
        form.value.content = "";
      }
      
      editingRecord.value = response.data;

      // 更新记录数量
      const recordsResponse = await chrome.runtime.sendMessage({ action: "getRecords" });
      if (recordsResponse.success) {
        emit("update-count", recordsResponse.data.length);
      }

      ElMessage.success("文章已保存");
    } else {
      throw new Error(response.error);
    }
  } catch (error: any) {
    ElMessage.error("保存失败: " + error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="less">
@primary: #f5d104;
@primary-dark: #d4b503;
@bg-dark: #1a1a2e;

.editor-view {
  max-width: 800px;
}

.page-header {
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

.editor-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;

  .save-btn {
    min-width: 140px;
    background: @primary;
    border-color: @primary;
    color: @bg-dark;
    font-weight: 600;

    &:hover {
      background: @primary-dark;
      border-color: @primary-dark;
    }
  }
}

.save-result {
  margin-top: 20px;

  .result-content {
    margin-top: 8px;

    p {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #374151;
    }
  }
}

// 媒体查询适配
@media (max-width: 1024px) {
  .page-header {
    h2 {
      font-size: 22px;
    }
  }

  .editor-card {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .page-header {
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
    }
  }

  .editor-card {
    padding: 20px;
    border-radius: 12px;
  }

  .form-actions {
    flex-direction: column-reverse;

    .el-button {
      width: 100%;
    }

    .save-btn {
      min-width: auto;
    }
  }
}

@media (max-width: 480px) {
  .page-header {
    margin-bottom: 16px;

    h2 {
      font-size: 18px;
    }

    .subtitle {
      font-size: 12px;
    }
  }

  .editor-card {
    padding: 16px;
    border-radius: 10px;
  }

  .form-actions {
    margin-top: 16px;
    padding-top: 16px;
    gap: 10px;
  }
}
</style>
