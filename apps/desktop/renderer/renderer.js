/**
 * V-V PKM Desktop - Renderer Host
 *
 * 轻量宿主，负责管理子前端窗口
 */

console.log('[Renderer Host] Loaded')
console.log('[Renderer Host] electronAPI:', window.electronAPI)

// 全局状态
let windowCount = 0
let windowRefreshInterval = null

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Renderer Host] DOM ready')

  // 检查 API 是否可用
  if (!window.electronAPI) {
    console.error('[Renderer Host] electronAPI not found')
    document.getElementById('app').innerHTML = '<h1>Error</h1><p>electronAPI not available. Please check preload script.</p>'
    return
  }

  console.log('[Renderer Host] electronAPI available:', {
    subFrontend: !!window.electronAPI.subFrontend,
    git: !!window.electronAPI.git,
    window: !!window.electronAPI.window,
    updater: !!window.electronAPI.updater
  })

  // 暴露函数到全局（供 HTML onclick 调用）
  window.showSection = showSection
  window.openExampleWindow = openExampleWindow
  window.openMultipleWindows = openMultipleWindows
  window.openBlogWindow = openBlogWindow
  window.closeAllWindows = closeAllWindows
  window.refreshWindowList = refreshWindowList
  window.focusWindow = focusWindow
  window.closeWindow = closeWindow

  // 面板系统函数
  window.createHorizontalSplit = createHorizontalSplit
  window.createVerticalSplit = createVerticalSplit
  window.createGridLayout = createGridLayout
  window.resetPanels = resetPanels
  window.saveCurrentLayout = saveCurrentLayout
  window.loadLayout = loadLayout
  window.listLayouts = listLayouts

  // 刷新窗口计数
  await refreshWindowCount()

  // 定时刷新窗口列表
  windowRefreshInterval = setInterval(refreshWindowCount, 2000)

  console.log('[Renderer Host] Initialized')
})

/**
 * 显示指定内容区域
 */
function showSection(sectionId) {
  // 隐藏所有区域
  document.getElementById('section-welcome').style.display = 'none'
  document.getElementById('section-windows').style.display = 'none'
  document.getElementById('section-panels').style.display = 'none'

  // 移除所有活跃状态
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active')
  })

  // 显示目标区域
  document.getElementById(`section-${sectionId}`).style.display = 'block'

  // 如果是窗口管理页面，刷新列表
  if (sectionId === 'windows') {
    refreshWindowList()
  }

  // 如果是面板页面，刷新面板列表
  if (sectionId === 'panels') {
    updatePanelList()
  }
}

/**
 * 打开示例子前端窗口
 */
async function openExampleWindow() {
  const config = {
    id: `example-${Date.now()}`,
    name: '示例子前端',
    path: 'D:\\\\project\\\\V-V\\\\apps\\\\desktop\\\\sub-frontends\\\\example\\\\index.html',
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 300
  }

  console.log('[Renderer Host] Opening sub-frontend:', config)

  try {
    const windowId = await window.electronAPI.subFrontend.open(config)
    console.log('[Renderer Host] Sub-frontend opened:', windowId)

    // 刷新窗口计数
    await refreshWindowCount()
  } catch (error) {
    console.error('[Renderer Host] Failed to open sub-frontend:', error)
    alert(`打开子前端失败: ${error.message}`)
  }
}

/**
 * 打开多个示例子前端窗口
 */
async function openMultipleWindows() {
  const configs = [
    { id: `example-${Date.now()}-1`, name: '示例子前端 1', path: 'D:\\\\project\\\\V-V\\\\apps\\\\desktop\\\\sub-frontends\\\\example\\\\index.html', width: 600, height: 400 },
    { id: `example-${Date.now()}-2`, name: '示例子前端 2', path: 'D:\\\\project\\\\V-V\\\\apps\\\\desktop\\\\sub-frontends\\\\example\\\\index.html', width: 700, height: 500 },
    { id: `example-${Date.now()}-3`, name: '示例子前端 3', path: 'D:\\\\project\\\\V-V\\\\apps\\\\desktop\\\\sub-frontends\\\\example\\\\index.html', width: 500, height: 600 }
  ]

  for (const config of configs) {
    await window.electronAPI.subFrontend.open(config)
  }

  await refreshWindowCount()
}

/**
 * 打开博客子前端窗口
 */
async function openBlogWindow() {
  const config = {
    id: `blog-${Date.now()}`,
    name: 'V-V Blog',
    path: 'D:\\\\project\\\\V-V\\\\apps\\\\desktop\\\\sub-frontends\\\\blog\\\\dist\\\\index.html',
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400
  }

  console.log('[Renderer Host] Opening blog sub-frontend:', config)

  try {
    const windowId = await window.electronAPI.subFrontend.open(config)
    console.log('[Renderer Host] Blog sub-frontend opened:', windowId)

    // 刷新窗口计数
    await refreshWindowCount()
  } catch (error) {
    console.error('[Renderer Host] Failed to open blog sub-frontend:', error)
    alert(`打开博客失败: ${error.message}`)
  }
}

