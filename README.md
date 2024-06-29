# Websocket API with AWS CDK

This is a simple example of how to create a Websocket API with AWS CDK.

https://aws.amazon.com/jp/api-gateway/pricing/
https://aws.amazon.com/jp/sqs/pricing/
https://aws.amazon.com/jp/dynamodb/pricing/on-demand/
```
メッセージングコスト

月間メッセージ数 = (100 (送信) + 500 (受信)) * 1000 (ユーザー) * 30 (日) = 18,000,000

メッセージングコスト合計 = 18,000,000/1,000,000 * $1.00 (100 万件あたり) = 18 USD

接続コスト

月間接続時間 (分) = 1000 (ユーザー) * 12 (時間) * 60 (分) * 30 (日) = 21,600,000
接続コスト合計 = 21,600,000/1,000,000 * 0.25 (100 万分あたり単価) = 5.40 USD

総コスト = 18 USD (メッセージングコスト) + 5.40 USD (接続コスト) = 23.40 USD
```

## Useful commands for CDK

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
