// packages/window-manager/src/window-manager.ts

import { BrowserWindow, Rectangle, app } from 'electron'
import path from 'path'
import fs from 'fs'

export type WindowType = 'main' | 'editor' | 'preview' | 'search' | 'settings'

export interface WindowDescriptor {
  id: string
  type: WindowType
  bounds: Rectangle
  isMaximized?: boolean
}

interface PersistedWindowState extends WindowDescriptor {}

export class WindowManager {
  private windows = new Map<string, BrowserWindow>()
  private stateFile: string

  constructor() {
    this.stateFile = path.join(app.getPath('userData'), 'layout.json')
  }

  create(desc: WindowDescriptor, loadURL: string) {
    if (this.windows.has(desc.id)) {
      return this.windows.get(desc.id)!
    }

    const win = new BrowserWindow({
      x: desc.bounds.x,
      y: desc.bounds.y,
      width: desc.bounds.width,
      height: desc.bounds.height,
      frame: false,
      titleBarStyle: 'hidden',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js')
      }
    })

    win.loadURL(loadURL)

    if (desc.isMaximized) {
      win.maximize()
    }

    win.on('close', () => {
      this.persist()
      this.windows.delete(desc.id)
    })

    this.windows.set(desc.id, win)
    return win
  }

  focus(id: string) {
    this.windows.get(id)?.focus()
  }

  close(id: string) {
    this.windows.get(id)?.close()
  }

  updateBounds(id: string, bounds: Partial<Rectangle>) {
    const win = this.windows.get(id)
    if (!win) return

    const current = win.getBounds()
    win.setBounds({ ...current, ...bounds })
  }

  persist() {
    const states: PersistedWindowState[] = []

    for (const [id, win] of this.windows) {
      const bounds = win.getBounds()
      states.push({
        id,
        type: 'main',
        bounds,
        isMaximized: win.isMaximized()
      })
    }

    fs.writeFileSync(this.stateFile, JSON.stringify(states, null, 2))
  }

  restore(createWindow: (desc: WindowDescriptor) => void) {
    if (!fs.existsSync(this.stateFile)) return

    const states: PersistedWindowState[] = JSON.parse(
      fs.readFileSync(this.stateFile, 'utf-8')
    )

    for (const state of states) {
      createWindow(state)
    }
  }
}

// packages/window-manager/src/ipc.ts

import { ipcMain } from 'electron'
import { WindowManager } from './window-manager'

export function registerWindowIpc(manager: WindowManager) {
  ipcMain.handle('window:focus', (_, id: string) => manager.focus(id))
  ipcMain.handle('window:close', (_, id: string) => manager.close(id))
  ipcMain.handle('window:updateBounds', (_, id, bounds) =>
    manager.updateBounds(id, bounds)
  )
}
