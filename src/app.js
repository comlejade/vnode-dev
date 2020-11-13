import { Fragment, h, Portal } from './h.js'
import render from './render.js'

// class MyComponent {
//   render() {
//     return h(
//       'div',
//       {
//         style: {
//           background: 'green'
//         }
//       },
//       [
//         h('span', null, '我是组件的标题1...'),
//         h('span', null, '我是组件的标题2...')
//       ]
//     )
//   }
// }

// const compVnode = h(MyComponent)

function MyFunctionalComponent() {
  return h(
    'div',
    {
      style: {
        background: 'green'
      }
    },
    [
      h('span', null, '我是组件的标题1....'),
      h('span', null, '我是组件的标题2....'),
    ]
  )
}

const compVnode = h(MyFunctionalComponent)

render(compVnode, document.getElementById('app'))
