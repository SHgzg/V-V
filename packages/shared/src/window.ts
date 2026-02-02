export type WindowType = 'main' | 'editor' | 'preview' | 'search' | 'settings'

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowDescriptor {
  id: string
  type: WindowType
  bounds: Rectangle
  isMaximized?: boolean
}
