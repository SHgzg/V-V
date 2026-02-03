import path from 'node:path'
import type { WindowManager } from '@v-v/window-manager'
import type { WindowDescriptor } from '@v-v/shared'

declare const __dirname: string

export function createMainWindow(
  manager: WindowManager,
  desc?: Partial<WindowDescriptor>
): void {
  const defaultDesc: WindowDescriptor = {
    id: 'main',
    type: 'main',
    bounds: {
      x: 100,
      y: 100,
      width: 1200,
      height: 800
    },
    isMaximized: false
  }

  const windowDesc = { ...defaultDesc, ...desc }

  // Load HTML file directly
  const htmlPath = path.join(__dirname, '../../renderer/index.html')
  const loadURL = `file://${htmlPath}`

  // 预加载脚本路径
  const preloadPath = path.join(__dirname, '../preload/index.js')

  manager.create(windowDesc, loadURL, preloadPath)
}
