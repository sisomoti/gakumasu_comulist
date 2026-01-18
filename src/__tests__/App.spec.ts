import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App.vue', () => {
  it('コンポーネントが正常にマウントされる', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
  })

  it('タイトルが正しく表示される', () => {
    const wrapper = mount(App)
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('学マス 未読コミュ管理')
  })

  it('Hello Worldメッセージが表示される', () => {
    const wrapper = mount(App)
    const p = wrapper.find('p')
    expect(p.exists()).toBe(true)
    expect(p.text()).toBe('Hello World from Vue 3 + TypeScript + Vite!')
  })
})
