/**
 * 拖拽分割条组件
 * 处理面板之间的拖拽调整
 */

import { DragHandle } from './drag-handle-class.js'

/**
 * 拖拽管理器
 * 管理所有分割条的创建和交互
 */
export class DragHandleManager {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId)
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`)
    }

    this.options = {
      onDragStart: options.onDragStart,
      onDrag: options.onDrag,
      onDragEnd: options.onDragEnd,
      minSize: options.minSize || 100,
      ...options
    }

    this.handles = new Map() // nodeId -> DragHandle
    this.isDragging = false
    this.dragOverlay = null

    this._createDragOverlay()
  }

  /**
   * 创建拖拽遮罩层
   */
  _createDragOverlay() {
    this.dragOverlay = document.createElement('div')
    this.dragOverlay.className = 'drag-overlay'
    this.dragOverlay.style.display = 'none'
    document.body.appendChild(this.dragOverlay)
  }

  /**
   * 创建分割条
   */
  createHandle(nodeId, direction, bounds) {
    const handle = new DragHandle(nodeId, direction, bounds, {
      minSize: this.options.minSize,
      onDragStart: (data) => this._handleDragStart(nodeId, data),
      onDrag: (data) => this._handleDrag(nodeId, data),
      onDragEnd: (data) => this._handleDragEnd(nodeId, data)
    })

    this.handles.set(nodeId, handle)
    this.container.appendChild(handle.element)

    return handle
  }

  /**
   * 更新分割条位置
   */
  updateHandle(nodeId, bounds) {
    const handle = this.handles.get(nodeId)
    if (handle) {
      handle.update(bounds)
    }
  }

  /**
   * 移除分割条
   */
  removeHandle(nodeId) {
    const handle = this.handles.get(nodeId)
    if (handle) {
      handle.destroy()
      this.handles.delete(nodeId)
    }
  }

  /**
   * 清空所有分割条
   */
  clear() {
    for (const handle of this.handles.values()) {
      handle.destroy()
    }
    this.handles.clear()
  }

  /**
   * 处理拖拽开始
   */
  _handleDragStart(nodeId, data) {
    this.isDragging = true
    this.dragOverlay.style.display = 'block'
    this.dragOverlay.className = `drag-overlay ${data.direction}`

    if (this.options.onDragStart) {
      this.options.onDragStart({ nodeId, ...data })
    }
  }

  /**
   * 处理拖拽中
   */
  _handleDrag(nodeId, data) {
    if (!this.isDragging) return

    if (this.options.onDrag) {
      this.options.onDrag({ nodeId, ...data })
    }
  }

  /**
   * 处理拖拽结束
   */
  _handleDragEnd(nodeId, data) {
    this.isDragging = false
    this.dragOverlay.style.display = 'none'

    if (this.options.onDragEnd) {
      this.options.onDragEnd({ nodeId, ...data })
    }
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.clear()
    if (this.dragOverlay && this.dragOverlay.parentNode) {
      this.dragOverlay.parentNode.removeChild(this.dragOverlay)
    }
  }
}

/**
 * 导出工厂函数
 */
export function createDragHandleManager(containerId, options) {
  return new DragHandleManager(containerId, options)
}
