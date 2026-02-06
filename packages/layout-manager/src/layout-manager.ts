/**
 * 布局管理器
 *
 * 负责管理 VSCode 风格的多面板布局
 * 支持分割、合并、最小化、持久化等操作
 */

import type {
  LayoutNode,
  LayoutConfig,
  Rectangle,
  SplitDirection,
  ViewState,
  LayoutChangeEvent
} from './types.js'

export class LayoutManager {
  private config: LayoutConfig
  private changeListeners: Set<(event: LayoutChangeEvent) => void> = new Set()

  constructor(initialConfig?: LayoutConfig) {
    this.config = initialConfig || this.createDefaultLayout()
  }

  /**
   * 创建默认布局（单视图）
   */
  private createDefaultLayout(): LayoutConfig {
    return {
      root: {
        id: 'root',
        type: 'view',
        viewId: 'main-view',
        title: '主视图',
        url: ''
      }
    }
  }

  /**
   * 获取当前布局配置
   */
  getConfig(): LayoutConfig {
    return this.config
  }

  /**
   * 更新布局配置
   */
  setConfig(config: LayoutConfig): void {
    this.config = config
    this.notifyChange({ type: 'resize', layout: config })
  }

  /**
   * 添加视图（作为根节点）
   */
  addView(id: string, title: string, url: string): void {
    this.config = {
      root: {
        id: 'root',
        type: 'view',
        viewId: id,
        title,
        url
      },
      activeViewId: id
    }
    this.notifyChange({ type: 'add', viewId: id, layout: this.config })
  }

  /**
   * 分割视图
   */
  split(
    viewId: string,
    newViewId: string,
    newViewUrl: string,
    direction: SplitDirection,
    ratio: number = 0.5
  ): boolean {
    const newRoot = this.splitNode(this.config.root, viewId, newViewId, newViewUrl, direction, ratio)
    if (!newRoot) {
      return false
    }

    this.config.root = newRoot
    this.notifyChange({ type: 'split', viewId, layout: this.config })
    return true
  }

  /**
   * 递归分割节点
   */
  private splitNode(
    node: LayoutNode,
    targetViewId: string,
    newViewId: string,
    newViewUrl: string,
    direction: SplitDirection,
    ratio: number
  ): LayoutNode | null {
    if (node.type === 'view' && node.viewId === targetViewId) {
      // 找到目标视图，创建分割节点
      return {
        id: `split-${Date.now()}`,
        type: 'split',
        direction,
        ratio,
        children: [
          {
            ...node,
            minimized: false
          },
          {
            id: newViewId,
            type: 'view',
            viewId: newViewId,
            title: '新视图',
            url: newViewUrl,
            minimized: false
          }
        ]
      }
    }

    if (node.type === 'split' && node.children) {
      // 递归查找
      for (let i = 0; i < node.children.length; i++) {
        const result = this.splitNode(
          node.children[i],
          targetViewId,
          newViewId,
          newViewUrl,
          direction,
          ratio
        )
        if (result) {
          node.children[i] = result
          return node
        }
      }
    }

    return null
  }

  /**
   * 移除视图
   */
  removeView(viewId: string): boolean {
    const { newRoot, removed } = this.removeNode(this.config.root, viewId)
    if (!removed) {
      return false
    }

    this.config.root = newRoot
    this.notifyChange({ type: 'remove', viewId, layout: this.config })
    return true
  }

  /**
   * 递归移除节点
   */
  private removeNode(
    node: LayoutNode,
    targetViewId: string
  ): { newRoot: LayoutNode; removed: boolean } {
    if (node.type === 'view' && node.viewId === targetViewId) {
      // 找到目标视图，返回空节点标记
      return { newRoot: null!, removed: true }
    }

    if (node.type === 'split' && node.children) {
      for (let i = 0; i <node.children.length; i++) {
        const result = this.removeNode(node.children[i], targetViewId)
        if (result.removed) {
          // 检查是否只有一个子节点
          const remaining = node.children.filter(c => c !== null)
          if (remaining.length === 1) {
            // 只剩一个子节点，替换当前分割节点
            return { newRoot: remaining[0]!, removed: true }
          } else {
            // 还有多个子节点，更新数组
            node.children = remaining
            return { newRoot: node, removed: true }
          }
        }
      }
    }

    return { newRoot: node, removed: false }
  }

