import { ChildrenFlags, VNodeFlags } from "./flags.js"
import { mount } from "./mount.js"

export function patch(prevVNode, nextVNode, container) {
  const nextFlags = nextVNode.flags
  const prevFlags = prevVNode.flags

  // 检查VNode类型是否相同，类型不同直接replace；类型相同，则根据不同类型调用不同函数
  if (prevFlags !== nextFlags) {
    replaceVNode(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.ELEMENT) {
    patchElement(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.COMPONENT) {
    patchComponent(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.TEXT) {
    patchText(prevVNode, nextVNode)
  } else if (nextFlags & VNodeFlags.FRAGMENT) {
    patchFragment(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.PORTAL) {
    patchPortal(prevVNode, nextVNode)
  }
}

function replaceVNode(prevVnode, nextVnode, container) {

  container.removeChild(prevVnode.el)

  mount(nextVnode, container)
}

function patchElement(prevVNode, nextVNode, container) {
  // 如果新旧VNode描述的是不同的标签，直接使用新的替换旧的
  if (prevVNode.tag !== nextVNode.tag) {
    replaceVNode(prevVNode, nextVNode, container)
    return
  }

  const el = (nextVNode.el = prevVNode.el)
  const prevData = prevVNode.data
  const nextData = nextVNode.data
  // 新的VNode存在时才有必要更新
  if (nextData) {
    for (let key in nextData) {
      const prevValue = prevData[key]
      const nextValue = nextData[key]
      patchData(el, key, prevValue, nextValue)
      
    }
  }

  if (prevData) {
    for(let key in prevData) {
      const prevValue = prevData[key]
      if (prevValue && !nextData.hasOwnProperty(key)) {
        patchData(el, key, prevValue, null)
      }
    }
  }

  // patchChildren 递归更新子节点
  patchChildren(
    prevVNode.childFlags,
    nextVNode.childFlags,
    prevVNode.children,
    nextVNode.children,
    el
  )
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

export function patchData(el, key, prevValue, nextValue) {
  switch(key) {
    case 'style':
      for (let k in nextValue) {
        el.style[k] = nextValue[k]
      }
      for(let k in prevValue) {
        if (!nextValue.hasOwnProperty(k)) {
          el.style[k] = ''
        }
      }
      break
    case 'class':
      el.className = classStringify(nextValue)
      break
    default: 
      if (key[0] === 'o' && key[1] === 'n') {
        if (prevValue) {
          el.removeEventListener(key.slice(2), prevValue)
        }
        if (nextValue) {
          el.addEventListener(key.slice(2), nextValue)
        }
      } else if (domPropsRE.test(key)) {
        el[key] = nextValue
      } else {
        el.setAttribute(key, value)
      }
  }
}

function patchChildren(prevChildFlags, nextChildFlags, prevChildren, nextChildren, container) {
  switch (prevChildFlags) {
    // 旧的 children 是单个子节点
    case ChildrenFlags.SINGLE_VNODE:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新的 children 也是单个子节点时，会执行该 case 语句块
          patch(prevChildren, nextChildren, container)
          break
        case ChildrenFlags.NO_CHILDREN:
          // 新的 children 中没有子节点时，会执行该 case 语句
          container.removeChild(prevChildren.el)
          break
        default:
          //  新的 children 有多个子节点
          // 移除旧的单个子节点
          container.removeChild(prevChildren.el)
          // 遍历新的多个子节点，逐个挂载到容器中
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break
      }
      break
    // 旧的 children 中没有子节点
    case ChildrenFlags.NO_CHILDREN:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新的 children 是单个子节点时
          mount(nextChildren, container)
          break
        case ChildrenFlags.NO_CHILDREN:
          // 新的 children 中没有子节点
          break
        default:
          // 新的 children 中有多个子节点
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break
      }
      break
    default:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新的 children 是单个子节点
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el)
          }
          mount(nextChildren, container)
          break
        case ChildrenFlags.NO_CHILDREN:
          // 新的 children 没有子节点
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el)
          }
          break
        default:
          // 新的 children 中有多个子节点
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el)
          }
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break
      }
  }
}

function patchText(prevVNode, nextVNode) {
  const el = (nextVNode.el = prevVNode.el)
  if (nextVNode.children !== prevVNode.children) {
    el.nodeValue = nextVNode.children
  }
}

function patchFragment(prevVNode, nextVNode, container) {
  patchChildren(
    prevVNode.childFlags, 
    nextVNode.childFlags, 
    prevVNode.children,
    nextVNode.children,
    container
  )

  switch (nextVNode.childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      nextVNode.el = nextVNode.children.el
      break
    case ChildrenFlags.NO_CHILDREN:
      nextVNode.el = prevVNode.el
    default:
      nextVNode.el = nextVNode.children[0].el
  }
}

function patchPortal(prevVNode, nextVNode) {
  patchChildren(
    prevVNode.childFlags,
    nextVNode.childFlags,
    prevVNode.children,
    nextVNode.children,
    prevVNode.tag
  )

  nextVNode.el = prevVNode.el

  // 如果新旧容器不同，需要搬运
  if (nextVNode.tag !== prevVNode.tag) {
    const container = typeof nextVNode.tag === 'string'
      ? document.querySelector(nextVNode.tag)
      : nextVNode.tag

    switch (nextVNode.childFlags) {
      case ChildrenFlags.SINGLE_VNODE:
        container.appendChild(nextVNode.children.el)
        break
      case ChildrenFlags.NO_CHILDREN:
        break
      default:
        for (let i = 0; i < nextVNode.children.length; i++) {
          container.appendChild(nextVNode.children[i].el)
        }
    }
  }
}