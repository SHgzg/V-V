<template>
  <div class="blog-app">
    <!-- 头部 -->
    <header class="blog-header">
      <h1>📚 V-V Blog</h1>
      <p class="subtitle">个人知识管理博客</p>
    </header>

    <!-- 主内容区 -->
    <main class="blog-main">
      <!-- 文章列表视图 -->
      <div v-if="!currentPost" class="post-list">
        <div class="post-list-header">
          <h2>文章列表</h2>
          <button class="btn-primary" @click="createNewPost">
            ✏️ 新建文章
          </button>
        </div>

        <div class="posts">
          <article
            v-for="post in posts"
            :key="post.id"
            class="post-card"
            @click="viewPost(post)"
          >
            <div class="post-meta">
              <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              <span class="post-tags">
                <span
                  v-for="tag in post.tags"
                  :key="tag"
                  class="tag"
                >{{ tag }}</span>
              </span>
            </div>
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-excerpt">{{ getExcerpt(post.content) }}</p>
            <div class="post-actions">
              <button class="btn-edit" @click.stop="editPost(post)">编辑</button>
              <button class="btn-delete" @click.stop="deletePost(post.id)">删除</button>
            </div>
          </article>
        </div>

        <!-- 空状态 -->
        <div v-if="posts.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">还没有文章</div>
          <button class="btn-primary" @click="createNewPost">创建第一篇文章</button>
        </div>
      </div>

      <!-- 文章详情/编辑视图 -->
      <div v-else class="post-detail">
        <div class="post-detail-header">
          <button class="btn-back" @click="backToList">← 返回列表</button>
          <div class="post-detail-actions">
            <button v-if="!isEditing" class="btn-edit" @click="startEditing">编辑文章</button>
            <button v-if="!isEditing" class="btn-delete" @click="deletePost(currentPost.id)">删除</button>
            <button v-if="isEditing" class="btn-cancel" @click="cancelEdit">取消</button>
            <button v-if="isEditing" class="btn-save" @click="savePost">💾 保存</button>
          </div>
        </div>

        <!-- 查看模式 -->
        <div v-if="!isEditing" class="post-view">
          <h1 class="post-view-title">{{ currentPost.title }}</h1>
          <div class="post-view-meta">
            <span class="post-view-date">{{ formatDate(currentPost.createdAt) }}</span>
            <span class="post-view-tags">
              <span v-for="tag in currentPost.tags" :key="tag" class="tag">{{ tag }}</span>
            </span>
          </div>
          <div class="post-view-content" v-html="renderMarkdown(currentPost.content)"></div>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="post-edit">
          <input
            v-model="editForm.title"
            class="edit-title"
            placeholder="文章标题"
          >
          <input
            v-model="editForm.tags"
            class="edit-tags"
            placeholder="标签，用逗号分隔 (如: 技术, Vue, Electron)"
          >
          <textarea
            v-model="editForm.content"
            class="edit-content"
            placeholder="支持 Markdown 语法..."
            rows="15"
          ></textarea>

          <div class="edit-preview">
            <h4>预览:</h4>
            <div class="preview-content" v-html="renderMarkdown(editForm.content)"></div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      posts: [],
      currentPost: null,
      isEditing: false,
      editForm: {
        title: '',
        content: '',
        tags: ''
      }
    }
  },
  mounted() {
    this.loadPosts()
    console.log('[Blog] Loaded')
  },
  methods: {
    // 加载文章列表
    loadPosts() {
      try {
        const stored = localStorage.getItem('vv-blog-posts')
        this.posts = stored ? JSON.parse(stored) : this.getSamplePosts()
      } catch (error) {
        console.error('[Blog] Failed to load posts:', error)
        this.posts = this.getSamplePosts()
      }
    },

    // 保存文章列表
    savePosts() {
      try {
        localStorage.setItem('vv-blog-posts', JSON.stringify(this.posts))
      } catch (error) {
        console.error('[Blog] Failed to save posts:', error)
      }
    },

    // 获取示例文章
    getSamplePosts() {
      return [
        {
          id: '1',
          title: '欢迎使用 V-V Blog',
          content: `# 欢迎使用 V-V Blog

这是一个基于 Vue 3 的轻量级博客系统。

## 主要特点

- 📝 简洁的 Markdown 编辑
- 🏷️ 标签分类
- 💾 本地存储
- 🎨 现代化设计

## 使用说明

1. 点击"新建文章"创建新文章
2. 使用 Markdown 语法编写内容
3. 支持代码高亮和引用

\`\`\`javascript
console.log("Hello, V-V!")
\`\`\`

> 这是一个引用块示例

开始你的写作之旅吧！`,
          tags: ['欢迎', '指南'],
          createdAt: Date.now()
        },
        {
          id: '2',
          title: 'Electron 开发实践',
          content: `# Electron 开发实践

Electron 是一个使用 JavaScript、HTML 和 CSS 构建跨平台桌面应用的开源框架。

## 为什么选择 Electron？

- **跨平台**: 一套代码，Windows、macOS、Linux 全覆盖
- **Web 技术**: 使用熟悉的前端技术栈
- **生态丰富**: npm 生态的强大支持

## 开发技巧

### 1. 主进程与渲染进程通信

\`\`\`javascript
// 主进程
ipcMain.handle('get-data', async (event, arg) => {
  return result
})

// 渲染进程
electronAPI.getData().then(data => {
  console.log(data)
})
\`\`\`

### 2. BrowserView 的使用

BrowserView 可以在主窗口中嵌入多个 web 内容，非常适合多面板应用。

## 总结

Electron 为桌面应用开发提供了无限可能！`,
          tags: ['Electron', '开发', '桌面应用'],
          createdAt: Date.now() - 86400000
        },
        {
          id: '3',
          title: 'Vue 3 Composition API 优势',
          content: `# Vue 3 Composition API 优势

Vue 3 的 Composition API 提供了更好的代码组织和复用能力。

## 核心优势

### 1. 逻辑复用

\`\`\`javascript
// composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event) {
    x.value = event.clientX
    y.value = event.clientY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
\`\`\`

### 2. 更好的类型推断

Composition API 与 TypeScript 的配合更加自然。

## 总结

Composition API 让 Vue 3 更加强大和灵活！`,
          tags: ['Vue', 'JavaScript', '前端'],
          createdAt: Date.now() - 172800000
        }
      ]
    },

    // 查看文章
    viewPost(post) {
      this.currentPost = post
      this.isEditing = false
    },

    // 新建文章
    createNewPost() {
      const newPost = {
        id: Date.now().toString(),
        title: '新文章',
        content: '# 新文章\n\n开始编写...',
        tags: ['未分类'],
        createdAt: Date.now()
      }
      this.posts.unshift(newPost)
      this.savePosts()
      this.currentPost = newPost
      this.startEditing()
    },

    // 编辑文章
    editPost(post) {
      this.currentPost = post
      this.startEditing()
    },

    // 开始编辑
    startEditing() {
      this.isEditing = true
      this.editForm = {
        title: this.currentPost.title,
        content: this.currentPost.content,
        tags: this.currentPost.tags.join(', ')
      }
    },

    // 取消编辑
    cancelEdit() {
      if (!this.currentPost.id.startsWith('new') && this.currentPost.id === this.editForm.id) {
        // 如果是已保存的文章，恢复原内容
        this.isEditing = false
      } else {
        // 如果是新文章且取消，删除它
        this.backToList()
      }
    },

    // 保存文章
    savePost() {
      if (!this.editForm.title.trim()) {
        alert('请输入文章标题')
        return
      }

      const updatedPost = {
        ...this.currentPost,
        title: this.editForm.title.trim(),
        content: this.editForm.content,
        tags: this.editForm.tags.split(',').map(t => t.trim()).filter(t => t),
        updatedAt: Date.now()
      }

      const index = this.posts.findIndex(p => p.id === this.currentPost.id)
      if (index >= 0) {
        this.posts[index] = updatedPost
      }

      this.savePosts()
      this.currentPost = updatedPost
      this.isEditing = false

      console.log('[Blog] Post saved:', updatedPost.id)
    },

    // 删除文章
    deletePost(postId) {
      if (!confirm('确定要删除这篇文章吗？')) {
        return
      }

      this.posts = this.posts.filter(p => p.id !== postId)
      this.savePosts()
      this.backToList()

      console.log('[Blog] Post deleted:', postId)
    },

    // 返回列表
    backToList() {
      this.currentPost = null
      this.isEditing = false
    },

    // 获取摘要
    getExcerpt(content, maxLength = 100) {
      const text = content.replace(/[#*`>\-]/g, '').trim()
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    },

    // 格式化日期
    formatDate(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    // 简单的 Markdown 渲染
    renderMarkdown(content) {
      if (!content) return ''

      let html = content
        // 转义 HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

        // 标题
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')

        // 粗体和斜体
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')

        // 代码块
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')

        // 引用
        .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

        // 链接
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

        // 列表
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

        // 段落
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')

      return html
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.blog-app {
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
  background: white;
}

/* 头部 */
.blog-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 30px 20px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

.blog-header h1 {
  font-size: 2em;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  font-size: 0.9em;
}

/* 主内容 */
.blog-main {
  padding: 30px 20px;
}

/* 文章列表 */
.post-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.post-list-header h2 {
  font-size: 1.5em;
  color: #333;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 文章卡片 */
.post-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.85em;
}

.post-date {
  color: #999;
}

.post-tags {
  display: flex;
  gap: 6px;
}

.tag {
  background: #f0f5ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.post-title {
  font-size: 1.3em;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.post-excerpt {
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #d0d0d0;
  background: white;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.btn-delete:hover {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  color: #999;
  margin-bottom: 20px;
}

/* 文章详情 */
.post-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.btn-back {
  background: #f5f5f5;
  border: 1px solid #d0d0d0;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e0e0e0;
}

.post-detail-actions {
  display: flex;
  gap: 8px;
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-cancel:hover {
  background: #f0f0f0;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 查看模式 */
.post-view-title {
  font-size: 2em;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.post-view-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 0.9em;
}

.post-view-date {
  color: #999;
}

.post-view-content {
  line-height: 1.8;
  color: #444;
}

.post-view-content h1 {
  font-size: 1.8em;
  margin: 28px 0 16px;
  color: #333;
}

.post-view-content h2 {
  font-size: 1.5em;
  margin: 24px 0 12px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.post-view-content h3 {
  font-size: 1.2em;
  margin: 20px 0 10px;
  color: #333;
}

.post-view-content p {
  margin-bottom: 14px;
}

.post-view-content pre {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
}

.post-view-content code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.post-view-content blockquote {
  border-left: 4px solid #1890ff;
  padding: 12px 16px;
  margin: 16px 0;
  background: #f0f5ff;
  border-radius: 0 4px 4px 0;
  color: #555;
}

.post-view-content ul {
  margin: 14px 0;
  padding-left: 24px;
}

.post-view-content li {
  margin-bottom: 6px;
}

.post-view-content a {
  color: #1890ff;
  text-decoration: none;
  border-bottom: 1px dotted;
}

.post-view-content a:hover {
  border-bottom-style: solid;
}

/* 编辑模式 */
.edit-title, .edit-tags, .edit-content {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  font-family: inherit;
}

.edit-title {
  font-size: 18px;
  font-weight: 600;
}

.edit-content {
  font-family: 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
  min-height: 200px;
  resize: vertical;
}

.edit-preview {
  margin-top: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.edit-preview h4 {
  margin-bottom: 12px;
  color: #333;
}

.preview-content {
  line-height: 1.6;
  color: #444;
}
</style>
