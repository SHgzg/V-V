import { app } from 'electron'
import { WindowManager } from '@v-v/window-manager'
import { registerWindowIpc } from '@v-v/window-manager'
import { registerGitIpc } from './ipc/index.js'
import { createMainWindow } from './window/index.js'

let windowManager: WindowManager

app.whenReady().then(() => {
  windowManager = new WindowManager()

  // Register IPC handlers
  registerWindowIpc(windowManager)
  registerGitIpc()

  // Restore previous layout or create main window
  windowManager.restore((desc) => {
    createMainWindow(windowManager, desc)
  })

  if (windowManager['windows'].size === 0) {
    createMainWindow(windowManager)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (windowManager['windows'].size === 0) {
    createMainWindow(windowManager)
  }
})
