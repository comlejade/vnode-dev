import { VNodeFlags } from "./flags"
import { mount } from "./mount"

export function patch(prevVNode, nextVNode, container) {
  const nextFlags = nextVNode.flags
  const prevFlags = prevVNode.flags

  // 检查VNode类型是否相同，类型不同直接replace；类型相同，则根据不同类型调用不同函数
  if (prevFlags !=== nextFlags) {
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