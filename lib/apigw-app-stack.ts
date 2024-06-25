import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Function } from 'aws-cdk-lib/aws-lambda'
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class ApigwAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const appName = this.node.tryGetContext('appName');
    const stage = this.node.tryGetContext('stage') || 'dev';

    // lambda function definition
    const webSocketApi = new apigw.WebSocketApi(this, 'Api', {
      apiName: `${appName}Api`,
      description: `API for ${appName}`,
      connectRouteOptions: {
        // integration for connect route
      },

    })
    new apigw.WebSocketStage(this, 'stage', {
      webSocketApi,
      stageName: stage,
      autoDeploy: true
    })

    const domainName = 'example.com'
    const certificateArn = 'certificate-arn'
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      certificateArn
    );

    const hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'your zone-name',
    })
    const domain = new apigw.DomainName(this, 'Domain', {
      domainName: domainName,
      certificate: certificate
    })

    new apigw.ApiMapping(this, 'Mapping', {
        api: webSocketApi,
        domainName: domain,
        stage: stage,
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
