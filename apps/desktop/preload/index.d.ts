import type { IpcRendererEvent } from 'electron'

interface WindowAPI {
  focus: (id: string) => Promise<void>
  close: (id: string) => Promise<void>
  updateBounds: (id: string, bounds: Partial<{ x: number; y: number; width: number; height: number }>) => Promise<void>
}

interface GitAPI {
  clone: (repo: any) => Promise<void>
  pull: (repo: any) => Promise<void>
  status: (repo: any) => Promise<any[]>
  diff: (repo: any, filepath: string) => Promise<string>
  commit: (repo: any, message: string) => Promise<void>
  push: (repo: any) => Promise<void>
}

interface SubFrontendConfig {
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

interface SubFrontendAPI {
  open: (config: SubFrontendConfig) => Promise<string>
  close: (id: string) => Promise<void>
  focus: (id: string) => Promise<void>
  list: () => Promise<Array<{ id: string; name: string }>>
  send: (id: string, channel: string, data: unknown) => Promise<void>
  broadcast: (channel: string, data: unknown) => Promise<void>
}

interface PanelConfig {
  id: string
  title: string
  url: string
  icon?: string
}

interface SplitRequest {
  viewId: string
  newView: PanelConfig
  direction: 'horizontal' | 'vertical'
  ratio?: number
}

interface PanelAPI {
  getLayout: () => Promise<any>
  setLayout: (config: any) => Promise<{ success: boolean }>
  addView: (config: PanelConfig) => Promise<{ success: boolean }>
  split: (request: SplitRequest) => Promise<{ success: boolean }>
  removeView: (viewId: string) => Promise<{ success: boolean }>
  activateView: (viewId: string) => Promise<{ success: boolean }>
  getAllViews: () => Promise<any[]>
  getView: (viewId: string) => Promise<any | undefined>
  updateRatio: (nodeId: string, ratio: number) => Promise<{ success: boolean }>
  saveLayout: (name?: string) => Promise<{ success: boolean; name: string }>
  loadLayout: (name?: string) => Promise<{ success: boolean; name?: string; error?: string }>
  listLayouts: () => Promise<string[]>
  deleteLayout: (name: string) => Promise<{ success: boolean }>
  toggleMinimize: (viewId: string) => Promise<{ success: boolean }>
}

interface UpdaterAPI {
  onUpdateChecking: (callback: () => void) => void
  onUpdateAvailable: (callback: (info: any) => void) => void
  onUpdateNotAvailable: (callback: (info: any) => void) => void
  onUpdateDownloading: (callback: (progress: any) => void) => void
  onUpdateDownloaded: (callback: (info: any) => void) => void
  onUpdateError: (callback: (error: any) => void) => void
}

interface ElectronAPI {
  window: WindowAPI
  git: GitAPI
  subFrontend: SubFrontendAPI
  panel: PanelAPI
  updater: UpdaterAPI
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => void
  once: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => void
  removeListener: (channel: string, callback: (...args: any[]) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
