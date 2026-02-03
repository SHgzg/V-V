/**
 * V-V PKM Desktop - 子前端预加载脚本
 *
 * 为子前端窗口提供受限的 API 访问
 * 遵循插件与子前端构建隔离规范 v1
 */

import { contextBridge, ipcRenderer } from 'electron'

// 子前端 ID（会在创建窗口时注入）
const SUB_FRONTEND_ID = window.location.search.match(/[\?&]id=([^&#]*)/)?.[1] || 'unknown'

/**
 * 子前端 API
 * 提供受限的访问能力，不直接暴露完整的 Electron API
 */
const subFrontendAPI = {
  // ===== 基本信息 =====
  id: SUB_FRONTEND_ID,
  platform: process.platform,

  // ===== 窗口操作 =====
  window: {
    close: () => ipcRenderer.send('sub-frontend:close', SUB_FRONTEND_ID),
    minimize: () => ipcRenderer.send('sub-frontend:minimize', SUB_FRONTEND_ID),
    maximize: () => ipcRenderer.send('sub-frontend:maximize', SUB_FRONTEND_ID),
    focus: () => ipcRenderer.send('sub-frontend:focus', SUB_FRONTEND_ID)
  },

  // ===== Git 操作（通过 Renderer Host 转发到主进程）=====
  git: {
    clone: (repo: unknown) => ipcRenderer.invoke('git:clone', repo),
    pull: (repo: unknown) => ipcRenderer.invoke('git:pull', repo),
    status: (repo: unknown) => ipcRenderer.invoke('git:status', repo),
    diff: (repo: unknown, filepath: string) => ipcRenderer.invoke('git:diff', repo, filepath),
    commit: (repo: unknown, message: string) => ipcRenderer.invoke('git:commit', repo, message),
    push: (repo: unknown) => ipcRenderer.invoke('git:push', repo)
  },

  // ===== 事件监听 =====
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    // 只允许特定的频道
    const allowedChannels = [
      'update:available',
      'update:downloading',
      'update:downloaded',
      'sub-frontend:message',
      'window:state-change'
    ]

    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args))
    } else {
      console.warn(`[SubFrontend] Blocked listening to channel: ${channel}`)
    }
  },

  // 移除事件监听
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback as (...args: unknown[]) => void)
  },

  // ===== 发送消息到其他子前端或 Renderer Host =====
  send: (targetId: string, channel: string, data: unknown) => {
    return ipcRenderer.invoke('sub-frontend:send', targetId, channel, data)
  },

  // ===== 广播消息到所有窗口 =====
  broadcast: (channel: string, data: unknown) => {
    return ipcRenderer.invoke('sub-frontend:broadcast', channel, data)
  }
}

// 类型定义（用于 TypeScript）
export interface SubFrontendAPI {
  id: string
  platform: string
  window: {
    close: () => void
    minimize: () => void
    maximize: () => void
    focus: () => void
  }
  git: {
    clone: (repo: unknown) => Promise<unknown>
    pull: (repo: unknown) => Promise<unknown>
    status: (repo: unknown) => Promise<unknown>
    diff: (repo: unknown, filepath: string) => Promise<unknown>
    commit: (repo: unknown, message: string) => Promise<unknown>
    push: (repo: unknown) => Promise<unknown>
  }
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
  send: (targetId: string, channel: string, data: unknown) => Promise<unknown>
  broadcast: (channel: string, data: unknown) => Promise<unknown>
}

// 暴露 API 到子前端
contextBridge.exposeInMainWorld('subFrontendAPI', subFrontendAPI)

// 开发模式下添加调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('[SubFrontend Preload] API exposed:', {
    id: SUB_FRONTEND_ID,
    platform: process.platform
  })
}
