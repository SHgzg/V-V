export interface GitRepository {
  id: string
  name: string
  workdir: string
  remote: {
    url: string
    branch: string
  }
}
