import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import { gitFs } from './fs.js'
import type { GitAuth } from './auth.js'

export async function cloneRepo(
  dir: string,
  url: string,
  branch: string,
  auth?: GitAuth
): Promise<void> {
  await git.clone({
    fs: gitFs,
    http,
    dir,
    url,
    ref: branch,
    singleBranch: true,
    depth: 1,
    onAuth: () => auth || {}
  })
}

export async function pullRepo(dir: string, auth?: GitAuth): Promise<void> {
  await git.pull({
    fs: gitFs,
    http,
    dir,
    singleBranch: true,
    onAuth: () => auth || {}
  })
}

export async function commitAll(dir: string, message: string): Promise<void> {
  const matrix = await git.statusMatrix({ fs: gitFs, dir })

  for (const [filepath, head, workdir] of matrix) {
    if (head !== workdir) {
      await git.add({ fs: gitFs, dir, filepath })
    }
  }

  await git.commit({
    fs: gitFs,
    dir,
    message,
    author: {
      name: 'PKM User',
      email: 'user@local'
    }
  })
}

export async function pushRepo(dir: string, auth?: GitAuth): Promise<void> {
  await git.push({
    fs: gitFs,
    http,
    dir,
    onAuth: () => auth || {}
  })
}

export async function diffFile(dir: string, filepath: string): Promise<string> {
  // isomorphic-git doesn't have a direct diff function, use WORKDIR to HEAD comparison
  const oid = await git.resolveRef({ fs: gitFs, dir, ref: 'HEAD' })
  const text = await git.readBlob({ fs: gitFs, dir, oid, filepath })
  return text.toString()
}

export async function getStatusMatrix(dir: string): Promise<Array<[string, number, number, number]>> {
  return await git.statusMatrix({ fs: gitFs, dir })
}
