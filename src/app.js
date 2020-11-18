import { Fragment, h, Portal } from './h.js'
import render from './render.js'

class ChildComponent {
  render() {
    return h('div', null, this.$props.text)
  }
}

class ParentComponent {
  localState = 'one'

  render() {
    return h(ChildComponent, {
      text: this.localState
    })
  }
}

const compVNode = h(ParentComponent)

render(compVNode, document.getElementById('app'))

// render(prevVNode, document.getElementById('app'))

// setTimeout(() => {
//   render(nextVNode, document.getElementById('app'))
// }, 5000)
