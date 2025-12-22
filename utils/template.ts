/**
 * HTML 模板生成器
 * 将 Markdown 内容转换为带样式的完整 HTML 页面
 */

import { marked } from 'marked';

// 配置 marked 为同步模式
marked.setOptions({
  async: false,
  gfm: true,
  breaks: true
});

// 文章页面的 CSS 样式
const articleStyles = `
:root {
  --primary: #F5D104;
  --primary-dark: #D4B503;
  --bg-dark: #1a1a2e;
  --text-color: #374151;
  --text-muted: #6b7280;
  --border-color: #e5e7eb;
  --bg-light: #f9fafb;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  color: var(--text-color);
  line-height: 1.8;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.article {
  background: #fff;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.article-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--bg-dark);
  line-height: 1.4;
  margin-bottom: 16px;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.article-content {
  font-size: 16px;
}

/* Markdown 样式 */
.article-content h1,
.article-content h2,
.article-content h3,
.article-content h4,
.article-content h5,
.article-content h6 {
  margin-top: 28px;
  margin-bottom: 16px;
  font-weight: 600;
  color: var(--bg-dark);
  line-height: 1.4;
}

.article-content h1 { font-size: 2em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
.article-content h2 { font-size: 1.5em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
.article-content h3 { font-size: 1.25em; }
.article-content h4 { font-size: 1em; }

.article-content p {
  margin: 0 0 16px 0;
}

.article-content a {
  color: var(--primary-dark);
  text-decoration: none;
}

.article-content a:hover {
  color: var(--primary);
  text-decoration: underline;
}

.article-content code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  color: #ef4444;
}

.article-content pre {
  background: #1f2937;
  color: #e5e7eb;
  padding: 20px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 20px 0;
}

.article-content pre code {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 14px;
}

.article-content blockquote {
  margin: 20px 0;
  padding: 16px 24px;
  border-left: 4px solid var(--primary);
  background: #fefce8;
  color: var(--text-muted);
  border-radius: 0 8px 8px 0;
}

.article-content blockquote p:last-child {
  margin-bottom: 0;
}

.article-content ul,
.article-content ol {
  margin: 16px 0;
  padding-left: 2em;
}

.article-content li {
  margin: 8px 0;
}

.article-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.article-content th,
.article-content td {
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  text-align: left;
}

.article-content th {
  background: var(--bg-light);
  font-weight: 600;
}

.article-content tr:nth-child(even) {
  background: var(--bg-light);
}

.article-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 20px 0;
}

.article-content hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 32px 0;
}

.footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

.footer a {
  color: var(--primary-dark);
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .container {
    padding: 20px 16px;
  }
  
  .article {
    padding: 28px 20px;
    border-radius: 12px;
  }
  
  .article-title {
    font-size: 24px;
  }
  
  .article-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .article-content {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .article {
    padding: 20px 16px;
  }
  
  .article-title {
    font-size: 20px;
  }
  
  .article-content pre {
    padding: 14px;
    font-size: 13px;
  }
}
`;

/**
 * 生成完整的 HTML 页面
 * @param title 文章标题
 * @param content Markdown 内容
 * @param createdAt 创建时间戳
 */
export function generateHtmlPage(title: string, content: string, createdAt?: number): string {
  const htmlContent = marked.parse(content) as string;
  const dateStr = createdAt 
    ? new Date(createdAt).toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${articleStyles}</style>
</head>
<body>
  <div class="container">
    <article class="article">
      <header class="article-header">
        <h1 class="article-title">${escapeHtml(title)}</h1>
        <div class="article-meta">
          <span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${dateStr}
          </span>
        </div>
      </header>
      <div class="article-content">
        ${htmlContent}
      </div>
      <footer class="footer">
        <p>Powered by <a href="https://ipfs.io" target="_blank">IPFS</a> · Published via IPFS Publisher</p>
      </footer>
    </article>
  </div>
</body>
</html>`;
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
