export default async function handler(req, res) {
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
      // 初期案内メッセージを送信
      const welcomeMessage = {
        type: 'text',
        text: `🎯 AI活用診断へようこそ！

この診断では、あなたの会社の
「真の改善ポテンシャル」を
わずか3分で明らかにします。

1,200社の実績データを基に
具体的な改善額まで算出します💰

準備はよろしいですか？`
      };

      try {
        console.log('送信中: 初期案内メッセージ');
        await replyMessage(replyToken, [welcomeMessage]);
        console.log('初期案内メッセージ送信完了');

        // 診断開始ボタンを即座に送信（setTimeoutを削除）
        const quickReply = {
          type: 'text',
          text: '診断を開始しますか？',
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

        console.log('送信中: 診断開始ボタン', userId);
        await sendPushMessage(userId, [quickReply]);
        console.log('診断開始ボタン送信完了');

      } catch (error) {
        console.error('メッセージ送信エラー:', error);
      }
    }
  }

  if (type === 'postback') {
    const data = postback.data;
    console.log('Postback received:', data);

    try {
      if (data === 'start_q1') {
        await sendQuestion1(userId);
      } else if (data === 'more_info') {
        await sendMoreInfo(userId);
      } else if (data.startsWith('q1_')) {
        const answer = data.replace('q1_', '');
        await handleQ1Answer(userId, answer);
      } else if (data.startsWith('q2_')) {
        const answer = data.replace('q2_', '');
        await handleQ2Answer(userId, answer);
      } else if (data.startsWith('q3_')) {
        const answer = data.replace('q3_', '');
        await handleQ3Answer(userId, answer);
      } else if (data.startsWith('q4_')) {
        const answer = data.replace('q4_', '');
        await handleQ4Answer(userId, answer);
      } else if (data.startsWith('q5_')) {
        const answer = data.replace('q5_', '');
        await handleQ5Answer(userId, answer);
      } else if (data.startsWith('q6_')) {
        const answer = data.replace('q6_', '');
        await handleQ6Answer(userId, answer);
      } else if (data.startsWith('q7_')) {
        const answer = data.replace('q7_', '');
        await handleQ7Answer(userId, answer);
      } else if (data.startsWith('q8_')) {
        const answer = data.replace('q8_', '');
        await handleQ8Answer(userId, answer);
      } else if (data.startsWith('q9_')) {
        const answer = data.replace('q9_', '');
        await handleQ9Answer(userId, answer);
      } else if (data.startsWith('q10_')) {
        const answer = data.replace('q10_', '');
        await handleQ10Answer(userId, answer);
      }
    } catch (error) {
      console.error('Postback処理エラー:', error);
    }
  }
}

// 詳細情報送信
async function sendMoreInfo(userId) {
  const infoMessage = {
    type: 'text',
    text: `📊 この診断について

🎯 診断内容
• 一人当たり売上高の分析
• 人材育成効率の評価  
• 業務の属人化リスク診断
• データ活用度チェック

💰 診断で分かること
• 年間改善可能額（具体的数値）
• 投資回収期間
• 優先改善項目TOP3
• 業界比較での立ち位置

⏰ 所要時間：わずか3分
📈 実績：1,200社の診断データ活用

それでは始めましょう！`
  };

  const startButton = {
    type: 'text',
    text: '準備ができましたら診断を開始してください',
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

  await sendPushMessage(userId, [infoMessage, startButton]);
}

// 質問1: 一人当たり売上高
async function sendQuestion1(userId) {
  const questionMessage = {
    type: 'text',
    text: `【質問1/10】📈

昨年度と比較して
一人当たりの売上高は？`,
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
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '5-10%減少',
            data: 'q1_decline_5to10'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '10%以上減少',
            data: 'q1_decline_10plus'
          }
        }
      ]
    }
  };

  await sendPushMessage(userId, [questionMessage]);
}

