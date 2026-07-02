export function parseArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]

    if (!item.startsWith('--')) {
      continue
    }

    const rawKey = item.slice(2)
    const next = argv[index + 1]

    if (!next || next.startsWith('--')) {
      args[rawKey] = true
      continue
    }

    args[rawKey] = next
    index += 1
  }

  return args
}

export function required(args, key) {
  const value = args[key]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required argument: --${key}`)
  }

  return value.trim()
}
