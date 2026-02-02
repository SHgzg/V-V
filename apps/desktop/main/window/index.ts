import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { WindowManager } from '@v-v/window-manager'
import type { WindowDescriptor } from '@v-v/shared'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

  manager.create(windowDesc, loadURL)
}
