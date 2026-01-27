---
name: Phase5 UI実装計画
overview: Phase5のカンバン+バックログ機能を段階的に実装する計画。データ構造の定義から始め、Composables、UIコンポーネントの順で実装し、各段階で動作確認とコミットを行う。
todos:
  - id: phase5-1-1
    content: 型定義の追加（sprint.ts, backlog.ts, index.tsの更新）
    status: pending
  - id: phase5-1-2
    content: ローカルストレージ構造の定義（storage.ts）
    status: pending
    dependencies:
      - phase5-1-1
  - id: phase5-2-1
    content: スプリント管理のComposable実装（useSprint.ts）
    status: pending
    dependencies:
      - phase5-1-2
  - id: phase5-2-2
    content: スプリント管理のテスト（useSprint.test.ts）
    status: pending
    dependencies:
      - phase5-2-1
  - id: phase5-3-1
    content: バックログ管理のComposable実装（useBacklog.ts）
    status: pending
    dependencies:
      - phase5-1-2
  - id: phase5-3-2
    content: バックログ管理のテスト（useBacklog.test.ts）
    status: pending
    dependencies:
      - phase5-3-1
  - id: phase5-4-1
    content: カンバン管理のComposable実装（useKanban.ts）
    status: pending
    dependencies:
      - phase5-1-2
      - phase5-2-1
  - id: phase5-4-2
    content: カンバン管理のテスト（useKanban.test.ts）
    status: pending
    dependencies:
      - phase5-4-1
  - id: phase5-5-1
    content: バックログ画面の基本コンポーネント（BacklogView.vue, BacklogItem.vue, BacklogUnplannedSection.vue）
    status: pending
    dependencies:
      - phase5-3-1
  - id: phase5-5-2
    content: バックログ画面の機能実装（範囲選択、ランク付け、未計画への移動）
    status: pending
    dependencies:
      - phase5-5-1
  - id: phase5-6-1
    content: カンバン画面の基本コンポーネント（KanbanView.vue, KanbanColumn.vue, KanbanItem.vue, SprintPlanBar.vue）
    status: pending
    dependencies:
      - phase5-4-1
  - id: phase5-6-2
    content: カンバン画面の機能実装（列間移動、配分、フィルター）
    status: pending
    dependencies:
      - phase5-6-1
  - id: phase5-7-1
    content: スプリント設定UI（SprintSettings.vue）
    status: pending
    dependencies:
      - phase5-2-1
  - id: phase5-8-1
    content: App.vueの更新と統合
    status: pending
    dependencies:
      - phase5-5-2
      - phase5-6-2
      - phase5-7-1
  - id: phase5-8-2
    content: レスポンシブ対応とUI/UX調整
    status: pending
    dependencies:
      - phase5-8-1
---

# Phase5 UI実装計画: カンバン + バックログ機能

## 概要

スクラム開発の概念を取り入れたカンバン方式のUIを実装する。スプリント管理とバックログ管理により、未読ストーリーの消化を促進する。

## 確定した設計方針

### 画面構成

- **画面A: カンバン（進捗確認）**: 未読・挑戦中・既読の3列で表示
- **画面B: バックログ（読みたい順の設定）**: 読む順序を管理
- **ナビゲーション**: タブ切り替え（同一画面内で表示を切り替え）

### スプリント管理

- 1つのアクティブなスプリントのみ管理
- 継続型（期間が過ぎても継続、手動で切り替え）
- 目標期間: 1週間（7日）/ 2週間（14日）/ 1ヶ月（今月末）/ なし（無期限）
- 開始日・終了日を自由に設定可能
- 既存スプリントに追加可能（マージ）

### バックログ管理

- 基本はすべての未読ストーリーを表示
- フィルターで絞り込み、絞り込まれたものだけランク付け
- 絞り込まれていないものは「未計画」セクションで分離表示
- ドラッグ&ドロップでランク付け、範囲選択（「ここまで」）
- 自動ルール（おすすめ順）: 最初は簡単な1個だけ実装、今後の拡張

### カンバン管理

- 未読・挑戦中・既読の3列
- すべて手動で列間移動（ドラッグ&ドロップ）
- 既読はスプリントがアクティブな間はそのまま表示
- バックログで選択した範囲をすべて「未読」列に配分
- フィルター機能: 全アイテム表示、一致するものを強調表示