  /**
   * 计算布局中所有视图的边界
   */
  calculateViewBounds(containerBounds: Rectangle): Map<string, ViewState> {
    const views = new Map<string, ViewState>()
    this.calculateNodeBounds(this.config.root, containerBounds, views)
    return views
  }

  /**
   * 递归计算节点边界
   */
  private calculateNodeBounds(
    node: LayoutNode,
    bounds: Rectangle,
    views: Map<string, ViewState>
  ): void {
    if (node.type === 'view' && node.viewId) {
      views.set(node.viewId, {
        id: node.viewId,
        title: node.title || '未命名',
        icon: node.icon,
        url: node.url || '',
        bounds,
        isActive: node.viewId === this.config.activeViewId,
        isMinimized: node.minimized || false
      })
    } else if (node.type === 'split' && node.children) {
      const [child1, child2] = node.children
      const ratio = node.ratio ?? 0.5

      if (node.direction === 'horizontal') {
        // 水平分割：左右布局
        const width1 = bounds.width * ratio
        const width2 = bounds.width - width1

        this.calculateNodeBounds(child1!, { ...bounds, width: width1 }, views)
        this.calculateNodeBounds(child2!, { ...bounds, x: bounds.x + width1, width: width2 }, views)
      } else {
        // 垂直分割：上下布局
        const height1 = bounds.height * ratio
        const height2 = bounds.height - height1

        this.calculateNodeBounds(child1!, { ...bounds, height: height1 }, views)
        this.calculateNodeBounds(child2!, { ...bounds, y: bounds.y + height1, height: height2 }, views)
      }
    }
  }

  /**
   * 获取所有视图
   */
  getAllViews(): ViewState[] {
    const containerBounds = { x: 0, y: 0, width: 1920, height: 1080 }
    const views = this.calculateViewBounds(containerBounds)
    return Array.from(views.values())
  }

  /**
   * 获取指定视图
   */
  getView(viewId: string): ViewState | undefined {
    const views = this.getAllViews()
    return views.find(v => v.id === viewId)
  }

  /**
   * 激活视图
   */
  activateView(viewId: string): void {
    if (this.getView(viewId)) {
      this.config.activeViewId = viewId
      this.notifyChange({ type: 'activate', viewId, layout: this.config })
    }
  }

  /**
   * 最小化/恢复视图
   */
  toggleMinimize(viewId: string): void {
    const node = this.findNode(this.config.root, viewId)
    if (node && node.type === 'view') {
      node.minimized = !node.minimized
      this.notifyChange({ type: 'resize', viewId, layout: this.config })
    }
  }

  /**
   * 查找视图节点
   */
  private findNode(node: LayoutNode, viewId: string): LayoutNode | null {
    if (node.type === 'view' && node.viewId === viewId) {
      return node
    }
    if (node.type === 'split' && node.children) {
      for (const child of node.children) {
        const result = this.findNode(child, viewId)
        if (result) return result
      }
    }
    return null
  }

  /**
   * 更新分割比例
   */
  updateRatio(nodeId: string, ratio: number): boolean {
    const node = this.findNode(this.config.root, nodeId)
    if (node && node.type === 'split') {
      node.ratio = Math.max(0.1, Math.min(0.9, ratio))
      this.notifyChange({ type: 'resize', nodeId, layout: this.config })
      return true
    }
    return false
  }

  /**
   * 导出为 JSON（用于持久化）
   */
  toJSON(): string {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * 从 JSON 导入（用于恢复）
   */
  static fromJSON(json: string): LayoutManager {
    const config = JSON.parse(json) as LayoutConfig
    return new LayoutManager(config)
  }

  /**
   * 订阅布局变更事件
   */
  onLayoutChange(callback: (event: LayoutChangeEvent) => void): () => void {
    this.changeListeners.add(callback)
    return () => this.changeListeners.delete(callback)
  }

  /**
   * 通知变更
   */
  private notifyChange(event: LayoutChangeEvent): void {
    this.changeListeners.forEach(callback => callback(event))
  }
}
