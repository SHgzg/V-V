/**
 * V-V PKM Desktop - 多面板布局管理器
 *
 * VSCode 风格的可拖拽分屏布局系统
 * 支持水平/垂直分割、嵌套布局、Tab 管理和持久化
 */

export type SplitDirection = 'horizontal' | 'vertical'

/**
 * 布局节点类型
 * - split: 分割节点，包含子节点
 * - view: 视图节点，包含实际的 BrowserView
 */
export interface LayoutNode {
  id: string
  type: 'split' | 'view'
  direction?: SplitDirection
  ratio?: number  // 分割比例（0-1），左/上节点的占比
  children?: LayoutNode[]  // type='split' 时的子节点
  viewId?: string  // type='view' 时的 BrowserView ID
  title?: string  // 视图标题
  icon?: string   // 视图图标
  minimized?: boolean  // 是否最小化
  url?: string    // 视图加载的 URL
}

/**
 * 分割条配置
 */
export interface SplitHandle {
  nodeId: string  // 对应的 split 节点 ID
  direction: SplitDirection
  ratio: number  // 当前分割比例
  bounds: Rectangle  // 分割条的位置和大小
}

/**
 * 矩形区域
 */
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  root: LayoutNode
  activeViewId?: string  // 当前激活的视图 ID
}

/**
 * 视图状态
 */
export interface ViewState {
  id: string
  title: string
  icon?: string
  url: string
  bounds: Rectangle
  isActive: boolean
  isMinimized: boolean
}

/**
 * 布局变更事件
 */
export interface LayoutChangeEvent {
  type: 'add' | 'remove' | 'split' | 'merge' | 'resize' | 'activate'
  nodeId?: string
  viewId?: string
  layout: LayoutConfig
}
