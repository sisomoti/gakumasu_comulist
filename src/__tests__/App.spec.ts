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

  it('読み込みメッセージ・エラー・またはバックログ画面のいずれかが表示される', async () => {
    const wrapper = mount(App)
    await wrapper.vm.$nextTick()
    const p = wrapper.findAll('p')
    const backlogView = wrapper.findComponent({ name: 'BacklogView' })
    const hasLoadingOrError =
      p.length > 0 && (p[0].text().includes('読み込み中') || p[0].text().includes('読み込みに失敗'))
    expect(hasLoadingOrError || backlogView.exists()).toBe(true)
  })
})