/**
 * 关闭所有子前端窗口
 */
async function closeAllWindows() {
  try {
    const windows = await window.electronAPI.subFrontend.list()

    for (const win of windows) {
      await window.electronAPI.subFrontend.close(win.id)
    }

    await refreshWindowCount()

    if (document.getElementById('section-windows').style.display !== 'none') {
      refreshWindowList()
    }
  } catch (error) {
    console.error('[Renderer Host] Failed to close all windows:', error)
  }
}

/**
 * 刷新窗口计数
 */
async function refreshWindowCount() {
  try {
    if (!window.electronAPI?.subFrontend) {
      console.warn('[Renderer Host] electronAPI.subFrontend not available yet')
      return
    }

    const windows = await window.electronAPI.subFrontend.list()
    windowCount = windows.length
    const countEl = document.getElementById('window-count')
    if (countEl) {
      countEl.textContent = windowCount
    }
  } catch (error) {
    console.error('[Renderer Host] Failed to refresh window count:', error)
  }
}

/**
 * 刷新窗口列表
 */
async function refreshWindowList() {
  try {
    if (!window.electronAPI?.subFrontend) {
      console.error('[Renderer Host] electronAPI.subFrontend not available')
      const listEl = document.getElementById('window-list')
      listEl.innerHTML = '<li style="padding: 10px; color: #ff6b6b;">错误：子前端 API 不可用</li>'
      return
    }

    const windows = await window.electronAPI.subFrontend.list()
    const listEl = document.getElementById('window-list')

    if (windows.length === 0) {
      listEl.innerHTML = '<li style="padding: 10px; color: #999;">暂无打开的窗口</li>'
      return
    }

    listEl.innerHTML = windows.map(win => `
      <li class="window-item">
        <span class="window-item-name">${win.name} (${win.id})</span>
        <div class="window-item-actions">
          <button onclick="focusWindow('${win.id}')">聚焦</button>
          <button onclick="closeWindow('${win.id}')">关闭</button>
        </div>
      </li>
    `).join('')
  } catch (error) {
    console.error('[Renderer Host] Failed to refresh window list:', error)
    const listEl = document.getElementById('window-list')
    listEl.innerHTML = `<li style="padding: 10px; color: #ff6b6b;">错误: ${error.message}</li>`
  }
}

/**
 * 聚焦指定窗口
 */
async function focusWindow(id) {
  try {
    await window.electronAPI.subFrontend.focus(id)
  } catch (error) {
    console.error('[Renderer Host] Failed to focus window:', error)
  }
}

/**
 * 关闭指定窗口
 */
async function closeWindow(id) {
  try {
    await window.electronAPI.subFrontend.close(id)
    await refreshWindowList()
    await refreshWindowCount()
  } catch (error) {
    console.error('[Renderer Host] Failed to close window:', error)
  }
}

// 监听来自子前端的消息（可选）
if (window.electronAPI) {
  // 可以添加全局消息监听
}

/**
 * =====================================================
 * 面板系统演示函数
 * =====================================================
 */

// 获取面板 URL 基础路径
// 获取面板 URL 基础路径function getPanelUrl(name) {  // BrowserView 需要完整的 file:// 路径  // 在开发和生产环境中都使用绝对路径  return `file:///D:/project/V-V/apps/desktop/out/renderer/panels/${name}.html`}
/**
 * 创建水平分屏（左右布局）
 */
async function createHorizontalSplit() {
  try {
    console.log('[Panel Demo] Creating horizontal split')

    // 首先添加主视图
    await window.electronAPI.panel.addView({
      id: 'main-view',
      title: '文件浏览器',
      url: getPanelUrl('file-browser'),
      icon: '📁'
    })

    // 水平分割
    await window.electronAPI.panel.split({
      viewId: 'main-view',
      newView: {
        id: 'preview-view',
        title: '预览',
        url: getPanelUrl('preview'),
        icon: '👁️'
      },
      direction: 'horizontal',
      ratio: 0.4
    })

    updatePanelList()
    alert('✅ 已创建水平分屏布局')
  } catch (error) {
    console.error('[Panel Demo] Failed to create horizontal split:', error)
    alert(`❌ 创建失败: ${error.message}`)
  }
}

/**
 * 创建垂直分屏（上下布局）
 */
async function createVerticalSplit() {
  try {
    console.log('[Panel Demo] Creating vertical split')

    // 添加主视图
    await window.electronAPI.panel.addView({
      id: 'editor-view',
      title: '笔记编辑器',
      url: getPanelUrl('note-editor'),
      icon: '📝'
    })

    // 垂直分割
    await window.electronAPI.panel.split({
      viewId: 'editor-view',
      newView: {
        id: 'preview-view-2',
        title: '预览',
        url: getPanelUrl('preview'),
        icon: '👁️'
      },
      direction: 'vertical',
      ratio: 0.6
    })

    updatePanelList()
    alert('✅ 已创建垂直分屏布局')
  } catch (error) {
    console.error('[Panel Demo] Failed to create vertical split:', error)
    alert(`❌ 创建失败: ${error.message}`)
  }
}

