import { ipcMain } from 'electron'
import { GitService } from '@v-v/git-adapter'
import type { GitRepository } from '@v-v/git-adapter'

const gitService = new GitService(() => ({
  username: process.env.GIT_USERNAME,
  password: process.env.GIT_TOKEN
}))

export function registerGitIpc(): void {
  // Clone a repository
  ipcMain.handle('git:clone', async (_, repo: GitRepository) => {
    return await gitService.clone(repo)
  })

  // Pull changes from remote
  ipcMain.handle('git:pull', async (_, repo: GitRepository) => {
    return await gitService.pull(repo)
  })

  // Get repository status
  ipcMain.handle('git:status', async (_, repo: GitRepository) => {
    return await gitService.status(repo)
  })

  // Get file diff
  ipcMain.handle('git:diff', async (_, repo: GitRepository, filepath: string) => {
    return await gitService.diff(repo, filepath)
  })

  // Commit changes
  ipcMain.handle('git:commit', async (_, repo: GitRepository, message: string) => {
    return await gitService.commit(repo, message)
  })

  // Push changes to remote
  ipcMain.handle('git:push', async (_, repo: GitRepository) => {
    return await gitService.push(repo)
  })
}
