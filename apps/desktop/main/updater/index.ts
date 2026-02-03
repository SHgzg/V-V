/**
 * V-V PKM Desktop - Auto-Updater Module
 *
 * 遵循发布和部署规范 v1
 * 实现基于 GitHub Release 的自动更新机制
 */

import { autoUpdater, UpdateInfo } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// 自动更新配置
const AUTO_UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 4 // 每 4 小时检查一次

/**
 * 设置自动更新
 */
export function setupAutoUpdater(mainWindow: BrowserWindow | null) {
  if (!mainWindow) {
    console.warn('[Updater] No main window provided, auto-updater disabled')
    return
  }

  // 配置 autoUpdater
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  // 监听更新事件
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...')
    sendToWindow(mainWindow, 'update:checking')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log(`[Updater] Update available: ${info.version}`)
    sendToWindow(mainWindow, 'update:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log(`[Updater] No update available (current: ${info.version})`)
    sendToWindow(mainWindow, 'update:not-available', {
      version: info.version
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[Updater] Downloading: ${Math.round(progress.percent)}%`)
    sendToWindow(mainWindow, 'update:downloading', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log(`[Updater] Update downloaded: ${info.version}`)
    sendToWindow(mainWindow, 'update:downloaded', {
      version: info.version
    })
  })

  autoUpdater.on('error', (error: Error) => {
    console.error('[Updater] Update error:', error.message)
    sendToWindow(mainWindow, 'update:error', {
      message: error.message
    })
  })

  // 立即检查更新
  checkForUpdates(mainWindow)

  // 定期检查更新
  const intervalId = setInterval(() => {
    if (!mainWindow.isDestroyed()) {
      checkForUpdates(mainWindow)
    } else {
      clearInterval(intervalId)
    }
  }, AUTO_UPDATE_CHECK_INTERVAL)
}

/**
 * 检查更新
 */
export async function checkForUpdates(mainWindow: BrowserWindow | null) {
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    console.error('[Updater] Failed to check for updates:', error)
    if (mainWindow && !mainWindow.isDestroyed()) {
      sendToWindow(mainWindow, 'update:error', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * 下载并安装更新
 */
export async function downloadUpdate(mainWindow: BrowserWindow | null) {
  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    console.error('[Updater] Failed to download update:', error)
    if (mainWindow && !mainWindow.isDestroyed()) {
      sendToWindow(mainWindow, 'update:error', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * 安装更新并重启
 */
export function installAndRestart() {
  setImmediate(() => {
    autoUpdater.quitAndInstall()
  })
}

/**
 * 获取当前版本
 */
export function getCurrentVersion(): string {
  try {
    const packagePath = join(process.resourcesPath || '', 'app', 'package.json')
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return pkg.version
  } catch {
    return 'unknown'
  }
}

/**
 * 发送消息到渲染进程
 */
function sendToWindow(window: BrowserWindow, channel: string, data?: unknown) {
  if (window && !window.isDestroyed()) {
    window.webContents.send(channel, data)
  }
}
