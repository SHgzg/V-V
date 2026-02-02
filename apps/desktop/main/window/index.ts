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

  const isDev = process.env.NODE_ENV === 'development'
  const loadURL = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../renderer-host/index.html')}`

  manager.create(windowDesc, loadURL)
}
