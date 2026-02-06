/**
 * Panel System IPC Handlers
 * 处理渲染进程与主进程之间的面板操作通信
 */

import { ipcMain, BrowserWindow } from 'electron'
import { BrowserViewManager } from './browser-view-manager.js'
import { LayoutManager, LayoutPersistence } from '@v-v/layout-manager'

export interface PanelConfig {
  id: string
  title: string
  url: string
  icon?: string
}

export interface SplitRequest {
  viewId: string
  newView: PanelConfig
  direction: 'horizontal' | 'vertical'
  ratio?: number
}

export class PanelIpcHandler {
  private mainWindow: BrowserWindow | null = null
  private viewManager: BrowserViewManager | null = null
  private layoutManager: LayoutManager
  private persistence: LayoutPersistence

  constructor() {
    this.layoutManager = new LayoutManager()
    this.persistence = new LayoutPersistence({
      autoSave: true
    })
    console.log('[PanelIpcHandler] Initialized')
  }

  /**
   * 设置主窗口
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window

    // 初始化 BrowserView 管理器
    this.viewManager = new BrowserViewManager(window, this.layoutManager)

    // 监听布局变化并更新视图
    this.layoutManager.onLayoutChange((event) => {
      this.handleLayoutChange(event)
    })

    console.log('[PanelIpcHandler] Main window set, BrowserViewManager initialized')
  }

  /**
   * 处理布局变化
   */
  private handleLayoutChange(event: any): void {
    if (!this.viewManager) return

    console.log('[PanelIpcHandler] Layout changed:', event.type)

    // 更新所有 BrowserView
    const containerBounds = this.mainWindow?.getContentBounds() || { x: 0, y: 0, width: 1920, height: 1080 }
    this.viewManager.updateAll(containerBounds)

    // 自动保存
    this.persistence.debouncedSave('default', this.layoutManager.getConfig())
  }

  /**
   * 注册所有 IPC 处理器
   */
  registerHandlers(): void {
    console.log('[PanelIpcHandler] Registering IPC handlers')

    // 获取当前布局
    ipcMain.handle('panel:getLayout', async () => {
      return this.layoutManager.getConfig()
    })

    // 设置布局
    ipcMain.handle('panel:setLayout', async (_, config) => {
      console.log('[PanelIpcHandler] setLayout called')
      this.layoutManager.setConfig(config)
      return { success: true }
    })

    // 添加视图
    ipcMain.handle('panel:addView', async (_, config: PanelConfig) => {
      console.log('[PanelIpcHandler] addView called:', config)
      this.layoutManager.addView(config.id, config.title, config.url)
      // 触发 BrowserView 更新
      if (this.viewManager && this.mainWindow) {
        const containerBounds = this.mainWindow.getContentBounds()
        this.viewManager.updateAll(containerBounds)
      }
      return { success: true }
    })

    // 分割视图
    ipcMain.handle('panel:split', async (_, request: SplitRequest) => {
      console.log('[PanelIpcHandler] split called:', request)
      const result = this.layoutManager.split(
        request.viewId,
        request.newView.id,
        request.newView.url,
        request.direction,
        request.ratio
      )
      console.log('[PanelIpcHandler] split result:', result)
      // 触发 BrowserView 更新
      if (result && this.viewManager && this.mainWindow) {
        const containerBounds = this.mainWindow.getContentBounds()
        this.viewManager.updateAll(containerBounds)
      }
      return { success: result }
    })

    // 移除视图
    ipcMain.handle('panel:removeView', async (_, viewId: string) => {
      console.log('[PanelIpcHandler] removeView called:', viewId)
      const result = this.layoutManager.removeView(viewId)
      if (result && this.viewManager && this.mainWindow) {
        const containerBounds = this.mainWindow.getContentBounds()
        this.viewManager.updateAll(containerBounds)
      }
      return { success: result }
    })

    // 激活视图
    ipcMain.handle('panel:activateView', async (_, viewId: string) => {
      this.layoutManager.activateView(viewId)
      return { success: true }
    })

    // 获取所有视图
    ipcMain.handle('panel:getAllViews', async () => {
      const views = this.layoutManager.getAllViews()
      console.log('[PanelIpcHandler] getAllViews returning:', views.length, 'views')
      return views
    })

    // 获取单个视图
    ipcMain.handle('panel:getView', async (_, viewId: string) => {
      return this.layoutManager.getView(viewId)
    })

    // 更新分割比例
    ipcMain.handle('panel:updateRatio', async (_, nodeId: string, ratio: number) => {
      const result = this.layoutManager.updateRatio(nodeId, ratio)
      if (result && this.viewManager && this.mainWindow) {
        const containerBounds = this.mainWindow.getContentBounds()
        this.viewManager.updateAll(containerBounds)
      }
      return { success: result }
    })

    // 保存布局
    ipcMain.handle('panel:saveLayout', async (_, name?: string) => {
      const layoutName = name || 'default'
      await this.persistence.save(layoutName, this.layoutManager.getConfig())
      console.log('[PanelIpcHandler] Layout saved:', layoutName)
      return { success: true, name: layoutName }
    })

    // 加载布局
    ipcMain.handle('panel:loadLayout', async (_, name?: string) => {
      const layoutName = name || 'default'
      const config = await this.persistence.load(layoutName)
      if (config) {
        this.layoutManager.setConfig(config)
        if (this.viewManager && this.mainWindow) {
          const containerBounds = this.mainWindow.getContentBounds()
          this.viewManager.updateAll(containerBounds)
        }
        console.log('[PanelIpcHandler] Layout loaded:', layoutName)
        return { success: true, name: layoutName }
      }
      return { success: false, error: 'Layout not found' }
    })

    // 列出所有布局
    ipcMain.handle('panel:listLayouts', async () => {
      const layouts = await this.persistence.list()
      console.log('[PanelIpcHandler] Available layouts:', layouts)
      return layouts
    })

    // 删除布局
    ipcMain.handle('panel:deleteLayout', async (_, name: string) => {
      await this.persistence.delete(name)
      return { success: true }
    })

    // 最小化/恢复视图
    ipcMain.handle('panel:toggleMinimize', async (_, viewId: string) => {
      this.layoutManager.toggleMinimize(viewId)
      if (this.viewManager && this.mainWindow) {
        const containerBounds = this.mainWindow.getContentBounds()
        this.viewManager.updateAll(containerBounds)
      }
      return { success: true }
    })

    console.log('[PanelIpcHandler] IPC handlers registered successfully')
  }

  /**
   * 初始化（从持久化存储加载布局）
   */
  async initialize(): Promise<void> {
    // 尝试加载默认布局
    const defaultLayout = await this.persistence.load('default')

    if (defaultLayout) {
      this.layoutManager.setConfig(defaultLayout)
      console.log('[PanelIpcHandler] Loaded default layout from storage')
    } else {
      // 创建初始默认布局
      console.log('[PanelIpcHandler] No default layout found, creating initial layout')
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.viewManager) {
      this.viewManager.destroy()
      this.viewManager = null
    }
  }
}

// 导出单例
let panelIpcHandler: PanelIpcHandler | null = null

export function registerPanelIpc(): void {
  if (!panelIpcHandler) {
    panelIpcHandler = new PanelIpcHandler()
    panelIpcHandler.registerHandlers()
  }
}

export function getPanelIpcHandler(): PanelIpcHandler | null {
  return panelIpcHandler
}
