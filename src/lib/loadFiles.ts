import { classifyPath, type ExportFiles } from './parse'

/**
 * Read user-selected files (a Letterboxd export ZIP and/or loose CSVs) into memory.
 * Everything happens locally; nothing is uploaded.
 */
export async function readExportFiles(fileList: Iterable<File>): Promise<ExportFiles> {
  const files: ExportFiles = {}
  for (const file of fileList) {
    if (file.name.toLowerCase().endsWith('.zip')) {
      const { default: JSZip } = await import('jszip')
      const zip = await JSZip.loadAsync(file)
      const reads = Object.values(zip.files)
        .filter((f) => !f.dir)
        .map(async (f) => {
          const kind = classifyPath(f.name)
          if (kind) files[kind] = await f.async('string')
        })
      await Promise.all(reads)
    } else {
      const kind = classifyPath(file.webkitRelativePath || file.name)
      if (kind) files[kind] = await file.text()
    }
  }
  return files
}
