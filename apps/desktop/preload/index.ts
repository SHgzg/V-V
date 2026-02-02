import type { IpcRendererEvent } from 'electron'
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Window APIs
  window: {
    focus: (id: string) => ipcRenderer.invoke('window:focus', id),
    close: (id: string) => ipcRenderer.invoke('window:close', id),
    updateBounds: (id: string, bounds: Partial<{ x: number; y: number; width: number; height: number }>) =>
      ipcRenderer.invoke('window:updateBounds', id, bounds)
  },

  // Git APIs
  git: {
    clone: (repo: any) => ipcRenderer.invoke('git:clone', repo),
    pull: (repo: any) => ipcRenderer.invoke('git:pull', repo),
    status: (repo: any) => ipcRenderer.invoke('git:status', repo),
    diff: (repo: any, filepath: string) => ipcRenderer.invoke('git:diff', repo, filepath),
    commit: (repo: any, message: string) => ipcRenderer.invoke('git:commit', repo, message),
    push: (repo: any) => ipcRenderer.invoke('git:push', repo)
  },

  // Event listeners
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback)
  },
  once: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.once(channel, callback)
  },
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
