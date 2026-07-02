import { renderToStaticMarkup } from 'react-dom/server'
import { App } from './App.jsx'

export function render(props) {
  return `<!DOCTYPE html>${renderToStaticMarkup(<App {...props} />)}`
}
