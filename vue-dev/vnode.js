const VNodeFlags = {
  // html 标签
  ELEMENT_HTML: 1,
  // svg 标签
  ELEMENT_SVG: 1 << 1,

  // 普通有状态组件
  COMPONENT_STATEFUL_NORMAL: 1 << 2,
  // 需要被keepAlive的有状态组件
  COMPONENT_STATEFUL_KEEP_ALIVE: 1 << 3,
  // 已经被keepAlive的有状态组件
  COMPONENT_STATEFUL_KEPT_ALIVE: 1 << 4,
  // 函数式组件
  COMPONENT_FUNTIONAL: 1 << 5,

  // 纯文本
  TEXT: 1 << 6,
  // Fragment
  FRAGMENT: 1 << 7,
  // Portal
  PORTAL: 1 << 8
}

//标签元素
VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG;

// 有状态组件
VNodeFlags.COMPONENT_STATEFUL = 
  VNodeFlags.COMPONENT_STATEFUL_NORMAL |
  VNodeFlags.COMPONENT_STATEFUL_KEEP_ALIVE |
  VNodeFlags.COMPONENT_STATEFUL_KEPT_ALIVE

// 组件
VNodeFlags.COMPONENT = VNodeFlags.COMPONENT_STATEFUL | VNodeFlags.COMPONENT_FUNTIONAL;


const ChildrenFlags = {
  // 未知的 children 类型
  UNKNOWN_CHILDREN: 0,
  // 没有 children
  NO_CHILDREN: 1,
  // children 是单个 VNode
  SINGLE_VNODE: 1 << 1,

  // children 是多个拥有 key 的 VNode
  KEYED_VNODES: 1 << 2,
  // children 是多个没有 key 的 VNode
  NONE_KEYED_VNODES: 1 << 3
}

ChildrenFlags.MULTIPLE_VNODES = 
  ChildrenFlags.KEYED_VNODES 
  | ChildrenFlags.NONE_KEYED_VNODES;

// export interface VNode {
//   _isVNode: true;
//   el: Element | null;
//   flags: VNodeFlags;
//   tag: string | FunctionalComponent | ComponentClass | null;
//   data: VNodeData | null;
//   children: VNodeChildren;
//   childFlags: ChildrenFlags;
// }

export { VNodeFlags, ChildrenFlags }