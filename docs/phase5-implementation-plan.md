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

本計画書は [Phase5 疑問点と修正要望](phase5-questions-and-issues.md) を反映して修正した版である。

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

- 基本はすべての未読ストーリーを表示する。初期表示の件数制限は設けず、必要に応じて仮想スクロールを後から検討する。
- フィルターは「表示の絞り込み」のみとする。フィルターをかけただけでは計画済み扱いにしない。
- 「現在表示されているもので読みたい順を決める」ための明示的な操作（例: 「順序を編集」ボタン）を用意し、その操作で編集モードに入る。編集モードでランク付け・範囲選択（「ここまで」）・未計画への移動を行う。絞り込まれていないものは「未計画」セクションで分離表示する。
- ドラッグ&ドロップでランク付け、範囲選択（「ここまで」）。
- 自動ルール（おすすめ順）: 最初は簡単な1個だけ実装、今後の拡張。
  自動ルールが未設定の場合は適用しない。「簡単な1個」は Phase5 では1種類のみ実装
  （例: アイドル順 or レアリティ順のいずれか、要検討）。自動ルールの設定UI配置は
  Phase5 ではスコープ外とするか、設定画面のどこに置くか要検討。

### カンバン管理

- 未読・挑戦中・既読の3列
- 列の表示ON/OFF（折りたたみ）: 各列（特に「挑戦中」「既読」）の表示/非表示または折りたたみを切り替え可能にする。設定はローカルストレージに保存する。
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
  - `BacklogItem`: バックログアイテムの型。管理単位は拡張可能とする（参照ID＋種別を考慮した定義。Phase5ではストーリーのみ利用）
  - `BacklogFilter`: フィルター条件の型（表示の絞り込み専用。実装時確認: 既存の
    `StoryFilter`（`useStories`）と揃えるか、バックログ用に必要な項目だけ定義するか。
    候補: cardType, rarity, unreadOnly, idolIds, searchQuery など）
- [ ] `src/types/domain/index.ts` を更新してエクスポート

#### 5.1.2: ローカルストレージ構造の定義

- [ ] `src/types/storage.ts` を作成
  - `SprintStorage`: スプリント情報のストレージ構造（実装時確認: 「1つのアクティブな
    スプリントのみ」のため `{ activeSprint: Sprint | null }` を想定。履歴が必要なら別途検討）
  - `BacklogStorage`: バックログ情報のストレージ構造（本文「データ構造の詳細」を参照）
  - `KanbanStorage`: カンバン情報のストレージ構造（本文「データ構造の詳細」を参照）。列の表示ON/OFF設定をここに含めるか、別キーにするかは実装時確認
  - `ReadingPlanStorage`: スプリント・バックログ・カンバンの各ストレージをまとめる
    ルート構造（型定義用）。**保存キー方針は実装時確認**: 既存はキー別
    （`readStatus`, `cardOwnership` 等）のため、`sprint` / `backlog` / `kanban` の3キーで
    保存するか、1キー `readingPlan` にまとめるか選択する

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
  - フィルターパネル（表示の絞り込み専用。フィルター適用だけでは計画済みにしない）
  - 「順序を編集」等の明示的ボタンで編集モードに入る
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
- [ ] ランク付け機能（ドラッグ&ドロップ）。編集モード内で実施
- [ ] 未計画への移動機能（ドラッグ&ドロップ）
- [ ] 自動ルール適用（おすすめ順）: Phase5では1種類のみ実装。未設定時は適用しない。
      （実装時確認: その1種類を「アイドル順」と「レアリティ順」のどちらにするか選択。
      設定UI配置は Phase5 ではスコープ外とするか要検討）

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
- [ ] 列の表示/非表示または折りたたみの切り替え（設定はローカルストレージに保存）
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
- [ ] カンバン列の折りたたみのUX（アイコン、アニメーション等）
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

管理単位は拡張可能とする。Phase5ではストーリーのみ利用する。

