# Map Corrector - Fix wplace.live PBF Tiles

wplace.live で使用されている地図タイル（PBF形式）の破損や読み込みエラーを、正常な外部マップソースに動的に差し替えて修正する Userscript。

## Tampermonkey がある場合の導入方法
下のリンクをクリックしてインストールしてください。
[ワンクリックインストール](https://raw.githubusercontent.com/gold3112/Map_Corrector/main/dist/map-corrector.user.js)

## 機能

- **PBFタイルの動的置換**: `maps.wplace.live` の破損したタイルリクエストを検知し、自動的に `tile.openstreetmap.jp` などの正常なソースへリダイレクトします。
- **Web Worker インターセプト**: 地図エンジンが別スレッド（Worker）でタイルを取得しようとする動きを先回りしてフックします。
- **Style JSON パッチ**: 地図の設計図（Style JSON）をメモリ上で書き換え、データとスタイルの不整合によるクラッシュを防ぎます。
- **Service Worker ブロック**: 古いキャッシュや Service Worker による割り込みを阻止し、常にパッチ済みのリソースを読み込ませます。

## セットアップ

開発やビルドを行う場合は、以下のコマンドを実行してください。

```bash
npm install
npm run build
```

`dist/map-corrector.user.js` が生成されます。

## 使い方

1. Userscript マネージャー（Tampermonkey など）に `dist/map-corrector.user.js` をインストールします。
2. wplace.live を開きます。
3. 初回起動時に Service Worker の解除ログがコンソールに出る場合があります。その際はページを一度リロードしてください。
4. 地図が正常に（OpenStreetMap ベースで）表示されていれば成功です。

## 技術詳細

このスクリプトは以下の3層でリクエストをインターセプトします：
1. **Fetch/XHR Hook**: メインスレッドでのリクエストを奪取
2. **WebWorker Hook**: `URL.createObjectURL` をフックして Worker 内の通信を奪取
3. **JSON.parse Hook**: 通信経路を問わず、解析された瞬間のデータを書き換え
