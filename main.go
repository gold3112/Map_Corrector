package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
)

// 正常な外部マップソースのベースURL
// TODO: 実際の正常なタイルサーバーのURLに置き換えてください
const targetBaseURL = "https://tiles.example.com/planet/20250806_001001_pt/"

func handler(w http.ResponseWriter, r *http.Request) {
	// CORS設定
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		return
	}

	// パスから z/x/y.pbf を抽出
	// 元のURL例: /planet/20250806_001001_pt/8/222/98.pbf
	path := r.URL.Path
	if !strings.HasSuffix(path, ".pbf") {
		http.NotFound(w, r)
		return
	}

	// TODO: 外部ソースに合わせてパスを構築
	// 今回は単純に末尾の z/x/y.pbf の部分だけを利用する例
	parts := strings.Split(path, "/")
	if len(parts) < 4 {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}
	zxy := strings.Join(parts[len(parts)-3:], "/")
	
	targetURL := targetBaseURL + zxy
	log.Printf("Proxying: %s -> %s", path, targetURL)

	// 外部ソースへリクエスト
	resp, err := http.Get(targetURL)
	if err != nil {
		log.Printf("Error fetching from target: %v", err)
		http.Error(w, "failed to fetch from target", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// 外部ソースのステータスコードとヘッダーを転送
	w.WriteHeader(resp.StatusCode)
	if _, err := io.Copy(w, resp.Body); err != nil {
		log.Printf("Error copying body: %v", err)
	}
}

func main() {
	port := "8080"
	http.HandleFunc("/", handler)
	fmt.Printf("Map Corrector Proxy listening on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
