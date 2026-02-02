import type { GitRepository } from '../domain/repository.js'
import type { GitFileStatus } from '../domain/status.js'
import * as engine from '../engine/client.js'

export interface GitAuth {
  username?: string
  password?: string
}

export class GitService {
  constructor(private authProvider: () => GitAuth = () => ({})) {}

  async clone(repo: GitRepository): Promise<void> {
    await engine.cloneRepo(
      repo.workdir,
      repo.remote.url,
      repo.remote.branch,
      this.authProvider()
    )
  }

  async pull(repo: GitRepository): Promise<void> {
    await engine.pullRepo(repo.workdir, this.authProvider())
  }

  async status(repo: GitRepository): Promise<GitFileStatus[]> {
    const matrix = await engine.getStatusMatrix(repo.workdir)

    return matrix.map(([path, head, workdir]) => ({
      path,
      status:
        head === 0 && workdir > 0
          ? 'untracked'
          : head !== workdir
          ? 'modified'
          : 'unchanged'
    }))
  }

  async diff(repo: GitRepository, filepath: string): Promise<string> {
    return engine.diffFile(repo.workdir, filepath)
  }

  async commit(repo: GitRepository, message: string): Promise<void> {
    await engine.commitAll(repo.workdir, message)
  }

  async push(repo: GitRepository): Promise<void> {
    await engine.pushRepo(repo.workdir, this.authProvider())
  }
}