### データ保存

- すべてローカルストレージに保存
- 既存の`LocalStorageService`を使用

## 実装フェーズ

### Phase 5.1: データ構造の定義

#### 5.1.1: 型定義の追加

- [ ] `src/types/domain/sprint.ts` を作成
  - `SprintPeriod`: 目標期間の型（'1week' | '2weeks' | '1month' | 'none'）
  - `Sprint`: スプリント情報の型
  - `KanbanBucket`: カンバンの列（'unread' | 'in-progress' | 'read'）
  - `KanbanItem`: カンバンアイテムの型
- [ ] `src/types/domain/backlog.ts` を作成
  - `BacklogRank`: バックログのランク（数値）
  - `BacklogItem`: バックログアイテムの型
  - `BacklogFilter`: フィルター条件の型
- [ ] `src/types/domain/index.ts` を更新してエクスポート

#### 5.1.2: ローカルストレージ構造の定義

- [ ] `src/types/storage.ts` を作成
  - `SprintStorage`: スプリント情報のストレージ構造
  - `BacklogStorage`: バックログ情報のストレージ構造
  - `KanbanStorage`: カンバン情報のストレージ構造
  - `Phase5Storage`: Phase5全体のストレージ構造

**コミットポイント**: 型定義とストレージ構造の定義が完了した時点

---

### Phase 5.2: スプリント管理のComposable

#### 5.2.1: スプリント管理のComposable実装

- [ ] `src/composables/useSprint.ts` を作成
  - スプリントの取得・保存
  - スプリントの開始・終了
  - スプリントの更新（開始日・終了日・目標期間）
  - スプリントへのストーリー追加（マージ）
- [ ] `src/__tests__/composables/useSprint.test.ts` を作成
  - スプリントのCRUD操作のテスト
  - マージ機能のテスト

**コミットポイント**: スプリント管理のComposableとテストが完了した時点

---

### Phase 5.3: バックログ管理のComposable

#### 5.3.1: バックログ管理のComposable実装

- [ ] `src/composables/useBacklog.ts` を作成
  - バックログの取得・保存
  - ランク付け（ドラッグ&ドロップ対応）
  - フィルター機能
  - ソート機能
  - 範囲選択（「ここまで」の設定）
  - 未計画セクションへの移動
- [ ] `src/__tests__/composables/useBacklog.test.ts` を作成
  - ランク付けのテスト
  - フィルター・ソートのテスト

**コミットポイント**: バックログ管理のComposableとテストが完了した時点

---

### Phase 5.4: カンバン管理のComposable

#### 5.4.1: カンバン管理のComposable実装

- [ ] `src/composables/useKanban.ts` を作成
  - カンバンの取得・保存
  - 列間移動（ドラッグ&ドロップ対応）
  - バックログからの配分（「未読」列への追加）
  - フィルター機能（強調表示）
  - 進捗計算（既読数/総数）
- [ ] `src/__tests__/composables/useKanban.test.ts` を作成
  - 列間移動のテスト
  - 配分機能のテスト
  - 進捗計算のテスト

**コミットポイント**: カンバン管理のComposableとテストが完了した時点

---

### Phase 5.5: バックログ画面の基本実装

#### 5.5.1: バックログ画面のコンポーネント

- [ ] `src/components/BacklogView.vue` を作成
  - タブ切り替え（閲覧/編集モード）
  - ストーリーリストの表示
  - フィルターパネル
  - ソート機能
- [ ] `src/components/BacklogItem.vue` を作成
  - 個別ストーリーアイテムの表示
  - ドラッグ&ドロップ対応
- [ ] `src/components/BacklogUnplannedSection.vue` を作成
  - 未計画セクションの表示
  - ドロップターゲット

**コミットポイント**: バックログ画面の基本コンポーネントが完了した時点

#### 5.5.2: バックログ画面の機能実装

- [ ] 範囲選択機能（ドラッグで範囲選択、ハイライト+矢印表示）
- [ ] 「ここまで」の設定（日数設定、区切り線表示）
- [ ] ランク付け機能（ドラッグ&ドロップ）
- [ ] 未計画への移動機能（ドラッグ&ドロップ）
- [ ] 自動ルール適用（おすすめ順）: 最初は簡単な1個だけ

