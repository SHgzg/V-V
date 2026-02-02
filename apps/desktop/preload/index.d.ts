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

interface ElectronAPI {
  window: WindowAPI
  git: GitAPI
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
