# 学マス 未読コミュ管理システム開発計画（拡張版）

## プロジェクト概要

**プロジェクト名**: 学マス 未読コミュ管理（仮称）

学マス（学園アイドルマスター）のコミュニケーション（コミュ）ストーリーの読了/未読状態を管理するWebアプリケーション。ユーザーはブラウザやスマホでアクセスし、未読のストーリーを可視化して管理できる。

## アーキテクチャ概要

```
┌─────────────────────────────────────────┐
│  GitHub Pages (静的ホスティング)         │
│  ┌───────────────────────────────────┐  │
│  │  Vue.js 3 + TypeScript + Vite     │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ UI Layer (Components)        │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ Business Logic (Composables)│ │  │
│  │  │ - SOLID原則適用              │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ Data Layer (Services)        │ │  │
│  │  │ - インターフェース依存       │ │  │
│  │  └─────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
│         ↑ JSONファイル読み込み           │
│  ┌───────────────────────────────────┐  │
│  │  data/stories.json                │  │
│  │  (GitHub Actionsで自動更新)        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ↑ 自動更新
┌─────────────────────────────────────────┐
│  GitHub Actions (定期実行)                │
│  ┌───────────────────────────────────┐  │
│  │  Node.js + TypeScript              │  │
│  │  - Wikiスクレイピング              │  │
│  │  - カード情報抽出                   │  │
│  │  - JSONファイル生成                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 技術スタック

### フロントエンド
- **フレームワーク**: Vue.js 3 (Composition API)
- **言語**: TypeScript
- **ビルドツール**: Vite（高速な開発サーバー、最適化されたビルド）
- **テスト**: Vitest + Vue Test Utils（TDD対応）
- **スタイリング**: CSS Modules または Tailwind CSS（要検討）

### バックエンド（スクレイピング）
- **ランタイム**: Node.js
- **言語**: TypeScript
- **HTMLパース**: cheerio
- **HTTPクライアント**: node-fetch または axios

### インフラ
- **ホスティング**: GitHub Pages
- **CI/CD**: GitHub Actions
- **データ保存**: ローカルストレージ
- **パッケージ管理**: npm

## データ構造（拡張版）

### stories.json (GitHub Actionsで生成)
```typescript
interface StorySource {
  type: 'card' | 'event' | 'main' | 'custom'
  // カードに紐づく場合
  cardId?: string
  storyIndex?: number
  // イベントストーリー
  eventId?: string
  // メインストーリー
  chapterId?: string
  // カスタムストーリー
  category?: string
  customId?: string
}

interface Story {
  id: string                    // ユニークID
  name: string                  // ストーリー名
  source: StorySource           // ストーリーの出所
  metadata?: Record<string, any> // 拡張可能なメタデータ
}

interface Card {
  id: string                    // カード名（ユニーク）
  name: string                  // カード名
  type: 'produce' | 'support'
  rarity: 'SSR' | 'SR' | 'R'
  stories: Story[]              // カードに紐づくストーリー
}

