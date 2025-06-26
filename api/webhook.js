export default async function handler(req, res) {
  console.log('Webhook呼び出し開始');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const events = req.body.events;
  if (!events || events.length === 0) {
    return res.status(200).json({ message: 'No events' });
  }

  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (error) {
      console.error('Event handling error:', error);
    }
  }

  res.status(200).json({ message: 'OK' });
}

// LINEイベント処理
async function handleEvent(event) {
  const { type, replyToken, source, message, postback } = event;
  const userId = source.userId;

  console.log('Event received:', { type, userId });

  if (type === 'message' && message.type === 'text') {
    const userMessage = message.text;
    console.log('User message:', userMessage);

    if (userMessage === '診断を始める' || userMessage.includes('診断')) {
      console.log('診断開始メッセージ受信:', userMessage);
      
      // シンプルなテストメッセージ
      const testMessage = {
        type: 'text',
        text: 'テスト: メッセージを受信しました！診断開始ボタンを表示します。',
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
      };

      try {
        console.log('テストメッセージ送信中...');
        await replyMessage(replyToken, [testMessage]);
        console.log('テストメッセージ送信完了');
      } catch (error) {
        console.error('テストメッセージ送信エラー:', error);
      }
    }
  }

  if (type === 'postback') {
    const data = postback.data;
    console.log('Postback received:', data);

    if (data === 'start_q1') {
      const q1Message = {
        type: 'text',
        text: '【質問1/10】📈\n\n昨年度と比較して一人当たりの売上高は？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '10%以上向上',
                data: 'q1_improve_10plus'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '5-10%向上',
                data: 'q1_improve_5to10'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'ほぼ横ばい',
                data: 'q1_flat'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q1Message]);
        console.log('質問1送信完了');
      } catch (error) {
        console.error('質問1送信エラー:', error);
      }
    }

    // Q1の回答処理
    if (data.startsWith('q1_')) {
      let responseMessage = '';
      
      if (data === 'q1_improve_10plus') {
        responseMessage = '素晴らしい成長率です！🎉\nさらにAIを活用すれば、この成長を加速できます。';
      } else if (data === 'q1_improve_5to10') {
        responseMessage = '順調な成長ですね！📈\nAI活用で2桁成長も見えてきます。';
      } else if (data === 'q1_flat') {
        responseMessage = '現状維持は後退と同じ...😐\n競合はAIで生産性を20%以上改善しています。';
      }

      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 ベンチマークデータ：
AI活用企業の87%が「一人当たり売上高」を平均23%向上させています。人数を増やさず、売上を増やす方法があります。`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '📊 次の質問へ',
                data: 'next_q2'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [benchmarkMessage]);
        console.log('Q1ベンチマーク送信完了');
      } catch (error) {
        console.error('Q1ベンチマーク送信エラー:', error);
      }
    }

    // 質問2表示
    if (data === 'next_q2') {
      const q2Message = {
        type: 'text',
        text: '【質問2/10】🌱\n\n新入社員が一人前になるまでの期間は？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '3ヶ月以内',
                data: 'q2_3months'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '3-6ヶ月',
                data: 'q2_3to6months'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '6ヶ月-1年',
                data: 'q2_6to12months'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q2Message]);
        console.log('質問2送信完了');
      } catch (error) {
        console.error('質問2送信エラー:', error);
      }
    }
  }
}

// 共通のメッセージ送信関数
async function replyMessage(replyToken, messages) {
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Reply message error:', errorText);
    throw new Error(`Reply message failed: ${response.status}`);
  }

  return response.json();
}

async function sendPushMessage(userId, messages) {
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Push message error:', errorText);
    throw new Error(`Push message failed: ${response.status}`);
  }

  return response.json();
}