```typescript
// 拡張を考慮: 将来は itemRef: { id: string, kind: 'story' | 'card' | ... }
// などを検討可能。Phase5では storyId でストーリーを参照する。
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

## 実装時確認する点（別チャットで実装する際のチェックリスト）

実装着手前に以下を決めておくと、一貫した実装がしやすい。不明点は本計画書の
「確定した設計方針」「データ構造の詳細」を優先し、既存コード
（`useStories`, `useReadStatus`, `useLocalStorage`）のパターンに合わせる。

### 5.1 データ構造

| 確認項目                 | 内容・候補                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| **BacklogFilter の型**   | 表示の絞り込み専用。既存                                                                    |
|                          | `StoryFilter`（`src/composables/useStories.ts`）を参考に、                                  |
|                          | cardType / rarity / unreadOnly / idolIds / searchQuery 等のうちバックログで必要な項目を     |
|                          | 定義する。`StoryFilter` の部分型にするか、別型で同じ構造にするか選択。                      |
| **SprintStorage の形**   | 「1つのアクティブなスプリントのみ」のため                                                   |
|                          | `{ activeSprint: Sprint または null }` を想定。履歴表示が必要なら別キーや配列を後から検討。 |
| **ストレージのキー方針** | 案A: `sprint`, `backlog`, `kanban` の3キーで保存（既存の                                    |
|                          | readStatus / cardOwnership と同様）。案B: 1キー `readingPlan` に                            |
|                          | `ReadingPlanStorage` を丸ごと保存。読み書きの単位・マイグレーションのしやすさで選択。       |
| **列の表示ON/OFF**       | カンバン列の折りたたみ設定を `KanbanStorage` に含めるか、                                   |
|                          | 別キー（例: `kanbanColumnVisibility`）にするか。                                            |

### 5.2〜5.4 Composables

- **未読ストーリーの取得**: バックログ・カンバンの対象は「未読ストーリー」。`useStories` の
  filteredStories（unreadOnly 等）と `useReadStatus` を組み合わせて未読一覧を取得する。
- **スプリント終了時**: 「終了」= アクティブスプリントの `isActive` を false にする処理でよいか。
  次スプリント開始時に上書きする想定か確認。
- **マージ時の重複**: スプリントへストーリーを追加（マージ）するとき、既に含まれる storyId は
  重複排除する。
- **「ここまで」の表現**: 範囲選択で「ここまで」を決めたとき、BacklogItem の `isPlanned` と
  `rank` で表現する（ランクで並べ、上位N件を計画済みとする等）。日数設定がある場合は「何日分」を
  保持するフィールドを BacklogStorage に持つか検討。

### 5.5〜5.7 UI・フロー

- **自動ルールの1種類**: Phase5 で実装する1種類を「アイドル順」か「レアリティ順」のどちらにするか
  選択。設定UIの配置はスコープ外でもよい。
- **スプリント開始の入口**: SprintSettings のみで開始するか、カンバン画面からも
  「バックログで選んだ範囲でスプリント開始」を実行できるようにするか。
- **読了との同期**: カンバンでストーリーを「既読」列に移動したら
  `useReadStatus.setRead(storyId, true)` を呼ぶ。逆に既読にしたストーリーが
  バックログ/カンバンに残る表示にするか、未読のみ表示とするかは仕様どおり
  「未読ストーリー」を前提にすればよい。

### 参照する既存コード

- ストレージ: `src/composables/useLocalStorage.ts`（get/set はキー単位）、
  `src/composables/useReadStatus.ts`（キー `readStatus`）
- フィルター・ストーリー一覧: `src/composables/useStories.ts`
  （`StoryFilter`, `filteredStories`, `setFilter`）
- 読了状態: `src/composables/useReadStatus.ts`（`isRead`, `setRead`, `toggleRead`）
- 型: `src/types/domain/`（Story, useStories の StoryFilter は
  composables 側で定義）

## 実装の注意点

1. **段階的な実装**: 各フェーズで動作確認とコミットを行う
2. **テスト駆動開発**: Composablesは必ずテストを書く
3. **型安全性**: TypeScriptの型を活用して型安全性を確保
4. **既存コードとの統合**: 既存の`useStories`、`useReadStatus`などと連携。カンバンで「既読」列に
   移動したストーリーは `useReadStatus.setRead(storyId, true)` で読了状態と同期する
5. **パフォーマンス**: 大量のストーリーに対応できるよう、
   必要に応じて仮想スクロールを検討
6. **モック・ワイヤーフレーム**: 別途作成せず、既存の Phase5 UI 引き継ぎ書を参照して
   実装する

## 次のステップ

Phase 5.1から順番に実装を開始する。各フェーズで動作確認とコミットを行い、段階的に
機能を追加していく。**別チャットで実装する場合は、上記「実装時確認する点」で方針を
決めてから着手すること。**

## 関連ドキュメント

- [Phase5 画面レイアウトの概要](phase5-ui-summary.md) - 概要 および
  初期段階の計画から引き継いだ資料
- [Phase5 疑問点と修正要望](phase5-questions-and-issues.md) - 計画書に対する疑問点と修正要望
