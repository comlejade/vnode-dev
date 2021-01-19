import { VNodeFlags, ChildrenFlags } from './flags.js';

// Fragment唯一标识
export const Fragment = Symbol();
export const Portal = Symbol();

export function h(tag, data=null, children=null) {
  let flags = null;
  if (typeof tag === 'string') {
    flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML
  } else if (tag === Fragment) {
    flags = VNodeFlags.FRAGMENT
  } else if (tag === Portal) {
    flags = VNodeFlags.PORTAL
    tag = data && data.target
  } else {
    if (tag !== null && typeof tag === 'object') {
      // 兼容vue2对象式组件
      flags = tag.functional
        ? VNodeFlags.COMPONENT_FUNTIONAL   //函数式组件
        : VNodeFlags.COMPONENT_STATEFUL_NORMAL   // 有状态组件
    } else if (typeof tag === 'function') {
      // vue3 类组件
      flags = tag.prototype && tag.prototype.render
        ? VNodeFlags.COMPONENT_STATEFUL_NORMAL   // 有状态组件
        : VNodeFlags.COMPONENT_FUNTIONAL         // 函数式组件
    }
  }

  let childFlags = null;
  if (Array.isArray(children)) {
    const { length } = children
    if (length === 0) {
      childFlags = ChildrenFlags.NO_CHILDREN
    } else if (length === 1) {
      childFlags = ChildrenFlags.SINGLE_VNODE
    } else {
      childFlags = ChildrenFlags.KEYED_VNODES
      children = normalizeVNodes(children)
    }
  } else if (children === null) {
    childFlags = ChildrenFlags.NO_CHILDREN
  } else if (children._isVNode) {
    childFlags = ChildrenFlags.SINGLE_VNODE
  } else {
    childFlags = ChildrenFlags.SINGLE_VNODE
    children = createTextVNode(children + '')
  }

  return {
    _isVNode: true,
    flags,
    tag,
    data,
    key: data && data.key ? data.key : null,
    children,
    childFlags,
    el: null
  }
}

export function createTextVNode(text) {
  return {
    _isVNode: true,
    flags: VNodeFlags.TEXT,
    tag: null,
    data: null,
    children: text,
    childFlags: ChildrenFlags.NO_CHILDREN,
    el: null
  }
}

function normalizeVNodes(children) {
  const newChildren = []

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.key == null) {
      child.key = '|' + i
    }
    newChildren.push(child)
  }
  
  return newChildren
}