interface StoriesData {
  version: string
  lastUpdated: string
  cards: Card[]
  stories: Story[]              // カードに紐づかないストーリー
}
```

### ローカルストレージ構造
```typescript
interface LocalStorageData {
  readStatus: Record<string, boolean>  // storyId -> readStatus
  customStories: Story[]               // 手動追加したストーリー
  lastSync: string
  settings?: {
    filterUnreadOnly?: boolean
    sortOrder?: 'name' | 'rarity' | 'type'
  }
}
```

## 実装ファイル構成

```
gakumasu_comulist/
├── .github/
│   └── workflows/
│       └── update-stories.yml          # GitHub Actions設定
├── scripts/
│   └── scrape-wiki.ts                 # Wikiスクレイピングスクリプト
├── src/
│   ├── components/                    # Vueコンポーネント
│   │   ├── StoryList.vue
│   │   ├── StoryCard.vue
│   │   ├── StoryItem.vue              # 個別ストーリー表示
│   │   ├── FilterPanel.vue
│   │   ├── ExportImport.vue
│   │   └── StoryForm.vue              # 手動ストーリー追加フォーム
│   ├── composables/                   # Composition API（ビジネスロジック）
│   │   ├── useStories.ts              # ストーリーデータ管理
│   │   ├── useReadStatus.ts           # 読了状態管理
│   │   └── useLocalStorage.ts         # ローカルストレージ管理
│   ├── services/                      # サービス層（SOLID原則適用）
│   │   ├── interfaces/
│   │   │   ├── IStorageService.ts     # ストレージインターフェース
│   │   │   ├── IStoryRepository.ts    # ストーリーリポジトリインターフェース
│   │   │   └── IExportService.ts      # エクスポートサービスインターフェース
│   │   ├── storage/
│   │   │   └── LocalStorageService.ts # ローカルストレージ実装
│   │   ├── repository/
│   │   │   └── StoryRepository.ts    # ストーリーリポジトリ実装
│   │   └── export/
│   │       └── ExportService.ts      # エクスポートサービス実装
│   ├── types/
│   │   └── index.ts                   # TypeScript型定義
│   ├── utils/
│   │   ├── parser.ts                  # Wiki HTMLパーサー
│   │   └── storyIdGenerator.ts        # ストーリーID生成
│   ├── __tests__/                     # テストファイル
│   │   ├── composables/
│   │   │   ├── useStories.test.ts
│   │   │   ├── useReadStatus.test.ts
│   │   │   └── useLocalStorage.test.ts
│   │   ├── services/
│   │   │   ├── LocalStorageService.test.ts
│   │   │   ├── StoryRepository.test.ts
│   │   │   └── ExportService.test.ts
│   │   └── utils/
│   │       └── parser.test.ts
│   ├── App.vue
│   └── main.ts
├── public/
│   └── data/
│       └── stories.json               # スクレイピング結果（Git管理）
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts                   # Vitest設定
└── README.md
```

## SOLID原則の適用

### Single Responsibility Principle (SRP)
- 各サービスクラスは単一の責任のみを持つ
- Composablesは特定の機能領域のみを担当
- コンポーネントは表示ロジックのみ

### Open/Closed Principle (OCP)
- ストーリーソースタイプは拡張可能な設計
- 新しいストーリータイプを追加しても既存コードを変更しない
- インターフェースベースの設計

### Liskov Substitution Principle (LSP)
- インターフェースの実装は置き換え可能
- ストレージサービスの実装を変更しても動作する

### Interface Segregation Principle (ISP)
- 小さなインターフェースに分割
- クライアントは必要なインターフェースのみに依存

### Dependency Inversion Principle (DIP)
- 高レベルモジュールは低レベルモジュールに依存しない
- インターフェースに依存し、実装は注入

## テスト駆動開発（TDD）の流れ

### 1. テストを先に書く（Red）
```typescript
// __tests__/composables/useReadStatus.test.ts
describe('useReadStatus', () => {
  it('should toggle read status', () => {
    const { toggleRead, isRead } = useReadStatus()
    expect(isRead('story-1')).toBe(false)
    toggleRead('story-1')
    expect(isRead('story-1')).toBe(true)
  })
})
```

### 2. 実装する（Green）
```typescript
// composables/useReadStatus.ts
export function useReadStatus() {
  // 最小限の実装
}
```

### 3. リファクタリング（Refactor）
- コードを改善
- テストが通ることを確認

## 段階的実装順序

### Phase 1: 基盤構築（1-3）
1. プロジェクト設定（Vite、TypeScript、Vitest）
2. 型定義（Story、Card、StorySource等）
3. テスト環境構築とサンプルテスト

### Phase 2: データ層（4-6）
4. ストレージサービスインターフェース定義（TDD）
5. ローカルストレージサービス実装（TDD）
6. ストーリーリポジトリ実装（TDD）

### Phase 3: ビジネスロジック層（7-9）
7. useLocalStorage composable（TDD）
8. useReadStatus composable（TDD）
9. useStories composable（TDD）

### Phase 4: スクレイピング（10-11）
10. Wikiスクレイピングスクリプト実装
11. GitHub Actions設定とテスト

### Phase 5: UI実装（12-15）
12. StoryItemコンポーネント（TDD）
13. StoryListコンポーネント（TDD）
14. FilterPanelコンポーネント（TDD）
15. StoryFormコンポーネント（手動追加用、TDD）

### Phase 6: エクスポート機能（16-17）
16. エクスポートサービス実装（TDD）
17. ExportImportコンポーネント（TDD）

### Phase 7: 統合・完成（18-19）
18. メインUI（App.vue）統合
19. 統合テストと動作確認

## コミット戦略

### 小さな単位でコミット
- 各Phaseの完了ごとにコミット
- テストが通る状態でコミット
- 機能追加は1つずつコミット

### コミットメッセージ例
```
feat: add Story type definitions
test: add useReadStatus composable tests
feat: implement useReadStatus composable
refactor: apply SOLID principles to storage service
```

## 主要機能

### 1. ストーリー一覧表示
- カードタイプ（プロデュース/サポート）で分類
- レアリティでフィルタリング
- カードに紐づかないストーリーも表示
- カード名で検索
- 未読のみ表示フィルター

### 2. 読了状態管理
- チェックボックスで読了/未読を切り替え
- ローカルストレージに自動保存
- 未読のみ表示フィルター

### 3. ストーリー追加機能
- 手動でストーリーを追加可能
- カードに紐づかないストーリーに対応
- カスタムカテゴリで分類可能

### 4. エクスポート/インポート
- JSON形式でエクスポート
- CSV形式でエクスポート
- JSON/CSVからインポート
- デバイス間でのデータ移行

### 5. 自動更新
- GitHub Actionsで1日1回Wikiページをスクレイピング
- 新しいカードを自動検出
- JSONファイルを自動更新

## Wikiスクレイピングロジック

### 対象ページ
1. プロデュースカード一覧: https://seesaawiki.jp/gakumasu/d/%a5%d7%a5%ed%a5%c7%a5%e5%a1%bc%a5%b9%a5%a2%a5%a4%a5%c9%a5%eb%b0%ec%cd%f7
2. サポートカード一覧: https://seesaawiki.jp/gakumasu/d/%a5%b5%a5%dd%a1%bc%a5%c8%a5%ab%a1%bc%a5%c9%b0%ec%cd%f7

### 処理フロー
1. 両方のページからHTMLを取得
2. テーブルからカード情報を抽出
3. カード名、レアリティ、タイプを判定
4. レアリティに応じてストーリー数を設定
   - プロデュース: SSR=3話、SR・R=0話
   - サポート: SSR=3話、SR・R=2話
5. ストーリーIDを生成（cardId-story-1形式）
6. JSONファイルを生成してコミット

## 設定ファイル

### GitHub Actions設定
- スケジュール: 1日1回（午前3時UTC）
- 手動実行も可能（workflow_dispatch）
- Node.js環境でスクレイピング実行
- タイムアウト: 10分

### Vite設定
- GitHub Pages用のbase path設定
- 静的アセットの最適化
- TypeScript設定

### Vitest設定
- Vue Test Utils統合
- カバレッジレポート
- ウォッチモード対応

## デプロイフロー

1. コードをGitHubにプッシュ
2. GitHub Actionsが自動実行（1日1回）
3. Wikiページをスクレイピング
4. stories.jsonを更新してコミット
5. GitHub Pagesで自動デプロイ

## 今後の拡張性

- 他のゲームへの対応（設定ファイルで切り替え）
- 複数のWikiページ対応
- ストーリーの詳細情報表示
- 統計情報（読了率など）
- ストーリーのタグ機能
- バックアップの自動化
