#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApigwAppStack } from '../lib/apigw-app-stack';

const appName = 'EnceladusService'
const app = new cdk.App();

app.node.setContext('appName', appName);
app.node.setContext('stage', 'dev');

new ApigwAppStack(app, `${appName}Stack`, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    }
});