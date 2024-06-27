import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'node:path'

export class ApigwAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
    const appName = this.node.tryGetContext('appName')
    const stage = this.node.tryGetContext('stage') || 'dev'
    const certificate_arn = this.node.tryGetContext('certificateArn')

    // SQS queue definition
    const queue = new sqs.Queue(this, 'Queue', {
      queueName: `${appName}Queue`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(1),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    })

    // DynamoDB table definition
    const tableName = `connections`
    const connectionTable = new dynamodb.Table(this, 'ConnectionTable', {
      tableName: tableName,
      partitionKey: {
        name: 'connectionId',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
    })

    connectionTable.addGlobalSecondaryIndex({
      indexName: 'LocationIndex',
      partitionKey: {
        name: 'locationId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    // Lambda function definition
    const lambdaHandler = new NodejsFunction(this, 'Handler', {
      entry: path.join(__dirname, '../lambda/index.ts'),
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      functionName: `${appName}LambdaHandler`,
      memorySize: 512,
      handler: 'handler',
      environment: {
        TABLE_NAME: connectionTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      logGroup: new cdk.aws_logs.LogGroup(this, 'LogGroup', {
        logGroupName: `/aws/lambda/${appName}-${stage}-handler`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        retention: cdk.aws_logs.RetentionDays.ONE_DAY,
      }),
    })

    const sqsQueueLambdaHandler = new NodejsFunction(this, 'SQSQueueHandler', {
      functionName: `${appName}SQSQueueLambdaHandler`,
      entry: path.join(__dirname, '../lambda/queue-event.ts'),
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      handler: 'handler',
      environment: {
        WEBSOCKET_URL: 'https://socket.cristallum.io',
        TABLE_NAME: connectionTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      logGroup: new cdk.aws_logs.LogGroup(this, 'SQSLogGroup', {
        logGroupName: `/aws/lambda/${appName}-${stage}-sqs-queue-handler`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        retention: cdk.aws_logs.RetentionDays.ONE_DAY,
      }),
    })

    // Grant DynamoDB permissions to Lambda
    connectionTable.grantReadWriteData(lambdaHandler)
    connectionTable.grantReadWriteData(sqsQueueLambdaHandler)

    // Grant SQS permissions to Lambda
    queue.grantConsumeMessages(sqsQueueLambdaHandler)

    sqsQueueLambdaHandler.addEventSource(
      new cdk.aws_lambda_event_sources.SqsEventSource(queue, {
        batchSize: 1,
      }),
    )

    // WebSocket API definition
    const webSocketApi = new apigw.WebSocketApi(this, 'Api', {
      apiName: `${appName}Api`,
      description: `API for ${appName}`,
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('connect', lambdaHandler),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration('disconnect', lambdaHandler),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration('default', lambdaHandler),
      },
    })
    webSocketApi.grantManageConnections(lambdaHandler)

    const webSocketStage = new apigw.WebSocketStage(this, 'stage', {
      webSocketApi,
      stageName: stage,
      autoDeploy: true,
    })

    // Grant WebSocket API permissions to Lambda
    const apiPolicy = new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections', 'execute-api:Invoke'],
      effect: iam.Effect.ALLOW,
      resources: [`arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/${stage}/*`],
    })
    lambdaHandler.addToRolePolicy(apiPolicy)
    sqsQueueLambdaHandler.addToRolePolicy(apiPolicy)

    // Custom domain configuration
    const domainName = 'socket.cristallum.io'
    const certificateArn = certificate_arn as string
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn)

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'cristallum.io',
    })

    const domain = new apigw.DomainName(this, 'Domain', {
      domainName: domainName,
      certificate: certificate,
    })

    new apigw.ApiMapping(this, 'Mapping', {
      api: webSocketApi,
      domainName: domain,
      stage: webSocketStage,
    })

    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayv2DomainProperties(domain.regionalDomainName, domain.regionalHostedZoneId),
      ),
    })

    // Outputs
    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: webSocketApi.apiEndpoint,
      description: 'WebSocket API URL',
    })

    new cdk.CfnOutput(this, 'WebSocketApiCustomDomainUrl', {
      value: `wss://${domainName}`,
      description: 'WebSocket API Custom Domain URL',
    })

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: connectionTable.tableName,
      description: 'DynamoDB Table Name',
    })
  }
}