**コミットポイント**: バックログ画面の主要機能が完了した時点

---

### Phase 5.6: カンバン画面の基本実装

#### 5.6.1: カンバン画面のコンポーネント

- [ ] `src/components/KanbanView.vue` を作成
  - タブ切り替え（カンバン/バックログ）
  - カンバン列の表示
- [ ] `src/components/KanbanColumn.vue` を作成
  - 未読・挑戦中・既読の各列
  - ドロップターゲット
- [ ] `src/components/KanbanItem.vue` を作成
  - 個別ストーリーアイテムの表示
  - ドラッグ&ドロップ対応
- [ ] `src/components/SprintPlanBar.vue` を作成
  - スプリント情報の表示（期間、進捗、残り日数など）

**コミットポイント**: カンバン画面の基本コンポーネントが完了した時点

#### 5.6.2: カンバン画面の機能実装

- [ ] 列間移動機能（ドラッグ&ドロップ）
- [ ] バックログからの配分機能（「未読」列への追加）
- [ ] フィルター機能（強調表示）
- [ ] スプリント開始機能（バックログで範囲選択 → スプリント開始）

**コミットポイント**: カンバン画面の主要機能が完了した時点

---

### Phase 5.7: スプリント設定UI

#### 5.7.1: スプリント設定のコンポーネント

- [ ] `src/components/SprintSettings.vue` を作成
  - 目標期間の選択（1週間/2週間/1ヶ月/なし）
  - 開始日・終了日の設定（カレンダー）
  - スプリント開始ボタン

**コミットポイント**: スプリント設定UIが完了した時点

---

### Phase 5.8: 統合とUI調整

#### 5.8.1: App.vueの更新

- [ ] タブ切り替えの実装（カンバン/バックログ）
- [ ] 既存のコンポーネントとの統合

#### 5.8.2: レスポンシブ対応

- [ ] PCレイアウトの調整
- [ ] スマホレイアウトの調整

#### 5.8.3: UI/UXの調整

- [ ] ドラッグ&ドロップの視覚的フィードバック
- [ ] フィルター強調表示の実装
- [ ] エラーハンドリングとユーザーフィードバック

**コミットポイント**: 統合とUI調整が完了した時点

---

## データ構造の詳細

### スプリント情報

```typescript
interface Sprint {
  id: string
  startDate: string // ISO 8601形式
  endDate: string | null // ISO 8601形式、nullの場合は無期限
  targetPeriod: '1week' | '2weeks' | '1month' | 'none'
  isActive: boolean
  storyIds: string[] // スプリントに含まれるストーリーIDのリスト
}
```

### バックログ情報

```typescript
interface BacklogItem {
  storyId: string
  rank: number // ランク（小さいほど優先度が高い）
  isPlanned: boolean // 計画済みかどうか（falseの場合は未計画セクション）
}

interface BacklogStorage {
  items: BacklogItem[]
  filter: BacklogFilter
  lastUpdated: string
}
```

### カンバン情報

```typescript
interface KanbanItem {
  storyId: string
  bucket: 'unread' | 'in-progress' | 'read'
  order: number // 列内での順序
}

interface KanbanStorage {
  items: KanbanItem[]
  sprintId: string // 関連するスプリントID
  lastUpdated: string
}
```

## 実装の注意点

1. **段階的な実装**: 各フェーズで動作確認とコミットを行う
2. **テスト駆動開発**: Composablesは必ずテストを書く
3. **型安全性**: TypeScriptの型を活用して型安全性を確保
4. **既存コードとの統合**: 既存の`useStories`、`useReadStatus`などと連携
5. **パフォーマンス**: 大量のストーリーに対応できるよう、必要に応じて仮想スクロールを検討

## 次のステップ

Phase 5.1から順番に実装を開始する。各フェーズで動作確認とコミットを行い、段階的に機能を追加していく。

## 関連ドキュメント

- [Phase5 UI引き継ぎ書](phase5-ui-handoff.md) - UI設計の詳細
- [Phase5 疑問点と修正要望](phase5-questions-and-issues.md) - 計画書に対する疑問点と修正要望
