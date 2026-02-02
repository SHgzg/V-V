import { ipcMain } from 'electron'
import type { WindowManager } from './window-manager.js'
import type { Rectangle } from '@v-v/shared'

export function registerWindowIpc(manager: WindowManager): void {
  ipcMain.handle('window:focus', (_, id: string) => manager.focus(id))
  ipcMain.handle('window:close', (_, id: string) => manager.close(id))
  ipcMain.handle('window:updateBounds', (_, id: string, bounds: Partial<Rectangle>) =>
    manager.updateBounds(id, bounds)
  )
}
