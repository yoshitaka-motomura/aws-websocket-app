import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Function } from 'aws-cdk-lib/aws-lambda'
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from "node:path";

export class ApigwAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const appName = this.node.tryGetContext('appName');
    const stage = this.node.tryGetContext('stage') || 'dev';
    const certificate_arn = this.node.tryGetContext('certificateArn');

    // dynamodb table definition
    const connectionTable = new dynamodb.Table(this, 'ConnectionTable', {
      tableName: 'connections',
        partitionKey: {
            name: 'connectionId',
            type: dynamodb.AttributeType.STRING
        },
        sortKey: {
            name: 'location_id',
            type: dynamodb.AttributeType.STRING
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    })

    connectionTable.addGlobalSecondaryIndex({
        indexName: 'locationIndex',
        partitionKey: {
          name: 'location_id',
          type: dynamodb.AttributeType.STRING
        }
    })

    // lambda function definition
    const lambdaHandler = new Function(this, 'ConnectFunction', {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_12,
      handler: 'app.lambda_handler',
      code: cdk.aws_lambda.Code.fromAsset(path.join(__dirname, '../lambda/')),
      functionName: `${appName}WebSocketsFunction`,
        logGroup: new cdk.aws_logs.LogGroup(this, 'LogGroup', {
            logGroupName: `/aws/lambda/${appName}WebSocketsFunction`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        })
    })

    lambdaHandler.addEnvironment('TABLE_NAME', connectionTable.tableName)
    connectionTable.grantFullAccess(lambdaHandler)


    // lambda function definition
    const webSocketApi = new apigw.WebSocketApi(this, 'Api', {
      apiName: `${appName}Api`,
      description: `API for ${appName}`,
      connectRouteOptions: {
          integration: new WebSocketLambdaIntegration('connect', lambdaHandler)
      },
      disconnectRouteOptions: {
          integration: new WebSocketLambdaIntegration('disconnect', lambdaHandler)
      },
      defaultRouteOptions: {
          integration: new WebSocketLambdaIntegration('default', lambdaHandler)
      }
    })
    const webSocketStage = new apigw.WebSocketStage(this, 'stage', {
      webSocketApi,
      stageName: stage,
      autoDeploy: true
    })

    const domainName = 'socket.cristallum.io'
    const certificateArn = certificate_arn as string
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      certificateArn
    );

   const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
    domainName: 'cristallum.io',
  });
    const domain = new apigw.DomainName(this, 'Domain', {
      domainName: domainName,
      certificate: certificate
    })

    new apigw.ApiMapping(this, 'Mapping', {
        api: webSocketApi,
        domainName: domain,
        stage: webSocketStage
    })

    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayv2DomainProperties(
        domain.regionalDomainName,
        domain.regionalHostedZoneId
      )),
    })

  }
}
