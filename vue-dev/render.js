import { ChildrenFlags, VNodeFlags } from './vnode.js'

function render(vnode, container) {
  const prevVNode = container.vnode
  if (prevVNode == null) {
    if (vnode) {
      mount(vnode, container)
      container.vnode = vnode
    }
  } else {
    if (vnode) {
      patch(prevVNode, vnode, container)
      container.vnode = vnode
    } else {
      container.removeChild(prevVNode.el)
      container.vnode = null
    }
  }
}

function mount(vnode, container, isSVG) {
  const { flags } = vnode
  if (flags & VNodeFlags.ELEMENT) {
    mountElemennt(vnode, container, isSVG)
  } else if (flags & VNodeFlags.COMPONENT) {
    mountComponent(vnode, container, isSVG)
  } else if (flags & VNodeFlags.TEXT) {
    mountText(vnode, container)
  } else if (flags & VNodeFlags.FRAGMENT) {
    mountFragment(vnode, container, isSVG)
  } else if (flags & VNodeFlags.PORTAL) {
    mountPortal(vnode, container, isSVG)
  }
}

function mountElemennt(vnode, container, isSVG) {
  const isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG
  const el = isSVG 
    ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
    : document.createElement(vnode.tag)
  vnode.el = el

  // 添加VNodedData
  //获取data
  const data = vnode.data
  if (data) {
    for (let key in data) {
      // key 可能是class style on 等
      switch(key) {
        case 'style':
          for(let k in data.style) {
            el.style[k] = data.style[k]
          }
          break;
        case 'class':
          el.className = data[key]
          break;
        default:
          break;
      }
    }
  }
  // 处理children
  // 拿到children和childrenFlags
  const childFlags = vnode.childFlags
  const children = vnode.children

  // 检测如果没有子节点则无需递归挂载
  if (childFlags !== ChildrenFlags.NO_CHILDREN) {
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
      // 如果是单个子节点则调用mount函数挂载
      mount(children, el, isSVG)
    } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
      for (let i = 0; i < children.length; i++) {
        mount(children[i], el, isSVG)
      }
    }
  }

  container.appendChild(el)
}

export default render
