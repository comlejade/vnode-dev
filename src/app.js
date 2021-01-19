import { Fragment, h, Portal } from './h.js'
import render from './render.js'

const prevVNode = h('div', null, [
  h('p', {key: 'a'}, '节点1'),
  h('p', {key: 'b'}, '节点2'),
  h('p', {key: 'c'}, '节点3'),
])

const nextVNode = h('div', null, [
  h('p', { key: 'c' }, '节点3'),
  h('p', { key: 'a' }, '节点1'),
  h('p', { key: 'b' }, '节点2'),
])

render(prevVNode, document.getElementById('app'))

setTimeout(() => {
  render(nextVNode, document.getElementById('app'))
}, 2000)
