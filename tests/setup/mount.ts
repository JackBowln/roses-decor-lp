import { defineComponent, h, type Component } from 'vue'
import { mount, type MountingOptions } from '@vue/test-utils'

export const NuxtLinkStub = defineComponent({
  name: 'NuxtLink',
  props: {
    to: {
      type: [String, Object],
      default: '',
    },
  },
  setup(props, { attrs, slots }) {
    return () => h('a', {
      ...attrs,
      href: typeof props.to === 'string' ? props.to : '#',
    }, slots.default?.())
  },
})

export const MotionStub = defineComponent({
  name: 'Motion',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.())
  },
})

export const AnimatePresenceStub = defineComponent({
  name: 'AnimatePresence',
  setup(_, { slots }) {
    return () => slots.default?.()
  },
})

export const mountWithApp = <T extends Component>(
  component: T,
  options: MountingOptions<any> = {},
) => {
  const global = options.global || {}

  return mount(component, {
    ...options,
    global: {
      ...global,
      stubs: {
        Teleport: true,
        ...(global.stubs || {}),
      },
      components: {
        NuxtLink: NuxtLinkStub,
        Motion: MotionStub,
        AnimatePresence: AnimatePresenceStub,
        ...(global.components || {}),
      },
    },
  })
}
