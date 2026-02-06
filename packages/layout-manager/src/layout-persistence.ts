/**
 * 布局持久化管理器
 * 负责将布局配置保存到磁盘并从磁盘恢复
 */

import type { LayoutConfig } from './types.js'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export interface LayoutPersistenceOptions {
  storageDir?: string
  autoSave?: boolean
  maxBackups?: number
}

export class LayoutPersistence {
  private _storageDir: string | null = null
  private autoSave: boolean
  private maxBackups: number
  private saveTimer?: NodeJS.Timeout

  constructor(options: LayoutPersistenceOptions = {}) {
    this._storageDir = options.storageDir || null
    this.autoSave = options.autoSave ?? true
    this.maxBackups = options.maxBackups || 5
  }

  /**
   * 获取存储目录（延迟计算）
   */
  private get storageDir(): string {
    if (!this._storageDir) {
      this._storageDir = this.getDefaultStorageDir()
    }
    return this._storageDir
  }

  /**
   * 获取默认存储目录
   */
  private getDefaultStorageDir(): string {
    // 在 Electron 环境中使用 app.getPath('userData')
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
      try {
        const { app } = require('electron')
        return join(app.getPath('userData'), 'layouts')
      } catch {
        // Fallback
      }
    }
    // 开发环境 fallback
    const cwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.'
    return join(cwd, '.data', 'layouts')
  }

  /**
   * 确保存储目录存在
   */
  private async ensureDir(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true })
    } catch (error) {
      console.error('[LayoutPersistence] Failed to create directory:', error)
      throw error
    }
  }

  /**
   * 获取布局文件路径
   */
  private getLayoutPath(name: string): string {
    return join(this.storageDir, `${name}.json`)
  }

  /**
   * 获取备份文件路径
   */
  private getBackupPath(name: string, index: number): string {
    return join(this.storageDir, `${name}.backup.${index}.json`)
  }

  /**
   * 保存布局
   */
  async save(name: string, config: LayoutConfig): Promise<void> {
    try {
      await this.ensureDir()

      const path = this.getLayoutPath(name)
      const json = JSON.stringify(config, null, 2)

      // 创建备份
      await this.createBackup(name, config)

      // 保存新配置
      await fs.writeFile(path, json, 'utf-8')

      console.log(`[LayoutPersistence] Saved layout: ${name}`)
    } catch (error) {
      console.error('[LayoutPersistence] Failed to save layout:', error)
      throw error
    }
  }

  /**
   * 加载布局
   */
  async load(name: string): Promise<LayoutConfig | null> {
    try {
      await this.ensureDir()

      const path = this.getLayoutPath(name)

      try {
        const json = await fs.readFile(path, 'utf-8')
        const config = JSON.parse(json) as LayoutConfig
        console.log(`[LayoutPersistence] Loaded layout: ${name}`)
        return config
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          console.log(`[LayoutPersistence] Layout not found: ${name}`)
          return null
        }
        throw error
      }
    } catch (error) {
      console.error('[LayoutPersistence] Failed to load layout:', error)
      return null
    }
  }

  /**
   * 创建备份
   */
  private async createBackup(name: string, config: LayoutConfig): Promise<void> {
    try {
      // 检查当前备份数量
      const backups: number[] = []
      for (let i = 0; i < this.maxBackups; i++) {
        const path = this.getBackupPath(name, i)
        try {
          const stats = await fs.stat(path)
          backups.push(stats.mtimeMs)
        } catch {
          break
        }
      }

      // 如果达到最大备份数，删除最旧的
      if (backups.length >= this.maxBackups) {
        await fs.unlink(this.getBackupPath(name, this.maxBackups - 1))
      }

      // 移动现有备份
      for (let i = backups.length - 1; i >= 0; i--) {
        const oldPath = this.getBackupPath(name, i)
        const newPath = this.getBackupPath(name, i + 1)
        await fs.rename(oldPath, newPath)
      }

      // 创建新备份
      const backupPath = this.getBackupPath(name, 0)
      const json = JSON.stringify(config, null, 2)
      await fs.writeFile(backupPath, json, 'utf-8')
    } catch (error) {
      console.warn('[LayoutPersistence] Backup failed:', error)
    }
  }

  /**
   * 从备份恢复
   */
  async restoreBackup(name: string, backupIndex = 0): Promise<LayoutConfig | null> {
    try {
      const path = this.getBackupPath(name, backupIndex)
      const json = await fs.readFile(path, 'utf-8')
      return JSON.parse(json) as LayoutConfig
    } catch (error) {
      console.error('[LayoutPersistence] Failed to restore backup:', error)
      return null
    }
  }

  /**
   * 列出所有备份
   */
  async listBackups(name: string): Promise<Array<{ index: number; mtime: number }>> {
    try {
      const backups: Array<{ index: number; mtime: number }> = []

      for (let i = 0; i < this.maxBackups; i++) {
        const path = this.getBackupPath(name, i)
        try {
          const stats = await fs.stat(path)
          backups.push({ index: i, mtime: stats.mtimeMs })
        } catch {
          break
        }
      }

      return backups
    } catch (error) {
      console.error('[LayoutPersistence] Failed to list backups:', error)
      return []
    }
  }

  /**
   * 删除布局
   */
  async delete(name: string): Promise<void> {
    try {
      const path = this.getLayoutPath(name)
      await fs.unlink(path)
      console.log(`[LayoutPersistence] Deleted layout: ${name}`)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('[LayoutPersistence] Failed to delete layout:', error)
        throw error
      }
    }
  }

  /**
   * 列出所有布局
   */
  async list(): Promise<string[]> {
    try {
      await this.ensureDir()

      const files = await fs.readdir(this.storageDir)
      return files
        .filter(f => f.endsWith('.json') && !f.includes('.backup.'))
        .map(f => f.replace('.json', ''))
    } catch (error) {
      console.error('[LayoutPersistence] Failed to list layouts:', error)
      return []
    }
  }

  /**
   * 设置自动保存
   */
  setAutoSave(enabled: boolean): void {
    this.autoSave = enabled
  }

  /**
   * 延迟保存（防抖）
   */
  debouncedSave(name: string, config: LayoutConfig, delay = 1000): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    if (!this.autoSave) {
      return
    }

    this.saveTimer = setTimeout(() => {
      this.save(name, config).catch(error => {
        console.error('[LayoutPersistence] Auto-save failed:', error)
      })
    }, delay)
  }

  /**
   * 导出布局配置（不保存到磁盘）
   */
  export(name: string, config: LayoutConfig): string {
    const data = {
      name,
      version: '1.0.0',
      timestamp: Date.now(),
      config
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * 从字符串导入布局配置
   */
  import(json: string): { name?: string; config: LayoutConfig } | null {
    try {
      const data = JSON.parse(json)
      if (data.config) {
        return {
          name: data.name,
          config: data.config
        }
      }
      return null
    } catch (error) {
      console.error('[LayoutPersistence] Import failed:', error)
      return null
    }
  }
}
