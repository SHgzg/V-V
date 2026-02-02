import { BrowserWindow, app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import type { WindowDescriptor, Rectangle } from '@v-v/shared'

interface PersistedWindowState extends WindowDescriptor {}

export class WindowManager {
  private windows = new Map<string, BrowserWindow>()
  private stateFile: string

  constructor() {
    this.stateFile = path.join(app.getPath('userData'), 'layout.json')
  }

  create(desc: WindowDescriptor, loadURL: string): BrowserWindow {
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
        preload: path.join(__dirname, '../../preload/dist/index.js'),
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

    fs.writeFileSync(this.stateFile, JSON.stringify(states, null, 2))
  }

  restore(createWindow: (desc: WindowDescriptor) => void): void {
    if (!fs.existsSync(this.stateFile)) return

    const states: PersistedWindowState[] = JSON.parse(
      fs.readFileSync(this.stateFile, 'utf-8')
    )

    for (const state of states) {
      createWindow(state)
    }
  }
}
