# 学マス 未読コミュ管理システム開発計画

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
│  │  │ Presentation Layer           │ │  │
│  │  │ (Components)                 │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ Application Layer            │ │  │
│  │  │ (Composables)                │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ Domain Service Layer         │ │  │
│  │  │ (Business Rules)             │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ Domain Model Layer           │ │  │
│  │  │ (Entity Types)               │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ Data Acquisition Layer          │ │  │
│  │  │ (IDataSource)                │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ Data Access Layer            │ │  │
│  │  │ (Repository)                 │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ Infrastructure Layer         │ │  │
│  │  │ (Storage)                    │ │  │
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

詳細なレイヤー構成については、`docs/data-model.md`の「アーキテクチャレイヤーの詳細説明」セクションを参照してください。

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

## データ構造

### stories.json (GitHub Actionsで生成)

新設計に基づくデータ構造。詳細は`docs/data-model.md`を参照してください。

```typescript
// アイドル情報
interface Idol {
  id: string    // アイドルのユニークID
  name: string  // アイドルの名前
}

// レアリティ
type Rarity = 'SSR' | 'SR' | 'R'

// プロデュースカード
interface ProduceCard {
  id: string      // カードのユニークID
  name: string    // カード名
  idolId: string  // 対象となるアイドルのID（必須、1:1）
  rarity: Rarity  // レアリティ
}

// サポートカード
interface SupportCard {
  id: string            // カードのユニークID
  name: string          // カード名
  mainIdolId: string    // 主となるアイドルのID（必須、1:1）
  appearingIdolIds: string[]  // 登場人物として登場するアイドルのIDリスト（0..*）
  rarity: Rarity        // レアリティ
}

// プロデュースカードストーリー
interface ProduceCardStory {
  id: string          // ストーリーのユニークID
  produceCardId: string  // 紐づくProduceCardのID
  storyIndex: number  // ストーリーのインデックス（1, 2, 3）
}

// サポートカードストーリー
interface SupportCardStory {
  id: string          // ストーリーのユニークID
  supportCardId: string  // 紐づくSupportCardのID
  storyIndex: number  // ストーリーのインデックス（1, 2, 3）
}

// ストーリーデータの構造
interface StoriesData {
  version: string
  lastUpdated: string
  idols: Idol[]
  produceCards: ProduceCard[]
  supportCards: SupportCard[]
  produceCardStories: ProduceCardStory[]
  supportCardStories: SupportCardStory[]
}
```

### ビジネスルール（レアリティとストーリー数の関係）

