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
