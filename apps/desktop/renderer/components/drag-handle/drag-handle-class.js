/**
 * 单个拖拽分割条类
 */
export class DragHandle {
  constructor(nodeId, direction, bounds, options = {}) {
    this.nodeId = nodeId
    this.direction = direction // 'horizontal' | 'vertical'
    this.bounds = bounds
    this.options = {
      minSize: options.minSize || 100,
      onDragStart: options.onDragStart,
      onDrag: options.onDrag,
      onDragEnd: options.onDragEnd
    }

    this.isDragging = false
    this.startPos = { x: 0, y: 0 }
    this.startBounds = null

    this.element = this._createElement()
    this._attachEvents()
  }

  /**
   * 创建 DOM 元素
   */
  _createElement() {
    const container = document.createElement('div')
    container.className = `drag-handle-container ${this.direction}`
    container.style.left = `${this.bounds.x}px`
    container.style.top = `${this.bounds.y}px`
    container.style.width = this.direction === 'horizontal' ? `${this.bounds.width}px` : '100%'
    container.style.height = this.direction === 'vertical' ? `${this.bounds.height}px` : '100%'

    // 分割条手柄
    const handle = document.createElement('div')
    handle.className = 'drag-handle'
    container.appendChild(handle)

    // 中心点提示
    const center = document.createElement('div')
    center.className = 'drag-handle-center'
    handle.appendChild(center)

    return container
  }

  /**
   * 附加事件监听
   */
  _attachEvents() {
    this.element.addEventListener('mousedown', this._handleMouseDown.bind(this))
    this.element.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false })
  }

  /**
   * 处理鼠标按下
   */
  _handleMouseDown(e) {
    if (e.button !== 0) return // 只响应左键
    e.preventDefault()
    this._startDrag(e.clientX, e.clientY)

    // 添加全局事件监听
    document.addEventListener('mousemove', this._boundMouseMove)
    document.addEventListener('mouseup', this._boundMouseUp)
  }

  /**
   * 处理触摸开始
   */
  _handleTouchStart(e) {
    e.preventDefault()
    const touch = e.touches[0]
    this._startDrag(touch.clientX, touch.clientY)

    // 添加全局事件监听
    document.addEventListener('touchmove', this._boundTouchMove, { passive: false })
    document.addEventListener('touchend', this._boundTouchEnd)
    document.addEventListener('touchcancel', this._boundTouchEnd)
  }

  /**
   * 开始拖拽
   */
  _startDrag(clientX, clientY) {
    this.isDragging = true
    this.startPos = { x: clientX, y: clientY }
    this.element.classList.add('dragging')

    // 触发回调
    if (this.options.onDragStart) {
      this.options.onDragStart({
        direction: this.direction,
        startPos: this.startPos
      })
    }
  }

  /**
   * 处理鼠标移动
   */
  _handleMouseMove = (e) => {
    if (!this.isDragging) return
    e.preventDefault()
    this._onDrag(e.clientX, e.clientY)
  }

  /**
   * 处理触摸移动
   */
  _handleTouchMove = (e) => {
    if (!this.isDragging) return
    e.preventDefault()
    const touch = e.touches[0]
    this._onDrag(touch.clientX, touch.clientY)
  }

  /**
   * 拖拽中
   */
  _onDrag(clientX, clientY) {
    const deltaX = clientX - this.startPos.x
    const deltaY = clientY - this.startPos.y

    if (this.options.onDrag) {
      this.options.onDrag({
        direction: this.direction,
        startPos: this.startPos,
        currentPos: { x: clientX, y: clientY },
        delta: { x: deltaX, y: deltaY }
      })
    }
  }

  /**
   * 处理鼠标释放
   */
  _handleMouseUp = (e) => {
    if (!this.isDragging) return
    this._endDrag(e.clientX, e.clientY)
  }

  /**
   * 处理触摸结束
   */
  _handleTouchEnd = (e) => {
    if (!this.isDragging) return
    // 使用最后已知的位置
    this._endDrag(this.startPos.x, this.startPos.y)
  }

  /**
   * 结束拖拽
   */
  _endDrag(clientX, clientY) {
    this.isDragging = false
    this.element.classList.remove('dragging')

    // 移除全局事件监听
    document.removeEventListener('mousemove', this._boundMouseMove)
    document.removeEventListener('mouseup', this._boundMouseUp)
    document.removeEventListener('touchmove', this._boundTouchMove)
    document.removeEventListener('touchend', this._boundTouchEnd)
    document.removeEventListener('touchcancel', this._boundTouchEnd)

    // 触发回调
    if (this.options.onDragEnd) {
      this.options.onDragEnd({
        direction: this.direction,
        startPos: this.startPos,
        endPos: { x: clientX, y: clientY }
      })
    }
  }

  /**
   * 更新位置
   */
  update(bounds) {
    this.bounds = bounds
    this.element.style.left = `${bounds.x}px`
    this.element.style.top = `${bounds.y}px`

    if (this.direction === 'horizontal') {
      this.element.style.width = `${bounds.width}px`
    } else {
      this.element.style.height = `${bounds.height}px`
    }
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}
