# rev-advice Worker

## Deploy手順
1. GitHubにアップロード
2. Cloudflare WorkersでImport from GitHub
3. Deploy

## 動作確認
GET:
https://your-worker-url

POST:
fetch("https://your-worker-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    race: {
      horses: [{ no: "5", name: "テスト馬" }]
    }
  })
})
