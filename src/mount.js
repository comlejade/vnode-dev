import { ChildrenFlags, VNodeFlags } from './flags.js'
import { createTextVNode } from './h.js'

export function mount(vnode, container, isSVG) {
  const { flags } = vnode
  if (flags & VNodeFlags.ELEMENT) {
    // 挂载普通标签
    mountElement(vnode, container, isSVG)
  } else if (flags & VNodeFlags.COMPONENT) {
    // 挂在组件
    mountComponent(vnode, container, isSVG)
  } else if (flags & VNodeFlags.TEXT) {
    // 挂载纯文本
    mountText(vnode, container)
  } else if (flags & VNodeFlags.FRAGMENT) {
    // 挂载 Fragment
    mountFragment(vnode, container, isSVG)
  } else if (flags & VNodeFlags.PORTAL) {
    // 挂载 Portal
    mountPortal(vnode, container, isSVG)
  }
}

function classStringify(cls) {
  if (cls && typeof cls === "object") {
    if (Array.isArray(cls)) {
      return cls.toString().replace(/\,/g, " ");
    } else {
      let res = '';
      for (let key in cls) {
        if (cls[key]) {
          res += `${key} `
        }
      }
      return res.trim()
    }
  } else if (cls && typeof cls === "string") {
    return cls
  }
}

const domPropsRE = /[A-Z]|^(?:value|chcked|selected|muted)$/
function mountElement(vnode, container, isSVG) {
  isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG
  const el = isSVG 
    ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
    : document.createElement(vnode.tag)
  vnode.el = el

  // 添加VNodedData
  // 获取data
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
          el.className = classStringify(data[key])
          break;
        default:
          if (key[0] === 'o' && key[1] === 'n') {
            el.addEventListener(key.slice(2), data[key])
          } else if (domPropsRE.test(key)) {
            el[key] = data[key]
          } else {
            el.setAttribute(key, data[key])
          }
          break
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

function mountText(vnode, container) {
  const el = document.createTextNode(vnode.children);
  vnode.el = el;
  container.appendChild(el)
}

function mountFragment(vnode, container, isSVG) {
  console.log('挂载 fragment')
  const { children, childFlags } = vnode;
  console.log(children, childFlags)
  switch(childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      // 如果children是单个子节点，直接挂载
      mount(children, container, isSVG)
      vnode.el = children.el
      break
    case ChildrenFlags.NO_CHILDREN:
      // 如果没有子节点，相当于挂载空片段，会创建一个空的文本节点占位
      const placeholder = createTextVNode('')
      mountText(placeholder, container)
      vnode.el = placeholder.el
      break
    default:
      // 多个子节点，遍历挂载
      for (let i = 0; i < children.length; i++) {
        mount(children[i], container, isSVG)
      }
      vnode.el = children[0].el
  }
}

function mountPortal(vnode, container) {
  const { tag, children, childFlags } = vnode
  const target = typeof tag === 'string' ? document.querySelector(tag): tag
  if (childFlags & ChildrenFlags.SINGLE_VNODE) {
    console.log('single mount')
    mount(children, target)
  } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
    console.log('multiple mount', children, target)
    for (let i = 0; i < children.length; i++) {
      mount(children[i], target)
    }
  }

  const placeholder = createTextVNode('')
  mountText(placeholder, container)
  vnode.el = placeholder.el
}

function mountComponent(vnode, container, isSVG) {
  if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
    mountStatefulComponent(vnode, container, isSVG)
  } else {
    mountFunctionalComponent(vnode, container, isSVG)
  }
}

function mountStatefulComponent(vnode, container, isSVG) {
  const instance = new vnode.tag();
  instance.$vnode = instance.render();
  mount(instance.$vnode, container, isSVG);
  instance.$el = vnode.el = instance.$vnode.el;
}

function mountFunctionalComponent(vnode, container, isSVG) {
  const $vonde = vnode.tag()
  mount($vonde, container, isSVG)
  vnode.el = $vonde.el
}