import { h } from './h.js'
import render from './render.js'

const elementVnode = h(
  'div', 
  {
    style: {
      height: '100px',
      width: '100px',
      background: 'red'
    }
  }, 
  h('div', {
    style: {
      height: '50px',
      width: '50px',
      background: 'green'
    }
  },
  h('div', {
    style: {
      height: '20px',
      width: '20px',
      background: 'yellow'
    }
  }))
)

render(elementVnode, document.getElementById('app'))