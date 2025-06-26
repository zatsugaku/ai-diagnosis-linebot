// ユーザーの回答データを保存するメモリストレージ
const userAnswers = new Map();

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

    if (userMessage === '診断開始' || userMessage.includes('診断')) {
      console.log('診断開始メッセージ受信:', userMessage);
      
      // プロフェッショナルな案内メッセージ
      const welcomeMessage = {
        type: 'text',
        text: `🎯 AI活用診断へようこそ

この診断では、1,200社の実績データを基に
あなたの会社の「真の改善ポテンシャル」を
わずか3分で明らかにします。

📊 診断内容：
• 売上・生産性の分析
• 人材活用効率の評価
• 業務改善余地の特定
• AI導入効果の算出

💰 分析結果：
• 具体的な改善可能額
• 優先順位付きアクションプラン  
• 最適なAIツール提案
• 投資回収期間の算出

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
        console.log('案内メッセージ送信中...');
        await replyMessage(replyToken, [welcomeMessage]);
        console.log('案内メッセージ送信完了');
      } catch (error) {
        console.error('案内メッセージ送信エラー:', error);
      }
    }
  }

  if (type === 'postback') {
    const data = postback.data;
    console.log('Postback received:', data);

    if (data === 'start_q1') {
      // Q1を6択で表示
      const q1Message = {
        type: 'text',
        text: '【質問1/10】📈\n\n昨年度と比較して、一人当たりの売上高は？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '20%以上向上（急成長）',
                data: 'q1_improve_20plus'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '10-20%向上（高成長）',
                data: 'q1_improve_10to20'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '5-10%向上（安定成長）',
                data: 'q1_improve_5to10'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'ほぼ横ばい（±5%以内）',
                data: 'q1_flat'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '5-15%減少',
                data: 'q1_decline_5to15'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '15%以上減少（危機的）',
                data: 'q1_decline_15plus'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q1Message]);
        console.log('質問1（6択）送信完了');
      } catch (error) {
        console.error('質問1送信エラー:', error);
      }
    }

    if (data === 'more_info') {
      await sendMoreInfo(userId);
    }

    // Q1の回答処理（6択対応＋回答確認）
    if (data.startsWith('q1_')) {
      // 回答を記録
      if (!userAnswers.has(userId)) {
        userAnswers.set(userId, {});
      }
      userAnswers.get(userId).q1 = data.replace('q1_', '');
      
      let selectedAnswer = '';
      let responseMessage = '';
      
      if (data === 'q1_improve_20plus') {
        selectedAnswer = '20%以上向上（急成長）';
        responseMessage = '驚異的な成長率！🚀\n御社は既に業界のトップランナーですね。';
      } else if (data === 'q1_improve_10to20') {
        selectedAnswer = '10-20%向上（高成長）';
        responseMessage = '素晴らしい高成長！🎉\nこの勢いをAIでさらに加速できます。';
      } else if (data === 'q1_improve_5to10') {
        selectedAnswer = '5-10%向上（安定成長）';
        responseMessage = '順調な成長ですね！📈\nAI活用で2桁成長への飛躍が可能です。';
      } else if (data === 'q1_flat') {
        selectedAnswer = 'ほぼ横ばい（±5%以内）';
        responseMessage = '現状維持は実質的な後退...😐\n競合はAIで生産性を大幅改善中です。';
      } else if (data === 'q1_decline_5to15') {
        selectedAnswer = '5-15%減少';
        responseMessage = '厳しい状況ですが挽回可能！💪\nAIなら少ない投資で売上回復できます。';
      } else if (data === 'q1_decline_15plus') {
        selectedAnswer = '15%以上減少（危機的）';
        responseMessage = '今こそ変革のチャンス！🔥\nAI活用で劇的な改善事例が多数あります。';
      }

      // 回答確認メッセージ
      const confirmMessage = {
        type: 'text',
        text: `✅ あなたの回答：${selectedAnswer}

${responseMessage}`
      };

      const benchmarkMessage = {
        type: 'text',
        text: `💡 ベンチマークデータ：
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
        await sendPushMessage(userId, [confirmMessage, benchmarkMessage]);
        console.log('Q1回答確認＋ベンチマーク送信完了');
      } catch (error) {
        console.error('Q1処理エラー:', error);
      }
    }

    // 質問2表示（5択）
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
                label: '3ヶ月以内（超効率）',
                data: 'q2_3months'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '3-6ヶ月（標準的）',
                data: 'q2_3to6months'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '6ヶ月-1年（やや長い）',
                data: 'q2_6to12months'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '1-2年（長期間）',
                data: 'q2_1to2years'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '2年以上（課題あり）',
                data: 'q2_2plus_years'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q2Message]);
        console.log('質問2（5択）送信完了');
      } catch (error) {
        console.error('質問2送信エラー:', error);
      }
    }

    // Q2の回答処理（5択対応＋回答確認）
    if (data.startsWith('q2_')) {
      userAnswers.get(userId).q2 = data.replace('q2_', '');
      
      let selectedAnswer = '';
      let responseMessage = '';
      
      if (data === 'q2_3months') {
        selectedAnswer = '3ヶ月以内（超効率）';
        responseMessage = '驚異的な育成効率！✨\n御社の教育システムは業界トップクラスです。';
      } else if (data === 'q2_3to6months') {
        selectedAnswer = '3-6ヶ月（標準的）';
        responseMessage = '標準的な育成期間ですね。🌱\nAI活用でさらに2ヶ月短縮可能です。';
      } else if (data === 'q2_6to12months') {
        selectedAnswer = '6ヶ月-1年（やや長い）';
        responseMessage = 'もう少し短縮の余地がありそうです。⏰\n育成期間半減で年間650万円の効果も。';
      } else if (data === 'q2_1to2years') {
        selectedAnswer = '1-2年（長期間）';
        responseMessage = '育成に時間がかかりすぎています😓\nAI支援で劇的に短縮可能です。';
      } else if (data === 'q2_2plus_years') {
        selectedAnswer = '2年以上（課題あり）';
        responseMessage = '緊急に改善が必要です！😱\n優秀な人材が競合に流れるリスクが...';
      }

      const confirmMessage = {
        type: 'text',
        text: `✅ あなたの回答：${selectedAnswer}

${responseMessage}`
      };

      const benchmarkMessage = {
        type: 'text',
        text: `💡 人材育成の新常識：
AI活用による教育支援で、育成期間を平均45%短縮できます。あなたの会社なら年間〇〇万円の効果に相当します。`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '📊 次の質問へ',
                data: 'next_q3'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [confirmMessage, benchmarkMessage]);
        console.log('Q2回答確認＋ベンチマーク送信完了');
      } catch (error) {
        console.error('Q2処理エラー:', error);
      }
    }

    // 質問3以降は同じパターンで実装継続...
    // 今回はQ1-Q2の完全動作確認を優先
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

それでは始めましょう！`,
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

  await sendPushMessage(userId, [infoMessage]);
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