// Q1回答処理とベンチマーク情報
async function handleQ1Answer(userId, answer) {
  let responseMessage = '';
  
  switch(answer) {
    case 'improve_10plus':
      responseMessage = '素晴らしい成長率です！🎉\nさらにAIを活用すれば、この成長を加速できます。';
      break;
    case 'improve_5to10':
      responseMessage = '順調な成長ですね！📈\nAI活用で2桁成長も見えてきます。';
      break;
    case 'flat':
      responseMessage = '現状維持は後退と同じ...😐\n競合はAIで生産性を20%以上改善しています。';
      break;
    case 'decline_5to10':
      responseMessage = '厳しい状況ですね。😰\nでも、AIなら少ない人数で売上向上が可能です。';
      break;
    case 'decline_10plus':
      responseMessage = '今すぐ手を打つ必要があります！🚨\nAI活用で劇的な改善事例があります。';
      break;
  }

  const benchmarkMessage = {
    type: 'text',
    text: `${responseMessage}

💡 ベンチマークデータ：
AI活用企業の87%が「一人当たり売上高」を平均23%向上させています。人数を増やさず、売上を増やす方法があります。`
  };

  await sendPushMessage(userId, [benchmarkMessage]);
  
  // 即座に次の質問を送信（setTimeoutを削除）
  try {
    console.log('質問2を送信中...');
    await sendQuestion2(userId);
    console.log('質問2送信完了');
  } catch (error) {
    console.error('質問2送信エラー:', error);
  }
}

// 質問2: 育成期間
async function sendQuestion2(userId) {
  const questionMessage = {
    type: 'text',
    text: `【質問2/10】🌱

新入社員が一人前になるまでの期間は？`,
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
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '1-2年',
            data: 'q2_1to2years'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '2年以上',
            data: 'q2_2plus_years'
          }
        }
      ]
    }
  };

  await sendPushMessage(userId, [questionMessage]);
}

// Q2回答処理
async function handleQ2Answer(userId, answer) {
  let responseMessage = '';
  
  switch(answer) {
    case '3months':
      responseMessage = '育成システムが優秀ですね！✨\nAIでさらに効率化できます。';
      break;
    case '3to6months':
      responseMessage = '標準的な育成期間です。🌱\nAI活用で2ヶ月短縮した企業もあります。';
      break;
    case '6to12months':
      responseMessage = 'もう少し短縮できそうです。⏰\n育成期間半減で年間650万円の効果も。';
      break;
    case '1to2years':
      responseMessage = '育成に時間がかかりすぎかも...😓\nAI支援で劇的に短縮可能です。';
      break;
    case '2plus_years':
      responseMessage = '育成期間が長すぎます！😱\n競合に人材を奪われるリスクが...';
      break;
  }

  const benchmarkMessage = {
    type: 'text',
    text: `${responseMessage}

💡 人材育成の新常識：
AI活用による教育支援で、育成期間を平均45%短縮できます。あなたの会社なら年間〇〇万円の効果に相当します。`
  };

  await sendPushMessage(userId, [benchmarkMessage]);
  
  // 即座に次の質問を送信
  try {
    console.log('質問3を送信中...');
    await sendQuestion3(userId);
    console.log('質問3送信完了');
  } catch (error) {
    console.error('質問3送信エラー:', error);
  }
}

// 質問3: 優秀社員の残業理由
async function sendQuestion3(userId) {
  const questionMessage = {
    type: 'text',
    text: `【質問3/10】⭐

先月、最も優秀な社員が残業した主な理由は？`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '新規プロジェクト',
            data: 'q3_new_project'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '通常業務が追いつかない',
            data: 'q3_behind_work'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '部下の指導',
            data: 'q3_mentoring'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '会議・報告書',
            data: 'q3_meetings'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '残業はほぼない',
            data: 'q3_no_overtime'
          }
        }
      ]
    }
  };

  await sendPushMessage(userId, [questionMessage]);
}

// Q3回答処理
async function handleQ3Answer(userId, answer) {
  let responseMessage = '';
  
  switch(answer) {
    case 'new_project':
      responseMessage = '理想的な時間の使い方です！💡\n価値創造に集中できていますね。';
      break;
    case 'behind_work':
      responseMessage = '優秀な人材が作業に忙殺...😔\nAIなら彼らを解放できます。';
      break;
    case 'mentoring':
      responseMessage = '育成は大切ですが...🤔\nAI活用で指導時間も効率化できます。';
      break;
    case 'meetings':
      responseMessage = 'もったいない！😭\n優秀人材は戦略に集中すべきです。';
      break;
    case 'no_overtime':
      responseMessage = 'ワークライフバランス◎👏\n生産性の高い組織ですね。';
      break;
  }

  const benchmarkMessage = {
    type: 'text',
    text: `${responseMessage}

💡 優秀人材の活用度：
優秀社員の68%が「本来の力を発揮できていない」と感じています。彼らの時間を解放すればイノベーションが生まれます。`
  };

  await sendPushMessage(userId, [benchmarkMessage]);
  
  // 即座に質問4を送信
  try {
    console.log('質問4を送信中...');
    await sendQuestion4(userId);
    console.log('質問4送信完了');
  } catch (error) {
    console.error('質問4送信エラー:', error);
  }
}

// 残りの質問も同様の構造で続く...

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
