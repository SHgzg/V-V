import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Git 操作 API
  git: {
    clone: (repo: any) => ipcRenderer.invoke('git:clone', repo),
    pull: (repo: any) => ipcRenderer.invoke('git:pull', repo),
    status: (repo: any) => ipcRenderer.invoke('git:status', repo),
    diff: (repo: any, filepath: string) => ipcRenderer.invoke('git:diff', repo, filepath),
    commit: (repo: any, message: string) => ipcRenderer.invoke('git:commit', repo, message),
    push: (repo: any) => ipcRenderer.invoke('git:push', repo)
  },

  // 窗口管理 API
  window: {
    focus: (id: string) => ipcRenderer.invoke('window:focus', id),
    close: (id: string) => ipcRenderer.invoke('window:close', id),
    updateBounds: (id: string, bounds: any) => ipcRenderer.invoke('window:updateBounds', id, bounds)
  },

  // 自动更新 API
  updater: {
    onUpdateChecking: (callback: () => void) => {
      ipcRenderer.on('update:checking', () => callback())
    },
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on('update:available', (_event, info) => callback(info))
    },
    onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on('update:not-available', (_event, info) => callback(info))
    },
    onUpdateDownloading: (callback: (progress: DownloadProgress) => void) => {
      ipcRenderer.on('update:downloading', (_event, progress) => callback(progress))
    },
    onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on('update:downloaded', (_event, info) => callback(info))
    },
    onUpdateError: (callback: (error: ErrorInfo) => void) => {
      ipcRenderer.on('update:error', (_event, error) => callback(error))
    }
  },

  // 子前端管理 API
  subFrontend: {
    open: (config: SubFrontendConfig) => ipcRenderer.invoke('sub-frontend:open', config),
    close: (id: string) => ipcRenderer.invoke('sub-frontend:close', id),
    focus: (id: string) => ipcRenderer.invoke('sub-frontend:focus', id),
    list: () => ipcRenderer.invoke('sub-frontend:list'),
    send: (id: string, channel: string, data: unknown) => ipcRenderer.invoke('sub-frontend:send', id, channel, data),
    broadcast: (channel: string, data: unknown) => ipcRenderer.invoke('sub-frontend:broadcast', channel, data)
  }
})

// 类型定义
export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

export interface DownloadProgress {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

export interface ErrorInfo {
  message: string
}

export interface SubFrontendConfig {
  id: string
  name: string
  path: string
  icon?: string
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  resizable?: boolean
  alwaysOnTop?: boolean
}
