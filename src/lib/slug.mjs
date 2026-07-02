export function slugify(input) {
  const normalized = String(input)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `post-${Date.now()}`
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function splitTags(value = '') {
  return String(value)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}
