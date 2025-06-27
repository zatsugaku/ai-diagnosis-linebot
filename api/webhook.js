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

    // === Q1質問表示（改良版：6択対応） ===
    if (data === 'start_q1') {
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
        console.log('質問1送信完了（6択版）');
      } catch (error) {
        console.error('質問1送信エラー:', error);
      }
    }

    // === Q1回答処理（改良版：回答確認表示付き） ===
    if (data.startsWith('q1_')) {
      // 回答を記録
      if (!userAnswers.has(userId)) {
        userAnswers.set(userId, {});
      }
      userAnswers.get(userId).q1 = data.replace('q1_', '');
      
      // 回答ラベルの取得
      const answerLabel = getQ1AnswerLabel(data);
      
      // 回答別のコメントとベンチマーク
      let responseMessage = '';
      let benchmarkData = '';
      
      if (data === 'q1_improve_20plus') {
        responseMessage = '驚異的な成長率！🚀\n御社は既に業界のトップランナーですね。';
        benchmarkData = `💡 知ってましたか？
AI活用企業の上位5%に入る成長率です。
さらにAI活用すれば、この成長を加速できます！`;
      } else if (data === 'q1_improve_10to20') {
        responseMessage = '素晴らしい高成長！🎉\nこの勢いをAIでさらに加速できます。';
        benchmarkData = `💡 ベンチマーク：
この成長率は上位20%に入ります。
AI導入で30%成長も夢ではありません。`;
      } else if (data === 'q1_improve_5to10') {
        responseMessage = '順調な成長ですね！📈\nAI活用で2桁成長への飛躍が可能です。';
        benchmarkData = `💡 改善ポテンシャル：
同規模企業の65%がAI活用で
この水準を上回っています。`;
      } else if (data === 'q1_flat') {
        responseMessage = '現状維持は実質的な後退...😐\n競合はAIで生産性を大幅改善中です。';
        benchmarkData = `⚠️ 危険信号：
業界平均以下の成長率です。
今すぐ対策が必要です。`;
      } else if (data === 'q1_decline_5to15') {
        responseMessage = '厳しい状況ですが挽回可能！💪\nAIなら少ない投資で売上回復できます。';
        benchmarkData = `🆘 緊急対策：
AI活用で人員増なしに
売上30%回復した企業があります。`;
      } else if (data === 'q1_decline_15plus') {
        responseMessage = '今こそ変革のチャンス！🔥\nAI活用で劇的な改善事例が多数あります。';
        benchmarkData = `🔥 成功事例：
同じ状況から1年で黒字転換した
企業の事例をお見せできます。`;
      }

      // 回答確認 + 詳細コメント + ベンチマークの統合メッセージ
      const benchmarkMessage = {
        type: 'text',
        text: `✅ あなたの回答：${answerLabel}

${responseMessage}

${benchmarkData}

━━━━━━━━━━━━━━━━━━━
📊 業界データ：
AI活用企業の87%が「一人当たり売上高」を
平均23%向上させています。`,
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
        console.log('Q1回答確認+ベンチマーク送信完了');
      } catch (error) {
        console.error('Q1回答確認送信エラー:', error);
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
        console.log('質問2送信完了');
      } catch (error) {
        console.error('質問2送信エラー:', error);
      }
    }

    // その他の質問処理（Q2以降）は省略して基本動作確認
    if (data.startsWith('q2_')) {
      const testMessage = {
        type: 'text',
        text: `✅ Q2回答受信: ${data}

🔧 現在テスト中です
完全版は近日公開予定

診断をリセットしますか？`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '🔄 診断リセット',
                data: 'start_q1'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [testMessage]);
        console.log('テストメッセージ送信完了');
      } catch (error) {
        console.error('テストメッセージ送信エラー:', error);
      }
    }
  }
}

// Q1回答ラベル取得関数
function getQ1AnswerLabel(data) {
  const labels = {
    'q1_improve_20plus': '20%以上向上（急成長）',
    'q1_improve_10to20': '10-20%向上（高成長）',
    'q1_improve_5to10': '5-10%向上（安定成長）',
    'q1_flat': 'ほぼ横ばい（±5%以内）',
    'q1_decline_5to15': '5-15%減少',
    'q1_decline_15plus': '15%以上減少（危機的）'
  };
  return labels[data] || '選択された回答';
}

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