/**
 * 创建四象限网格布局
 */
async function createGridLayout() {
  try {
    console.log('[Panel Demo] Creating grid layout')

    // 添加主视图
    await window.electronAPI.panel.addView({
      id: 'grid-main',
      title: '主面板',
      url: getPanelUrl('file-browser'),
      icon: '📁'
    })

    // 水平分割（左右）
    await window.electronAPI.panel.split({
      viewId: 'grid-main',
      newView: {
        id: 'grid-right',
        title: '编辑器',
        url: getPanelUrl('note-editor'),
        icon: '📝'
      },
      direction: 'horizontal',
      ratio: 0.5
    })

    // 左侧垂直分割（左上、左下）
    await window.electronAPI.panel.split({
      viewId: 'grid-main',
      newView: {
        id: 'grid-bottom-left',
        title: '终端',
        url: getPanelUrl('preview'),
        icon: '💻'
      },
      direction: 'vertical',
      ratio: 0.5
    })

    // 右侧垂直分割（右上、右下）
    await window.electronAPI.panel.split({
      viewId: 'grid-right',
      newView: {
        id: 'grid-bottom-right',
        title: '输出',
        url: getPanelUrl('preview'),
        icon: '📤'
      },
      direction: 'vertical',
      ratio: 0.5
    })

    updatePanelList()
    alert('✅ 已创建四象限网格布局')
  } catch (error) {
    console.error('[Panel Demo] Failed to create grid layout:', error)
    alert(`❌ 创建失败: ${error.message}`)
  }
}

/**
 * 重置面板
 */
async function resetPanels() {
  try {
    console.log('[Panel Demo] Resetting panels')

    // 创建默认单面板布局
    await window.electronAPI.panel.addView({
      id: 'default-view',
      title: '默认面板',
      url: getPanelUrl('preview'),
      icon: '🏠'
    })

    updatePanelList()
    alert('✅ 已重置为单面板布局')
  } catch (error) {
    console.error('[Panel Demo] Failed to reset panels:', error)
    alert(`❌ 重置失败: ${error.message}`)
  }
}

/**
 * 保存当前布局
 */
async function saveCurrentLayout() {
  try {
    const name = prompt('输入布局名称:', 'demo-layout')
    if (!name) return

    await window.electronAPI.panel.saveLayout(name)
    alert(`✅ 布局 "${name}" 已保存`)
  } catch (error) {
    console.error('[Panel Demo] Failed to save layout:', error)
    alert(`❌ 保存失败: ${error.message}`)
  }
}

/**
 * 加载布局
 */
async function loadLayout() {
  try {
    const name = prompt('输入要加载的布局名称:', 'demo-layout')
    if (!name) return

    const result = await window.electronAPI.panel.loadLayout(name)
    if (result.success) {
      updatePanelList()
      alert(`✅ 布局 "${name}" 已加载`)
    } else {
      alert(`❌ 加载失败: ${result.error || '未知错误'}`)
    }
  } catch (error) {
    console.error('[Panel Demo] Failed to load layout:', error)
    alert(`❌ 加载失败: ${error.message}`)
  }
}

/**
 * 列出所有布局
 */
async function listLayouts() {
  try {
    const layouts = await window.electronAPI.panel.listLayouts()

    if (layouts.length === 0) {
      alert('暂无保存的布局')
    } else {
      const message = `已保存的布局:\n\n${layouts.map((l, i) => `${i + 1}. ${l}`).join('\n')}`
      alert(message)
    }
  } catch (error) {
    console.error('[Panel Demo] Failed to list layouts:', error)
    alert(`❌ 获取列表失败: ${error.message}`)
  }
}

/**
 * 更新面板列表显示
 */
async function updatePanelList() {
  try {
    const views = await window.electronAPI.panel.getAllViews()
    const listEl = document.getElementById('panel-list')

    if (views.length === 0) {
      listEl.innerHTML = '<p style="color: #999; font-size: 0.9em;">暂无面板</p>'
      return
    }

    listEl.innerHTML = views.map(v => `
      <div style="display: flex; align-items: center; padding: 6px 10px; background: white; border-radius: 6px; margin-bottom: 4px; border: 1px solid #e0e0e0;">
        <span style="margin-right: 8px;">${v.icon || '📄'}</span>
        <span style="flex: 1; font-size: 0.9em; color: #333;">${v.title}</span>
        <span style="font-size: 0.75em; color: #999;">${v.id}</span>
      </div>
    `).join('')
  } catch (error) {
    console.error('[Panel Demo] Failed to update panel list:', error)
  }
}
