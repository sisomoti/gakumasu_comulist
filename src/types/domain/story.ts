/**
 * Story（ストーリー）の基底型
 *
 * 将来の拡張用（親愛度コミュ、育成シナリオ、初星コミュ、イベントコミュなど）
 */
export interface Story {
  /** ストーリーのユニークID */
  id: string
}

/**
 * ProduceCardStory（プロデュース・カード・ストーリー）
 *
 * ProduceCardに紐づくストーリー。
 */
export interface ProduceCardStory extends Story {
  /** 紐づくProduceCardのID */
  produceCardId: string

  /** ストーリーのインデックス（1, 2, 3） */
  storyIndex: number
}

/**
 * SupportCardStory（サポート・カード・ストーリー）
 *
 * SupportCardに紐づくストーリー。
 */
export interface SupportCardStory extends Story {
  /** 紐づくSupportCardのID */
  supportCardId: string

  /** ストーリーのインデックス（1, 2, 3） */
  storyIndex: number
}
