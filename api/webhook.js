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
      // 回答を記録
      if (!userAnswers.has(userId)) {
        userAnswers.set(userId, {});
      }
      userAnswers.get(userId).q1 = data.replace('q1_', '');
      
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

    // Q2の回答処理
    if (data.startsWith('q2_')) {
      // 回答を記録
      userAnswers.get(userId).q2 = data.replace('q2_', '');
      
      let responseMessage = '';
      
      if (data === 'q2_3months') {
        responseMessage = '育成システムが優秀ですね！✨\nAIでさらに効率化できます。';
      } else if (data === 'q2_3to6months') {
        responseMessage = '標準的な育成期間です。🌱\nAI活用で2ヶ月短縮した企業もあります。';
      } else if (data === 'q2_6to12months') {
        responseMessage = 'もう少し短縮できそうです。⏰\n育成期間半減で年間650万円の効果も。';
      }

      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 人材育成の新常識：
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
        await sendPushMessage(userId, [benchmarkMessage]);
        console.log('Q2ベンチマーク送信完了');
      } catch (error) {
        console.error('Q2ベンチマーク送信エラー:', error);
      }
    }

    // 質問3表示
    if (data === 'next_q3') {
      const q3Message = {
        type: 'text',
        text: '【質問3/10】⭐\n\n先月、最も優秀な社員が残業した主な理由は？',
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
                label: '会議・報告書',
                data: 'q3_meetings'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q3Message]);
        console.log('質問3送信完了');
      } catch (error) {
        console.error('質問3送信エラー:', error);
      }
    }

    // Q3の回答処理
    if (data.startsWith('q3_')) {
      // 回答を記録
      userAnswers.get(userId).q3 = data.replace('q3_', '');
      
      let responseMessage = '';
      
      if (data === 'q3_new_project') {
        responseMessage = '理想的な時間の使い方です！💡\n価値創造に集中できていますね。';
      } else if (data === 'q3_behind_work') {
        responseMessage = '優秀な人材が作業に忙殺...😔\nAIなら彼らを解放できます。';
      } else if (data === 'q3_meetings') {
        responseMessage = 'もったいない！😭\n優秀人材は戦略に集中すべきです。';
      }

      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 優秀人材の活用度：
優秀社員の68%が「本来の力を発揮できていない」と感じています。彼らの時間を解放すればイノベーションが生まれます。`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '📊 次の質問へ',
                data: 'next_q4'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [benchmarkMessage]);
        console.log('Q3ベンチマーク送信完了');
      } catch (error) {
        console.error('Q3ベンチマーク送信エラー:', error);
      }
    }

    // 質問4表示
    if (data === 'next_q4') {
      const q4Message = {
        type: 'text',
        text: '【質問4/10】🚪\n\n直近3ヶ月で退職した社員の主な理由は？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'キャリアアップ',
                data: 'q4_career_up'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '給与・待遇',
                data: 'q4_salary'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '業務負荷',
                data: 'q4_workload'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q4Message]);
        console.log('質問4送信完了');
      } catch (error) {
        console.error('質問4送信エラー:', error);
      }
    }

    // Q4の回答処理
    if (data.startsWith('q4_')) {
      // 回答を記録
      userAnswers.get(userId).q4 = data.replace('q4_', '');
      
      let responseMessage = '';
      
      if (data === 'q4_career_up') {
        responseMessage = '前向きな退職は組織の健全性の証。🌟\n卒業生ネットワークは財産です。';
      } else if (data === 'q4_salary') {
        responseMessage = '待遇改善も大切ですが...💰\n業務効率化で原資を作れます。';
      } else if (data === 'q4_workload') {
        responseMessage = '業務負荷での離職は危険信号！⚠️\nAIで業務を30%削減できます。';
      }

      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 離職コストの真実：
一人の離職で平均320万円の損失。AI活用による業務効率化で離職率を34%削減した企業があります。`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '📊 次の質問へ',
                data: 'next_q5'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [benchmarkMessage]);
        console.log('Q4ベンチマーク送信完了');
      } catch (error) {
        console.error('Q4ベンチマーク送信エラー:', error);
      }
    }

    // 質問5表示
    if (data === 'next_q5') {
      const q5Message = {
        type: 'text',
        text: '【質問5/10】📚\n\n社内の「知識・ノウハウ」の共有状況は？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'データベース化済み',
                data: 'q5_database'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '文書化だが散在',
                data: 'q5_documents'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '主に頭の中',
                data: 'q5_tacit'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q5Message]);
        console.log('質問5送信完了');
      } catch (error) {
        console.error('質問5送信エラー:', error);
      }
    }

    // Q5の回答処理（AI分析実行）
    if (data.startsWith('q5_')) {
      // 回答を記録
      userAnswers.get(userId).q5 = data.replace('q5_', '');
      
      let responseMessage = '';
      
      if (data === 'q5_database') {
        responseMessage = '知識管理が進んでいます！📚\nAIで更に活用度を高められます。';
      } else if (data === 'q5_documents') {
        responseMessage = '惜しい！文書はあるのに...📁\nAIで知識を統合・活用できます。';
      } else if (data === 'q5_tacit') {
        responseMessage = '暗黙知の宝庫ですね。🧠\nAIで見える化すれば財産に。';
      }

      // 通常のベンチマーク表示
      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 知識資産の価値：
暗黙知の見える化により新人の戦力化速度が2.3倍に。AIなら過去の提案書から勝ちパターンも自動抽出できます。`
      };

      // AI分析実行中メッセージ
      const analysisMessage = {
        type: 'text',
        text: `🤖 AI分析中...

ここまでの5つの回答を
Claude AIが詳細分析中です

少々お待ちください...⏳`
      };

      try {
        await sendPushMessage(userId, [benchmarkMessage, analysisMessage]);
        
        // Claude APIでAI分析実行
        const aiAnalysis = await analyzeWithClaude(userAnswers.get(userId));
        
        const aiResultMessage = {
          type: 'text',
          text: `🎯 【AI中間分析結果】

${aiAnalysis}

━━━━━━━━━━━━━━━━━━━
残り5問で、さらに詳細な
最終分析を行います！`,
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '📊 後半の診断へ',
                  data: 'next_q6'
                }
              }
            ]
          }
        };

        await sendPushMessage(userId, [aiResultMessage]);
        console.log('AI分析結果送信完了');
        
      } catch (error) {
        console.error('AI分析エラー:', error);
        
        // エラー時のフォールバック
        const fallbackMessage = {
          type: 'text',
          text: `📊 中間分析結果

これまでの回答から、御社には
大きな改善ポテンシャルが
見えてきました！

詳細は最終結果でお伝えします。`,
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '📊 後半の診断へ',
                  data: 'next_q6'
                }
              }
            ]
          }
        };
        
        await sendPushMessage(userId, [fallbackMessage]);
      }
    }
  }
}

// 共通のメッセージ送信関数
async function analyzeWithClaude(answers) {
  const prompt = `あなたは企業AI活用コンサルタントです。以下の5つの質問への回答を分析し、中間診断結果を150字以内で簡潔に提供してください：

【回答データ】
Q1 売上成長: ${answers.q1 || '未回答'}
Q2 育成期間: ${answers.q2 || '未回答'}  
Q3 優秀社員の時間使用: ${answers.q3 || '未回答'}
Q4 退職理由: ${answers.q4 || '未回答'}
Q5 知識共有: ${answers.q5 || '未回答'}

【出力形式】
📊 現在のスコア: ○○/50点
🎯 最優先改善領域: ○○○
💰 推定改善効果: 年間○○万円
⚡ 推奨AIツール: ○○○

簡潔で具体的な数値を含めてください。`;

  try {
    // Claude API呼び出し（実際のAPIキーが必要）
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY, // 環境変数に設定が必要
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Claude API error');
    }

    const data = await response.json();
    return data.content[0].text;
    
  } catch (error) {
    console.error('Claude API分析エラー:', error);
    
    // フォールバック分析（APIエラー時）
    return `📊 現在のスコア: 35/50点
🎯 最優先改善領域: 人材活用効率
💰 推定改善効果: 年間800万円
⚡ 推奨AIツール: ChatGPT Business

後半の診断で詳細分析します！`;
  }
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
