import { Fragment, h, Portal } from './h.js'
import render from './render.js'

const prevVNode = h(Fragment, null, [
  h('p', null, '旧片段1'),
  h('div', null, '旧片段2')
])
const nextVNode = h(Fragment , null, [
  h('h1', null, '新片段1'),
  h('h2', null, '新片段2')
])

render(prevVNode, document.getElementById('app'))

setTimeout(() => {
  render(nextVNode, document.getElementById('app'))
}, 5000)
