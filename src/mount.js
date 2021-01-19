import { ChildrenFlags, VNodeFlags } from './flags.js'
import { createTextVNode } from './h.js'
import { patch } from './patch.js'

export function mount(vnode, container, isSVG, refNode) {
  const { flags } = vnode
  if (flags & VNodeFlags.ELEMENT) {
    // 挂载普通标签
    mountElement(vnode, container, isSVG, refNode)
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
function mountElement(vnode, container, isSVG, refNode) {
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

  refNode ? container.insertBefore(el, refNode) : container.appendChild(el)
}

function mountText(vnode, container) {
  const el = document.createTextNode(vnode.children);
  vnode.el = el;
  container.appendChild(el)
}

function mountFragment(vnode, container, isSVG) {
  const { children, childFlags } = vnode;
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
  const instance = (vnode.children = new vnode.tag());

  instance.$props = vnode.data

  instance._update = function() {
    if (instance._mounted) {  // 检查 instance._mounted 是否初次加载
      // 如果为真则不是初次加载
      // 拿到旧的VNode
      const prevVNode = instance.$vnode
      // 重渲染新的VNode
      const nextVNode = (instance.$vnode = instance.render())
      // patch更新
      patch(prevVNode, nextVNode, prevVNode.el.parentNode)
      // 更新vnode.el 和 $el
      instance.$el = vnode.el = instance.$vnode.el
    } else {
      // 渲染VNode
      instance.$vnode = instance.render();
      // 挂载
      mount(instance.$vnode, container, isSVG);

      // 组件已挂载
      instance._mounted = true

      // el属性值和组件实例的$el属性都引用组件的根dom元素
      instance.$el = vnode.el = instance.$vnode.el;
      
      instance.mounted && instance.mounted()
    }
  }

  instance._update();
}

function mountFunctionalComponent(vnode, container, isSVG) {
  vnode.handle = {
    prev: null,
    next: vnode,
    container,
    update: () => {
      if (vnode.handle.prev) {
        // 更新
        const prevVNode = vnode.handle.prev
        const nextVNode = vnode.handle.next

        const prevTree = prevVNode.children
        const props = nextVNode.data
        const nextTree = (nextVNode.children = nextVNode.tag(props))

        patch(prevTree, nextTree, vnode.handle.container)
      } else {
        // 初次加载
        const props = vnode.data
        const $vonde = (vnode.children = vnode.tag(props)) 
        mount($vonde, container, isSVG)
        vnode.el = $vonde.el
      }
    }
  }

  vnode.handle.update()
}
