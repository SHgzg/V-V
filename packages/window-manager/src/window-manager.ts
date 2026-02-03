import { BrowserWindow, app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import type { WindowDescriptor, Rectangle } from '@v-v/shared'

interface PersistedWindowState extends WindowDescriptor {}

export class WindowManager {
  private windows = new Map<string, BrowserWindow>()
  private stateFile: string | undefined

  private getStateFile(): string {
    if (!this.stateFile) {
      this.stateFile = path.join(app.getPath('userData'), 'layout.json')
    }
    return this.stateFile
  }

  create(desc: WindowDescriptor, loadURL: string, preloadPath?: string): BrowserWindow {
    if (this.windows.has(desc.id)) {
      return this.windows.get(desc.id)!
    }

    // 如果没有提供 preloadPath，使用默认路径
    const resolvedPreloadPath = preloadPath || path.join(__dirname, '../preload/index.js')

    const win = new BrowserWindow({
      x: desc.bounds.x,
      y: desc.bounds.y,
      width: desc.bounds.width,
      height: desc.bounds.height,
      frame: false,
      titleBarStyle: 'hidden',
      webPreferences: {
        preload: resolvedPreloadPath,
        contextIsolation: true,
        nodeIntegration: false
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

  focus(id: string): void {
    this.windows.get(id)?.focus()
  }

  close(id: string): void {
    this.windows.get(id)?.close()
  }

  updateBounds(id: string, bounds: Partial<Rectangle>): void {
    const win = this.windows.get(id)
    if (!win) return

    const current = win.getBounds()
    win.setBounds({ ...current, ...bounds })
  }

  persist(): void {
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

    fs.writeFileSync(this.getStateFile(), JSON.stringify(states, null, 2))
  }

  restore(createWindow: (desc: WindowDescriptor) => void): void {
    const stateFile = this.getStateFile()
    if (!fs.existsSync(stateFile)) return

    const states: PersistedWindowState[] = JSON.parse(
      fs.readFileSync(stateFile, 'utf-8')
    )

    for (const state of states) {
      createWindow(state)
    }
  }
}
