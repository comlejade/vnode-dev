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
  // 如果被移除的VNode是组件，需要调用组件实例的unmounted钩子
  if (prevVnode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    const instance = prevVnode.children
    instance.unmounted && instance.unmounted()
  }

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
        el.setAttribute(key, nextValue)
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
          let j = 0;
          let preVNode = prevChildren[j];
          let nextVNode = nextChildren[j];
          let prevEnd = prevChildren.length - 1;
          let nextEnd = nextChildren.length - 1;
          outer: {
            // 从前向后遍历
            while(prevVNode.key === nextVNode.key) {
              patch(prevVNode, nextVNode, container);
              j++;
              if (j > prevEnd || j > nextEnd) {
                break outer
              }
              prevVNode = prevChildren[j];
              nextVNode = nextChildren[j];
            }

            prevVNode = prevChildren[prevEnd];
            nextVNode = nextChildren[nextEnd];
  
            // 从后向前遍历
            while(prevVNode.key === nextVNode.key) {
              patch(prevVNode, nextVNode, container);
              prevEnd--;
              nextEnd--;
              if (j > prevEnd || j > nextEnd) {
                break outer
              }
              prevVNode = prevChildren[prevEnd];
              nextVNode = nextChildren[nextEnd];
            }
          }

          // 对比j, prevEnd, nextEnd的值；nextEnd大，说明有新元素要加入；preEnd大，说明有旧元素要删除
          if (j > prevEnd && j <= nextEnd) {
            // nextEnd大，有新元素加入
            const nextPos = nextEnd + 1;
            const refNode = nextPos < nextChildren.length ? nextChildren[nextPos].el : null;

            while(j <= nextEnd) {
              mount(nextChildren[j++], container, false, refNode)
            }
          } else if (j > nextEnd) {
            // preVNode大说明需要移除元素
            while (j <= preVNode) {
              container.removeChild(prevChildren{j++}.el)
            }
          } else {
            const nextLeft = nextEnd - j + 1
            const source = []
            for (let i = 0; i < nextLeft; i++) {
                .push(-1)
            }
            const prevStart = j;
            const nextStart = j;
            let moved = false;
            let pos = 0;
            let patched = 0;
            // 构建索引表
            const keyIndex = {};
            for (let i = nextStart; i <= nextEnd; i++) {
              keyIndex[nextChildren[i].key] = i
            }
            
            for (let i = prevStart; i <= prevEnd; i++) {
              const prevVNode = prevChildren[i];

              if (patched < nextLeft) {
                const k = keyIndex[prevVNode.key];
  
                if (typeof k !== 'undefined') {
                  const nextVNode = nextChildren[k]
                  patch(prevVNode, nextVNode, container);
                  patched++
                  source[k - nextStart] = i
  
                  if (k < pos) {
                    moved = true
                  } else {
                    pos = k
                  }
                } else {
                  container.removeChild(prevVNode.el)
                }
                
              } else {
                container.removeChild(prevVNode.el)
              }
              if (moved) {
                const seq = lis(source)
                // j 指向最长递增子序列的最后一个值
                let j = seq.length - 1
                // 从后向前遍历新 children 中的剩余未处理节点
                for (let i = nextLeft - 1; i >= 0; i--) {
                  if (source[i] === -1) {
                    // 作为全新的节点挂载
                    // 该节点在新children中的真实位置索引
                    const pos = i + nextStart
                    const nextVNode = nextChildren[pos]
                    // 该节点点下一个节点的位置索引
                    const nextPos = pos + 1
                    mount(
                      nextVNode,
                      container,
                      false,
                      nextPos < nextChildren.length
                      ? nextChildren[nextPos].el
                      : null
                    )
                  } else if (i !== seq[i]) {
                    // 说明该节点需要移动
                    // 该节点在新children中的真实位置
                    const pos = i + nextStart
                    const nextVNode = nextChildren[pos]
                    // 该节点下一个节点的位置索引
                    const nextPos = pos + 1
                    // 移动
                    container.insertBefore(
                      nextVNode.el,
                      nextPos < nextChildren.length
                      ? nextChildren[nextPos].el
                      : null
                    )
                  } else {
                    j--
                  }
                }
              }
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

function patchComponent(prevVNode, nextVNode, container) {
  if (nextVNode.tag !== prevVNode.tag) {  // 判断是否是相同组件
    replaceVNode(prevVNode, nextVNode, container)
  }
  // 检查组件是否是有状态组件
   else if (nextVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    // 获取组件实例
    const instance = (nextVNode.children = prevVNode.children)
    // 更新props
    instance.$props = nextVNode.data
    // 更新组件
    instance._update()
  } else {
    // 更新函数式组件
    // 通过 prevVNode.handle 拿到 handle 对象
    const handle = (nextVNode.handle = prevVNode.handle)
    // 更新 handle 对象
    handle.prev = prevVNode
    handle.next = nextVNode
    handle.container = container

    handle.update();
  }
}

function lis(seq) {
  const valueToMax = {}
  let len = seq.length
  for (let i = 0; i < len; i++) {
    valueToMax[seq[i]] = 1
  }

  let i = len - 1
  let last = seq[i]
  let prev = seq[i - 1]
  while (typeof prev !== 'undefined') {
    let j = 1
    while (j < len) {
      last = seq[j]
      if (prev < last) {
        const currentMax = valueToMax[last] + 1
        valueToMax[prev] = valueToMax[prev] !== 1
        ? valueToMax[prev] > currentMax
          ? valueToMax[prev]
          : currentMax
        : currentMax
      }
      j++
    }
    i--
    last = seq[i]
    prev = seq[i - 1]

  }

  const lis = []
  i = 1
  while (--len >= 0) {
    const n = seq[len]
    if (valueToMax[n] === i) {
      i++
      lis.unshift(len)
    }
  }
  return lis
}