- **ProduceCard**: SSR=3話、SR・R=0話
- **SupportCard**: SSR=3話、SR・R=2話

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
├── docs/
│   ├── game-overview.md                # ゲーム概要と用語の関係性
│   ├── data-model.md                   # データモデルの詳細
│   └── plan.md                         # 実装計画（本ファイル）
├── src/
│   ├── components/                     # Presentation Layer（UI Layer）
│   │   ├── StoryList.vue
│   │   ├── StoryCard.vue
│   │   ├── StoryItem.vue               # 個別ストーリー表示
│   │   ├── FilterPanel.vue
│   │   ├── ExportImport.vue
│   │   └── StoryForm.vue               # 手動ストーリー追加フォーム
│   ├── composables/                    # Application Layer
│   │   ├── useStories.ts               # ストーリーデータ管理
│   │   ├── useReadStatus.ts            # 読了状態管理
│   │   └── useLocalStorage.ts          # ローカルストレージ管理
│   ├── utils/
│   │   ├── domain/                     # Domain Service Layer
│   │   │   ├── storyCountCalculator.ts # レアリティとストーリー数の計算
│   │   │   └── cardValidator.ts        # カードデータの妥当性検証
│   │   ├── parser.ts                   # Wiki HTMLパーサー
│   │   └── storyIdGenerator.ts         # ストーリーID生成
│   ├── types/
│   │   ├── domain/                     # Domain Model Layer
│   │   │   ├── idol.ts                 # Idol エンティティ
│   │   │   ├── card.ts                 # IdolCard, ProduceCard, SupportCard
│   │   │   ├── story.ts                # Story, ProduceCardStory, SupportCardStory
│   │   │   ├── typeGuards.ts           # 型ガード関数
│   │   │   └── index.ts                # エクスポート
│   │   └── index.ts                    # TypeScript型定義
│   ├── services/
│   │   ├── data-source/                # Data Acquisition Layer
│   │   │   ├── IDataSource.ts          # データ取得インターフェース
│   │   │   ├── ScrapingDataSource.ts   # スクレイピング実装（案1）
│   │   │   └── ManualDataSource.ts     # 手動入力実装（案2）
│   │   ├── interfaces/
│   │   │   ├── IStorageService.ts      # ストレージインターフェース
│   │   │   ├── IStoryRepository.ts     # ストーリーリポジトリインターフェース
│   │   │   └── IExportService.ts       # エクスポートサービスインターフェース
│   │   ├── storage/                    # Infrastructure Layer
│   │   │   └── LocalStorageService.ts  # ローカルストレージ実装
│   │   ├── repository/                 # Data Access Layer
│   │   │   └── StoryRepository.ts      # ストーリーリポジトリ実装
│   │   └── export/                     # Infrastructure Layer
│   │       └── ExportService.ts        # エクスポートサービス実装
│   ├── __tests__/                      # テストファイル
│   │   ├── composables/
│   │   │   ├── useStories.test.ts
│   │   │   ├── useReadStatus.test.ts
│   │   │   └── useLocalStorage.test.ts
│   │   ├── services/
│   │   │   ├── LocalStorageService.test.ts
│   │   │   ├── StoryRepository.test.ts
│   │   │   └── ExportService.test.ts
│   │   ├── types/
│   │   │   └── domain/
│   │   │       └── typeGuards.test.ts
│   │   └── utils/
│   │       ├── domain/
│   │       │   ├── storyCountCalculator.test.ts
│   │       │   └── cardValidator.test.ts
│   │       └── parser.test.ts
│   ├── App.vue
│   └── main.ts
├── public/
│   └── data/
│       └── stories.json                # スクレイピング結果（Git管理）
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts                    # Vitest設定
└── README.md
```

## SOLID原則の適用

### Single Responsibility Principle (SRP)
- 各サービスクラスは単一の責任のみを持つ
- Composablesは特定の機能領域のみを担当
- コンポーネントは表示ロジックのみ

### Open/Closed Principle (OCP)
- エンティティタイプ（Idol、ProduceCard、SupportCard等）は拡張可能な設計
- 新しいストーリータイプ（ProduceCardStory、SupportCardStory）を追加しても既存コードを変更しない
- インターフェースベースの設計（IDataSource等）

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

### Phase 1: 基盤構築（完了）✓

1. ✓ プロジェクト設定（Vite、TypeScript、Vitest）
2. ✓ 型定義（新設計に基づく） - `src/types/domain/`
   - `idol.ts`: Idol エンティティ
   - `card.ts`: IdolCard, ProduceCard, SupportCard
   - `story.ts`: Story, ProduceCardStory, SupportCardStory
   - `typeGuards.ts`: 型ガード関数
3. ✓ テスト環境構築とサンプルテスト

### Phase 2: ドメイン層とデータ層（一部完了）

4. ✓ ストレージサービスインターフェース定義 - `src/services/interfaces/IStorageService.ts`
5. ✓ ローカルストレージサービス実装 - `src/services/storage/LocalStorageService.ts`
6. **⏳ ストーリーリポジトリ実装（TDD）** ← 次に実装
   - `src/services/repository/StoryRepository.ts`

**新設計による追加レイヤー（完了）:**

- ✓ **Domain Model Layer** (`src/types/domain/`)
  - ゲーム固有のエンティティと型定義
- ✓ **Domain Service Layer** (`src/utils/domain/`)
  - `storyCountCalculator.ts`: レアリティとストーリー数の計算
  - `cardValidator.ts`: カードデータの妥当性検証
- ✓ **Data Acquisition Layer** (`src/services/data-source/`)
  - `IDataSource.ts`: データ取得インターフェース定義

### Phase 3: ビジネスロジック層（Application Layer）

7. useLocalStorage composable（TDD） - `src/composables/useLocalStorage.ts`
8. useReadStatus composable（TDD） - `src/composables/useReadStatus.ts`
9. useStories composable（TDD） - `src/composables/useStories.ts`

### Phase 4: データ取得層の実装（Data Acquisition Layer）

10. IDataSource実装（ScrapingDataSource または ManualDataSource）
    - `src/services/data-source/ScrapingDataSource.ts`（案1）
    - `src/services/data-source/ManualDataSource.ts`（案2）
11. GitHub Actions設定とテスト

### Phase 5: UI実装（Presentation Layer）

12. StoryItemコンポーネント（TDD） - `src/components/StoryItem.vue`
13. StoryListコンポーネント（TDD） - `src/components/StoryList.vue`
14. FilterPanelコンポーネント（TDD） - `src/components/FilterPanel.vue`
15. StoryFormコンポーネント（手動追加用、TDD） - `src/components/StoryForm.vue`

### Phase 6: エクスポート機能

16. エクスポートサービス実装（TDD） - `src/services/export/ExportService.ts`
17. ExportImportコンポーネント（TDD） - `src/components/ExportImport.vue`

### Phase 7: 統合・完成

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
