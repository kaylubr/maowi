import { lstatSync, symlinkSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '..', '..')
const linkPath = resolve(repoRoot, 'node_modules')

const linkExists = (() => {
  try {
    lstatSync(linkPath)
    return true
  } catch {
    return false
  }
})()

if (!linkExists) {
  symlinkSync(relative(repoRoot, resolve(packageRoot, 'node_modules')), linkPath, 'dir')
  console.log(`Linked ${linkPath} -> src/ui/node_modules for root tests/ resolution`)
}
