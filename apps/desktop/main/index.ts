import { app, BrowserWindow } from 'electron'
import { WindowManager } from '@v-v/window-manager'
import { registerWindowIpc } from '@v-v/window-manager'
import { registerGitIpc } from './ipc/index.js'
import { createMainWindow } from './window/index.js'
import { setupAutoUpdater } from './updater/index.js'
import { getSubFrontendManager } from './sub-frontends/manager.js'

let windowManager: WindowManager
let mainWindow: BrowserWindow | null = null

app.whenReady().then(() => {
  windowManager = new WindowManager()

  // Register IPC handlers
  registerWindowIpc(windowManager)
  registerGitIpc()

  // 初始化子前端管理器
  const subFrontendManager = getSubFrontendManager()
  console.log('[Main] SubFrontendManager initialized')

  // Restore previous layout or create main window
  windowManager.restore((desc) => {
    mainWindow = createMainWindow(windowManager, desc)
  })

  if (windowManager['windows'].size === 0) {
    mainWindow = createMainWindow(windowManager)
  }

  // Setup auto-updater (only in production)
  if (app.isPackaged) {
    setupAutoUpdater(mainWindow)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (windowManager['windows'].size === 0) {
    mainWindow = createMainWindow(windowManager)
  }
})

// 应用退出前关闭所有子前端窗口
app.on('before-quit', () => {
  const subFrontendManager = getSubFrontendManager()
  subFrontendManager.closeAll()
})

// Export for module access
export { mainWindow }
