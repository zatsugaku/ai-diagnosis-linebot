// デバッグ版 - api/webhook.js
const userAnswers = new Map();

export default async function handler(req, res) {
  console.log('=== Webhook呼び出し開始 ===');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const events = req.body.events;
  if (!events || events.length === 0) {
    return res.status(200).json({ message: 'No events' });
  }

  for (const event of events) {
    try {
      console.log('=== Processing Event ===');
      console.log('Event Type:', event.type);
      console.log('Event Data:', JSON.stringify(event, null, 2));
      
      await handleEvent(event);
    } catch (error) {
      console.error('❌ Event handling error:', error);
    }
  }

  res.status(200).json({ message: 'OK' });
}

async function handleEvent(event) {
  const { type, replyToken, source, message, postback } = event;
  const userId = source.userId;

  console.log('=== handleEvent ===');
  console.log('Type:', type);
  console.log('UserId:', userId);

  // テキストメッセージ処理
  if (type === 'message' && message.type === 'text') {
    const userMessage = message.text;
    console.log('📝 Text message:', userMessage);

    if (userMessage === '診断開始' || userMessage.includes('診断') || userMessage === 'テスト') {
      console.log('🎯 診断開始処理開始');
      
      const welcomeMessage = {
        type: 'text',
        text: `🎯 AI活用診断へようこそ

この診断では、1,200社の実績データを基に
あなたの会社の「真の改善ポテンシャル」を
わずか3分で明らかにします。

準備はよろしいですか？`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '✅ 診断開始',
                data: 'start_q1'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '❓ 詳細を知りたい',
                data: 'more_info'
              }
            }
          ]
        }
      };

      try {
        console.log('📤 送信中: 案内メッセージ');
        await replyMessage(replyToken, [welcomeMessage]);
        console.log('✅ 案内メッセージ送信完了');
      } catch (error) {
        console.error('❌ 案内メッセージ送信エラー:', error);
      }
    } else {
      // その他のメッセージへの応答
      try {
        await replyMessage(replyToken, [{
          type: 'text',
          text: `受信: ${userMessage}\n\n「診断開始」と送信してください。`
        }]);
      } catch (error) {
        console.error('❌ 通常応答エラー:', error);
      }
    }
  }

  // ポストバック処理
  if (type === 'postback') {
    const data = postback.data;
    console.log('🔘 Postback received:', data);
    console.log('🔘 Postback object:', JSON.stringify(postback, null, 2));

    if (data === 'start_q1') {
      console.log('🚀 Q1開始処理');
      
      const q1Message = {
        type: 'text',
        text: '【質問1/10】📈\n\n昨年度と比較して、一人当たりの売上高は？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '向上している',
                data: 'q1_improve'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'ほぼ横ばい',
                data: 'q1_flat'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '減少している',
                data: 'q1_decline'
              }
            }
          ]
        }
      };

      try {
        console.log('📤 送信中: Q1');
        await sendPushMessage(userId, [q1Message]);
        console.log('✅ Q1送信完了');
      } catch (error) {
        console.error('❌ Q1送信エラー:', error);
      }
    }

    if (data === 'more_info') {
      console.log('ℹ️ 詳細情報要求');
      
      try {
        await sendPushMessage(userId, [{
          type: 'text',
          text: `📊 AI活用診断の詳細

✅ 10の質問で3分完了
✅ 1,200社のデータに基づく分析
✅ 具体的な改善案を提示
✅ 投資対効果を算出

診断を開始しますか？`,
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '✅ 診断開始',
                  data: 'start_q1'
                }
              }
            ]
          }
        }]);
        console.log('✅ 詳細情報送信完了');
      } catch (error) {
        console.error('❌ 詳細情報送信エラー:', error);
      }
    }

    // Q1回答処理
    if (data.startsWith('q1_')) {
      console.log('📊 Q1回答処理:', data);
      
      let responseMessage = '';
      if (data === 'q1_improve') {
        responseMessage = '素晴らしい成長！🎉';
      } else if (data === 'q1_flat') {
        responseMessage = '改善の余地がありますね。😐';
      } else if (data === 'q1_decline') {
        responseMessage = '今こそ変革のチャンス！💪';
      }

      try {
        await sendPushMessage(userId, [{
          type: 'text',
          text: `✅ 回答確認: ${data}

${responseMessage}

🔧 現在テスト中です
「診断開始」でリセットできます`
        }]);
        console.log('✅ Q1回答処理完了');
      } catch (error) {
        console.error('❌ Q1回答処理エラー:', error);
      }
    }
  }
}

async function replyMessage(replyToken, messages) {
  console.log('📤 replyMessage呼び出し');
  console.log('ReplyToken:', replyToken);
  console.log('Messages:', JSON.stringify(messages, null, 2));
  
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: messages,
    }),
  });

  console.log('LINE API Response Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Reply message error:', errorText);
    throw new Error(`Reply failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Reply success:', result);
  return result;
}

async function sendPushMessage(userId, messages) {
  console.log('📤 sendPushMessage呼び出し');
  console.log('UserId:', userId);
  console.log('Messages:', JSON.stringify(messages, null, 2));
  
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: messages,
    }),
  });

  console.log('LINE API Response Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Push message error:', errorText);
    throw new Error(`Push failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Push success:', result);
  return result;
}
