const { App, AwsLambdaReceiver } = require('@slack/bolt');

const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// ボットトークンと、AWS Lambda に対応させたレシーバーを使ってアプリを初期化します。
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: awsLambdaReceiver,
    // `processBeforeResponse` オプションは、あらゆる FaaS 環境で必須です。
    // このオプションにより、Bolt フレームワークが `ack()` などでリクエストへの応答を返す前に
    // `app.message` などのメソッドが Slack からのリクエストを処理できるようになります。FaaS では
    // 応答を返した後にハンドラーがただちに終了してしまうため、このオプションの指定が重要になります。
    processBeforeResponse: true
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
    await say({
        blocks: [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `Hey! there <@${message.user}>!`
            },
            "accessory": {
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "Click Me"
            },
            "action_id": "button_click"
            }
        }
        ],
        text: `Hey there <@${message.user}>!`
    });
});

app.action('button_click', async ({ body, ack, say }) => {
    // Acknowledge the action
    await ack();
    await say(`<@${body.user.id}> clicked the button`);
});

// Lambda 関数のイベントを処理します
module.exports.handler = async (event, context, callback) => {
    const handler = await app.start();
    return handler(event, context, callback);
}