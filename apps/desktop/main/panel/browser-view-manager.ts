/**
 * V-V PKM Desktop - BrowserView 管理器
 *
 * 在 Electron 主进程中管理 BrowserView 对象
 * 根据 LayoutManager 的配置动态创建和调整 BrowserView
 */

import { BrowserWindow, BrowserView } from 'electron'
import type { LayoutManager } from '@v-v/layout-manager'
import type { Rectangle, ViewState } from '@v-v/layout-manager'

export class BrowserViewManager {
  private mainWindow: BrowserWindow
  private layoutManager: LayoutManager
  private browserViews: Map<string, BrowserView> = new Map()
  private currentStates: Map<string, ViewState> = new Map()

  constructor(mainWindow: BrowserWindow, layoutManager: LayoutManager) {
    this.mainWindow = mainWindow
    this.layoutManager = layoutManager

    // 订阅布局变更事件
    layoutManager.onLayoutChange((event) => {
      this.onLayoutChange(event)
    })
  }

  /**
   * 更新所有 BrowserView 的位置和大小
   */
  updateAll(customBounds?: Rectangle): void {
    const bounds = customBounds || this.mainWindow.getBounds()
    const views = this.layoutManager.calculateViewBounds({
      x: 0,
      y: 0,
      width: bounds.width,
      height: bounds.height
    })

    this.applyViewState(views)
  }

  /**
   * 应用视图状态
   */
  private applyViewState(views: Map<string, ViewState>): void {
    // 获取当前存在的视图 ID
    const existingViewIds = new Set(this.browserViews.keys())

    views.forEach((state, viewId) => {
      existingViewIds.delete(viewId)

      if (state.isMinimized) {
        // 最小化：隐藏视图
        this.hideView(viewId)
      } else {
        // 显示或创建视图
        this.showView(viewId, state)
      }
    })

    // 移除不再存在的视图
    existingViewIds.forEach((viewId) => {
      this.removeView(viewId)
    })
  }

  /**
   * 显示或创建视图
   */
  private showView(viewId: string, state: ViewState): void {
    let view = this.browserViews.get(viewId)

    if (!view) {
      // 创建新的 BrowserView
      view = new BrowserView()
      view.webContents.on('will-navigate', (event, url) => {
        console.log(`[BrowserViewManager] ${viewId} navigating to:`, url)
      })
      this.mainWindow.addBrowserView(view)
      this.browserViews.set(viewId, view)
    }

    // 加载 URL（如果需要）
    if (state.url && view.webContents.getURL() !== state.url) {
      view.webContents.loadURL(state.url).catch((err) => {
        console.error(`[BrowserViewManager] Failed to load URL for ${viewId}:`, err)
      })
    }

    // 设置边界
    view.setBounds(state.bounds)

    // 显示视图
    view.setBounds(state.bounds) // 确保边界被正确设置

    this.currentStates.set(viewId, state)
  }

  /**
   * 隐藏视图
   */
  private hideView(viewId: string): void {
    const view = this.browserViews.get(viewId)
    if (view) {
      // BrowserView 没有直接隐藏的方法，我们通过设置边界为 0 来隐藏
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
    }
  }

  /**
   * 移除视图
   */
  private removeView(viewId: string): void {
    const view = this.browserViews.get(viewId)
    if (view) {
      this.mainWindow.removeBrowserView(view)
      this.browserViews.delete(viewId)
      this.currentStates.delete(viewId)
    }
  }

  /**
   * 获取指定视图的状态
   */
  getViewState(viewId: string): ViewState | undefined {
    return this.currentStates.get(viewId)
  }

  /**
   * 获取所有视图的状态
   */
  getAllViewStates(): ViewState[] {
    return Array.from(this.currentStates.values())
  }

  /**
   * 处理布局变更事件
   */
  private onLayoutChange(event: any): void {
    console.log('[BrowserViewManager] Layout changed:', event.type)

    // 更新所有 BrowserView
    this.updateAll()

    // 发送事件到渲染进程
    this.sendToRenderer('layout:changed', event)
  }

  /**
   * 发送消息到渲染进程
   */
  private sendToRenderer(channel: string, data: any): void {
    // 发送到主窗口的渲染进程
    this.mainWindow.webContents.send(channel, data)

    // 发送到所有 BrowserView 的渲染进程
    this.browserViews.forEach((view) => {
      view.webContents.send(channel, data)
    })
  }

  /**
   * 清理所有 BrowserView
   */
  destroy(): void {
    this.browserViews.forEach((view) => {
      this.mainWindow.removeBrowserView(view)
    })
    this.browserViews.clear()
    this.currentStates.clear()
  }
}
