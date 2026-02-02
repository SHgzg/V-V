export interface GitRepository {
  id: string
  name: string
  workdir: string
  remote: {
    url: string
    branch: string
  }
}

export type GitFileStatusType =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'untracked'
  | 'unchanged'

export interface GitFileStatus {
  path: string
  status: GitFileStatusType
}

export interface GitAuth {
  username?: string
  password?: string // token
}
