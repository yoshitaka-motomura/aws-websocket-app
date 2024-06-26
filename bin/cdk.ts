#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApigwAppStack } from '../lib/apigw-app-stack';
import * as dotenv from 'dotenv';
dotenv.config()

const certificateArn = process.env.CERTIFICATE_ARN || null
if (!certificateArn) {
    throw new Error('CERTIFICATE_ARN environment variable is required')
}
const appName = 'EnceladusService'
const app = new cdk.App();

app.node.setContext('appName', appName);
app.node.setContext('stage', 'dev');
app.node.setContext('certificateArn', certificateArn);

new ApigwAppStack(app, `${appName}Stack`, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    }
});