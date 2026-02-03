/**
 * V-V PKM Desktop - 子前端管理器
 *
 * 遵循插件与子前端构建隔离规范 v1
 * 使用 BrowserWindow 方案实现多窗口子前端
 */

import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(import.meta.url)

/**
 * 子前端配置
 */
export interface SubFrontendConfig {
  id: string
  name: string
  path: string                    // 开发环境：本地服务器地址，生产环境：dist/index.html 路径
  icon?: string
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  resizable?: boolean
  alwaysOnTop?: boolean
}

/**
 * 子前端窗口元数据
 */
interface SubFrontendWindow {
  config: SubFrontendConfig
  window: BrowserWindow
  createdAt: Date
}

/**
 * 子前端管理器
 */
export class SubFrontendManager {
  private windows: Map<string, SubFrontendWindow> = new Map()
  private rootDir: string
  private isDev: boolean

  constructor() {
    // 项目根目录
    this.rootDir = join(__dirname, '../../../')
    this.isDev = process.env.NODE_ENV !== 'production'

    // 注册 IPC 处理器
    this.registerIpcHandlers()
  }

  /**
   * 注册 IPC 处理器
   */
  private registerIpcHandlers() {
    // 打开子前端窗口
    ipcMain.handle('sub-frontend:open', async (_, config: SubFrontendConfig) => {
      return this.open(config)
    })

    // 关闭子前端窗口
    ipcMain.handle('sub-frontend:close', async (_, id: string) => {
      return this.close(id)
    })

    // 获取所有子前端窗口列表
    ipcMain.handle('sub-frontend:list', async () => {
      return this.list()
    })

    // 聚焦子前端窗口
    ipcMain.handle('sub-frontend:focus', async (_, id: string) => {
      return this.focus(id)
    })

    // 发送消息到子前端
    ipcMain.handle('sub-frontend:send', async (_, id: string, channel: string, data: unknown) => {
      return this.sendToWindow(id, channel, data)
    })

    // 广播消息到所有子前端
    ipcMain.handle('sub-frontend:broadcast', async (_, channel: string, data: unknown) => {
      this.broadcast(channel, data)
      return true
    })

    // 最小化窗口
    ipcMain.on('sub-frontend:minimize', (_, id: string) => {
      const win = this.getWindow(id)
      if (win) win.minimize()
    })

    // 最大化窗口
    ipcMain.on('sub-frontend:maximize', (_, id: string) => {
      const win = this.getWindow(id)
      if (win) {
        if (win.isMaximized()) {
          win.unmaximize()
        } else {
          win.maximize()
        }
      }
    })
  }

  /**
   * 打开子前端窗口
   */
  open(config: SubFrontendConfig): string {
    const { id } = config

    // 如果窗口已存在，聚焦并返回
    if (this.windows.has(id)) {
      const existing = this.windows.get(id)!
      existing.window.focus()
      return id
    }

    // 解析子前端路径
    const url = this.resolveSubFrontendUrl(config.path)

    // 创建新的 BrowserWindow
    const win = new BrowserWindow({
      width: config.width,
      height: config.height,
      minWidth: config.minWidth ?? 400,
      minHeight: config.minHeight ?? 300,
      resizable: config.resizable ?? true,
      alwaysOnTop: config.alwaysOnTop ?? false,
      show: false, // 延迟显示，等页面加载完成
      autoHideMenuBar: true,
      webPreferences: {
        // 使用子前端专用的预加载脚本
        preload: join(__dirname, '../preload/sub-frontend-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    })

    // 窗口准备就绪后显示
    win.once('ready-to-show', () => {
      win.show()
    })

    // 窗口关闭时清理
    win.on('closed', () => {
      this.windows.delete(id)
    })

    // 加载子前端
    win.loadURL(url).catch((err) => {
      console.error(`Failed to load sub-frontend ${id}:`, err)
      win.close()
    })

    // 开发模式下打开 DevTools
    if (this.isDev) {
      win.webContents.openDevTools()
    }

    // 存储窗口引用
    this.windows.set(id, {
      config,
      window: win,
      createdAt: new Date()
    })

    console.log(`[SubFrontendManager] Opened sub-frontend: ${id} (${url})`)

    return id
  }

  /**
   * 关闭子前端窗口
   */
  close(id: string): boolean {
    const subFrontend = this.windows.get(id)
    if (!subFrontend) {
      return false
    }

    subFrontend.window.close()
    this.windows.delete(id)
    return true
  }

  /**
   * 聚焦子前端窗口
   */
  focus(id: string): boolean {
    const subFrontend = this.windows.get(id)
    if (!subFrontend) {
      return false
    }

    if (subFrontend.window.isMinimized()) {
      subFrontend.window.restore()
    }
    subFrontend.window.focus()
    return true
  }

  /**
   * 获取所有子前端窗口列表
   */
  list(): Array<{ id: string; name: string; createdAt: Date }> {
    return Array.from(this.windows.entries()).map(([id, { config, createdAt }]) => ({
      id,
      name: config.name,
      createdAt
    }))
  }

  /**
   * 发送消息到指定子前端窗口
   */
  sendToWindow(id: string, channel: string, data: unknown): boolean {
    const subFrontend = this.windows.get(id)
    if (!subFrontend) {
      return false
    }

    subFrontend.window.webContents.send(channel, data)
    return true
  }

  /**
   * 广播消息到所有子前端窗口
   */
  broadcast(channel: string, data: unknown): void {
    for (const [, { window }] of this.windows) {
      window.webContents.send(channel, data)
    }
  }

  /**
   * 解析子前端 URL
   */
  private resolveSubFrontendUrl(path: string): string {
    // 如果是完整的 URL（http:// 或 https://），直接返回
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    // 如果是 file:// 协议，直接返回
    if (path.startsWith('file://')) {
      return path
    }

    // 开发环境：假设是本地开发服务器
    if (this.isDev) {
      // 如果路径不包含端口，尝试使用常见端口
      if (!path.includes(':')) {
        return `http://localhost:5173` // Vite 默认端口
      }
      return path
    }

    // 生产环境：解析为文件路径
    const fullPath = join(this.rootDir, path)

    // 检查文件是否存在
    if (!existsSync(fullPath)) {
      console.warn(`Sub-frontend file not found: ${fullPath}`)
      // 返回一个错误页面
      return `data:text/html,<h1>Sub-frontend not found</h1><p>${path}</p>`
    }

    return `file://${fullPath}`
  }

  /**
   * 关闭所有子前端窗口
   */
  closeAll(): void {
    for (const [id, { window }] of this.windows) {
      window.close()
      this.windows.delete(id)
    }
  }

  /**
   * 获取指定子前端窗口
   */
  getWindow(id: string): BrowserWindow | undefined {
    return this.windows.get(id)?.window
  }
}

// 单例导出
let subFrontendManager: SubFrontendManager | null = null

export function getSubFrontendManager(): SubFrontendManager {
  if (!subFrontendManager) {
    subFrontendManager = new SubFrontendManager()
  }
  return subFrontendManager
}
