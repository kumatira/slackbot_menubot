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
                "text": "レシピを登録"
            },
            "action_id": "register_recipe"
            }
        }
        ],
        text: `Hey there <@${message.user}>!`
    });
});

app.action('register_recipe', async ({ ack, body, client }) => {
    await ack();
    try {
        const result = await client.views.open({
            // 適切な trigger_id を受け取ってから 3 秒以内に渡す
            trigger_id: body.trigger_id,
            // view の値をペイロードに含む
            view: {
                "title": {
                    "type": "plain_text",
                    "text": "レシピを登録"
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Submit"
                },
                "type": "modal",
                "callback_id": "view_1",
                "blocks": [
                    {
                        "dispatch_action": true,
                        "type": "input",
                        "element": {
                            "type": "plain_text_input",
                            "dispatch_action_config": {
                                "trigger_actions_on": [
                                    "on_character_entered"
                                ]
                            },
                            "action_id": "kurashiru_url_input_action"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "登録したいクラシルのURLを貼ってね",
                            "emoji": true
                        }
                    }
                ]
            }
            });
            console.log(result);
        }
        catch (error) {
            console.error(error);
        }

});

// action_id: button_abc のボタンを押すイベントをリッスン
// （そのボタンはモーダルの中にあるという想定）
app.action('kurashiru_url_input_action', async ({ ack, body, client }) => {
    // ボタンを押したイベントを確認
    await ack();
    const inputText = body.actions[0].value
    try {
        if (KURASHIRU_UTIL.verifyKurashiruUrl(inputText)) {
            const recipeInfo = await KURASHIRU_UTIL.getRecipeFromWeb(inputText);
            const result = await client.views.update({
                // リクエストに含まれる view_id を渡す
                view_id: body.view.id,
                // 競合状態を防ぐために更新前の view に含まれる hash を指定
                hash: body.view.hash,
                // 更新された view の値をペイロードに含む
                view: {
                    "title": {
                        "type": "plain_text",
                        "text": "レシピを登録"
                    },
                    "submit": {
                        "type": "plain_text",
                        "text": "Submit"
                    },
                    "type": "modal",
                    "callback_id": "view_1",
                    "blocks": [
                        {
                            "dispatch_action": true,
                            "type": "input",
                            "element": {
                                "type": "plain_text_input",
                                "initial_value": body.actions[0].value,
                                "dispatch_action_config": {
                                    "trigger_actions_on": [
                                        "on_character_entered"
                                    ]
                                },
                                "action_id": "kurashiru_url_input_action"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "登録レシピ",
                                "emoji": true
                            }
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `*料理名*\n ${recipeInfo.title}`
                            },
                            "accessory": {
                                "type": "image",
                                "image_url": recipeInfo.thumbnail,
                                "alt_text": "thumbnail image"
                            }
                        },
                        {
                            "type": "input",
                            "block_id": "ingredients",
                            "label": {
                                "type": "plain_text",
                                "text": "材料"
                            },
                            "element": {
                                "type": "plain_text_input",
                                "action_id": "dreamy_input",
                                "initial_value": recipeInfo.ingredients.join(' '),
                                "multiline": true
                            }
                        }
                    ]
                }
            });
            console.log(result);
        } else {
            const result = await client.views.update({
                // リクエストに含まれる view_id を渡す
                view_id: body.view.id,
                // 競合状態を防ぐために更新前の view に含まれる hash を指定
                hash: body.view.hash,
                // 更新された view の値をペイロードに含む
                view: {
                    "title": {
                        "type": "plain_text",
                        "text": "レシピを登録"
                    },
                    "submit": {
                        "type": "plain_text",
                        "text": "Submit"
                    },
                    "type": "modal",
                    "callback_id": "view_1",
                    "blocks": [
                        {
                            "dispatch_action": true,
                            "type": "input",
                            "element": {
                                "type": "plain_text_input",
                                "initial_value": body.actions[0].value,
                                "dispatch_action_config": {
                                    "trigger_actions_on": [
                                        "on_character_entered"
                                    ]
                                },
                                "action_id": "kurashiru_url_input_action"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "それはクラシルのURLではありません:cry:",
                                "emoji": true
                            }
                        }
                    ]
                }
            });
            console.log(result);
        }

    }
    catch (error) {
        console.error(error);
    }
});

// Lambda 関数のイベントを処理します
module.exports.handler = async (event, context, callback) => {
    const handler = await app.start();
    return handler(event, context, callback);
}