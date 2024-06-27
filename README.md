# Websocket API with AWS CDK

This is a simple example of how to create a Websocket API with AWS CDK.

## Chart
``` mermaid
graph TB
    %% タイトル
    title[メッセージ処理フロー]

    %% クライアントコンポーネント
    subgraph Client[クライアントコンポーネント]
        Sender[Sender]
        Receiver[Receiver]
    end

    %% メッセージ処理システム
    MPS[メッセージ処理システム]

    %% AWS サービス
    subgraph AWS[AWS サービス]
        Lambda[Lambda Function]
        SQS[SQS]
        DB[(DynamoDB)]
    end

    %% フロー
    Sender -->|1. メッセージ送信| SQS
    SQS -->|2. イベントトリガー| MPS
    MPS -->|3. 関数呼び出し| Lambda
    Lambda <-->|4. データ保存/取得| DB
    MPS -->|5. 処理結果送信| Receiver

    %% スタイル
    classDef client fill:#b3d9ff,stroke:#333,stroke-width:2px;
    classDef mps fill:#ffb3d9,stroke:#333,stroke-width:2px;
    classDef aws fill:#ffd9b3,stroke:#333,stroke-width:2px;

    class Sender,Receiver client;
    class MPS mps;
    class Lambda,SQS,DB aws;

    %% 凡例
    style Client fill:#b3d9ff,stroke:#333,stroke-width:2px;
    style AWS fill:#ffd9b3,stroke:#333,stroke-width:2px;
```

## Useful commands for CDK

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
