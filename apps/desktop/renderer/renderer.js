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
  window.closeAllWindows = closeAllWindows
  window.refreshWindowList = refreshWindowList
  window.focusWindow = focusWindow
  window.closeWindow = closeWindow

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
