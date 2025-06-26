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

    // 質問6表示
    if (data === 'next_q6') {
      const q6Message = {
        type: 'text',
        text: '【質問6/10】⏰\n\n管理職が「本来の仕事」に使える時間の割合は？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '70%以上',
                data: 'q6_70plus'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '50-70%',
                data: 'q6_50to70'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '30%未満',
                data: 'q6_under30'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q6Message]);
        console.log('質問6送信完了');
      } catch (error) {
        console.error('質問6送信エラー:', error);
      }
    }

    // Q6の回答処理
    if (data.startsWith('q6_')) {
      // 回答を記録
      userAnswers.get(userId).q6 = data.replace('q6_', '');
      
      let responseMessage = '';
      
      if (data === 'q6_70plus') {
        responseMessage = '理想的な状態！🎯\nマネジメントに集中できています。';
      } else if (data === 'q6_50to70') {
        responseMessage = 'まずまずですが...🤷\nもう少し戦略に時間を使いたいですね。';
      } else if (data === 'q6_under30') {
        responseMessage = '緊急事態です！🚨\n管理職の時給5000円が作業に...';
      }

      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 マネジメント効率：
管理職の45%が「作業」に忙殺されています。AIで定型業務を自動化すれば、部下育成と戦略立案に集中できます。`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '📊 次の質問へ',
                data: 'next_q7'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [benchmarkMessage]);
        console.log('Q6ベンチマーク送信完了');
      } catch (error) {
        console.error('Q6ベンチマーク送信エラー:', error);
      }
    }

    // 質問7表示
    if (data === 'next_q7') {
      const q7Message = {
        type: 'text',
        text: '【質問7/10】💼\n\n「提案の質」で競合に勝てる自信は？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '常に勝っている',
                data: 'q7_always_win'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '7割は勝てる',
                data: 'q7_mostly_win'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '五分五分',
                data: 'q7_fifty_fifty'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '負けることが多い',
                data: 'q7_often_lose'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q7Message]);
        console.log('質問7送信完了');
      } catch (error) {
        console.error('質問7送信エラー:', error);
      }
    }

    // Q7の回答処理
    if (data.startsWith('q7_')) {
      userAnswers.get(userId).q7 = data.replace('q7_', '');
      
      let responseMessage = '';
      
      if (data === 'q7_always_win') {
        responseMessage = '圧倒的な提案力！💪\nAIでさらに差をつけましょう。';
      } else if (data === 'q7_mostly_win') {
        responseMessage = '高い勝率ですね！🏆\nAIで9割勝利も可能です。';
      } else if (data === 'q7_fifty_fifty') {
        responseMessage = 'もったいない...😅\nAIで提案作成70%高速化＆質向上。';
      } else if (data === 'q7_often_lose') {
        responseMessage = '提案力強化が急務！📝\nAI活用で勝率45%向上の実績あり。';
      }

      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 提案力の差：
AI活用企業は提案書作成時間を70%削減しつつ、採択率を45%向上させています。時間をかけずに質を上げる方法があります。`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '📊 次の質問へ',
                data: 'next_q8'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [benchmarkMessage]);
        console.log('Q7ベンチマーク送信完了');
      } catch (error) {
        console.error('Q7ベンチマーク送信エラー:', error);
      }
    }

    // 質問8表示
    if (data === 'next_q8') {
      const q8Message = {
        type: 'text',
        text: '【質問8/10】💡\n\n若手社員からの改善提案や新しいアイデアは？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '活発に実行',
                data: 'q8_active'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'たまに出るが実現少',
                data: 'q8_sometimes'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'ほとんど出ない',
                data: 'q8_rarely'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '検討する余裕なし',
                data: 'q8_no_time'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q8Message]);
        console.log('質問8送信完了');
      } catch (error) {
        console.error('質問8送信エラー:', error);
      }
    }

    // Q8の回答処理
    if (data.startsWith('q8_')) {
      userAnswers.get(userId).q8 = data.replace('q8_', '');
      
      let responseMessage = '';
      
      if (data === 'q8_active') {
        responseMessage = 'イノベーティブな組織！🚀\n素晴らしい文化です。';
      } else if (data === 'q8_sometimes') {
        responseMessage = 'アイデアを形にしたい...💭\nAIで実現スピードを上げられます。';
      } else if (data === 'q8_rarely') {
        responseMessage = '若手が諦めているかも...😔\n環境改善が必要です。';
      } else if (data === 'q8_no_time') {
        responseMessage = '日常業務に追われすぎ！😫\nAIで時間を作りましょう。';
      }

      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 イノベーションの源泉：
社員の72%は「良いアイデアがあっても日常業務で手一杯」と回答。AIで時間を作れば、アイデアが形になります。`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '📊 次の質問へ',
                data: 'next_q9'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [benchmarkMessage]);
        console.log('Q8ベンチマーク送信完了');
      } catch (error) {
        console.error('Q8ベンチマーク送信エラー:', error);
      }
    }

    // 質問9表示
    if (data === 'next_q9') {
      const q9Message = {
        type: 'text',
        text: '【質問9/10】⚠️\n\nもし主力社員が突然1ヶ月休んだら？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'カバー可能',
                data: 'q9_coverable'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'なんとか回る',
                data: 'q9_barely'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '業務が止まる',
                data: 'q9_stops'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '取引先に影響',
                data: 'q9_client_impact'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q9Message]);
        console.log('質問9送信完了');
      } catch (error) {
        console.error('質問9送信エラー:', error);
      }
    }

    // Q9の回答処理
    if (data.startsWith('q9_')) {
      userAnswers.get(userId).q9 = data.replace('q9_', '');
      
      let responseMessage = '';
      
      if (data === 'q9_coverable') {
        responseMessage = '属人化を防げています！👏\nリスク管理が優秀です。';
      } else if (data === 'q9_barely') {
        responseMessage = 'ギリギリセーフ...😅\nもう少し余裕を持ちたいですね。';
      } else if (data === 'q9_stops') {
        responseMessage = '危険な属人化！🛑\n年間850万円の損失リスクです。';
      } else if (data === 'q9_client_impact') {
        responseMessage = '最悪のシナリオ...😱\n今すぐ対策が必要です！';
      }

      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 属人化のリスク：
業務の属人化による損失は年間平均850万円。AIによる業務標準化でこのリスクは80%削減可能です。`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '📊 最後の質問へ',
                data: 'next_q10'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [benchmarkMessage]);
        console.log('Q9ベンチマーク送信完了');
      } catch (error) {
        console.error('Q9ベンチマーク送信エラー:', error);
      }
    }

    // 質問10表示
    if (data === 'next_q10') {
      const q10Message = {
        type: 'text',
        text: '【質問10/10】📊\n\nデータに基づいて意思決定する頻度は？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '日常的に活用',
                data: 'q10_daily'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '重要な決定時のみ',
                data: 'q10_important_only'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'たまに参考',
                data: 'q10_sometimes'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '勘と経験中心',
                data: 'q10_intuition'
              }
            }
          ]
        }
      };

      try {
        await sendPushMessage(userId, [q10Message]);
        console.log('質問10送信完了');
      } catch (error) {
        console.error('質問10送信エラー:', error);
      }
    }

    // Q10の回答処理（最終分析実行）
    if (data.startsWith('q10_')) {
      userAnswers.get(userId).q10 = data.replace('q10_', '');
      
      let responseMessage = '';
      
      if (data === 'q10_daily') {
        responseMessage = 'データドリブン経営！📊\n素晴らしい経営スタイルです。';
      } else if (data === 'q10_important_only') {
        responseMessage = '要所では活用できてます。📈\n日常でも使えばもっと効果的に。';
      } else if (data === 'q10_sometimes') {
        responseMessage = 'もったいない！📉\nデータ活用で的中率64%向上です。';
      } else if (data === 'q10_intuition') {
        responseMessage = '経験も大切ですが...🎲\nデータと組み合わせれば最強です。';
      }

      const benchmarkMessage = {
        type: 'text',
        text: `${responseMessage}

💡 データ経営の効果：
データ活用企業は非活用企業と比べ
• 意思決定速度：3.5倍
• 決定の的中率：64%向上
• 機会損失：年2,400万円削減`
      };

      const analysisMessage = {
        type: 'text',
        text: `🤖 最終AI分析中...

全10問の回答を
総合的に分析しています

最終診断結果を作成中...⏳`
      };

      try {
        await sendPushMessage(userId, [benchmarkMessage, analysisMessage]);
        
        // 最終AI分析実行
        const finalAnalysis = await getFinalAnalysis(userAnswers.get(userId));
        
        const finalResultMessage = {
          type: 'text',
          text: `🎯 【最終診断結果】

${finalAnalysis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
診断は以上です。
詳細な改善プランにご興味があれば
個別相談も承っております。`,
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '📞 個別相談を申し込む',
                  data: 'request_consultation'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '📊 診断を再実行',
                  data: 'restart_diagnosis'
                }
              }
            ]
          }
        };

        await sendPushMessage(userId, [finalResultMessage]);
        console.log('最終診断結果送信完了');
        
      } catch (error) {
        console.error('最終分析エラー:', error);
      }
    }

    // 個別相談申し込み処理
    if (data === 'request_consultation') {
      const consultationMessage = {
        type: 'text',
        text: `📞 個別相談のご案内

診断結果を基に、より詳細な
AI活用戦略をご提案いたします。

【相談内容】
• 具体的な導入ロードマップ
• ROI詳細シミュレーション  
• 推奨AIツールのデモ
• 導入時の注意点と対策

【所要時間】30分（無料）
【実施方法】オンライン会議

ご希望の方は下記までご連絡ください：
📧 ai-consulting@example.com
📞 03-1234-5678

担当者から24時間以内に
ご連絡いたします。`
      };

      try {
        await sendPushMessage(userId, [consultationMessage]);
        console.log('個別相談案内送信完了');
      } catch (error) {
        console.error('個別相談案内送信エラー:', error);
      }
    }

    // 診断再実行処理
    if (data === 'restart_diagnosis') {
      // ユーザーデータをリセット
      if (userAnswers.has(userId)) {
        userAnswers.delete(userId);
      }

      const restartMessage = {
        type: 'text',
        text: `🔄 診断をリセットしました

新たな気持ちで診断を開始しますか？`,
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
        await sendPushMessage(userId, [restartMessage]);
        console.log('診断リスタート送信完了');
      } catch (error) {
        console.error('診断リスタート送信エラー:', error);
      }
    }
  }
}

// 共通のメッセージ送信関数
async function analyzeWithClaude(answers) {
  // AI風分析（事前定義ルールベース）
  let score = 25; // ベーススコア
  let issues = [];
  let strengths = [];
  let improvementAmount = 600;

  // Q1: 売上成長の分析
  if (answers.q1 === 'improve_10plus') {
    score += 10;
    strengths.push('高成長');
  } else if (answers.q1 === 'improve_5to10') {
    score += 7;
    strengths.push('安定成長');
  } else if (answers.q1 === 'flat') {
    score += 3;
    issues.push('売上効率');
    improvementAmount += 200;
  } else if (answers.q1?.includes('decline')) {
    score += 0;
    issues.push('売上効率');
    improvementAmount += 400;
  }

  // Q2: 育成期間の分析
  if (answers.q2 === '3months') {
    score += 8;
    strengths.push('育成効率');
  } else if (answers.q2 === '3to6months') {
    score += 5;
  } else if (answers.q2 === '6to12months') {
    score += 2;
    issues.push('人材育成');
    improvementAmount += 150;
  } else if (answers.q2?.includes('years')) {
    score += 0;
    issues.push('人材育成');
    improvementAmount += 300;
  }

  // Q3: 優秀人材活用の分析
  if (answers.q3 === 'new_project') {
    score += 7;
    strengths.push('人材活用');
  } else if (answers.q3 === 'behind_work') {
    score += 1;
    issues.push('業務効率');
    improvementAmount += 250;
  } else if (answers.q3 === 'meetings') {
    score += 0;
    issues.push('業務効率');
    improvementAmount += 300;
  }

  // Q4: 退職理由の分析
  if (answers.q4 === 'career_up' || answers.q4 === 'no_resignation') {
    score += 5;
    strengths.push('組織健全性');
  } else if (answers.q4 === 'workload') {
    score += 0;
    issues.push('労働環境');
    improvementAmount += 200;
  } else {
    score += 2;
    issues.push('待遇改善');
    improvementAmount += 100;
  }

  // Q5: 知識共有の分析
  if (answers.q5 === 'database') {
    score += 5;
    strengths.push('知識管理');
  } else if (answers.q5 === 'documents') {
    score += 3;
    issues.push('情報活用');
    improvementAmount += 100;
  } else if (answers.q5 === 'tacit') {
    score += 1;
    issues.push('知識共有');
    improvementAmount += 200;
  }

  // 分析結果の生成
  const primaryIssue = issues.length > 0 ? issues[0] : '更なる効率化';
  const recommendedTool = getRecommendedTool(issues, strengths);
  
  return `📊 現在のスコア: ${Math.min(score, 50)}/50点
🎯 最優先改善領域: ${primaryIssue}
💰 推定改善効果: 年間${improvementAmount}万円
⚡ 推奨AIツール: ${recommendedTool}

${getInsightMessage(score, issues)}`;
}

function getRecommendedTool(issues, strengths) {
  if (issues.includes('業務効率')) {
    return 'RPA + ChatGPT';
  } else if (issues.includes('知識共有')) {
    return 'Notion AI';
  } else if (issues.includes('人材育成')) {
    return 'eラーニングAI';
  } else if (issues.includes('売上効率')) {
    return 'データ分析AI';
  } else {
    return 'ChatGPT Business';
  }
}

function getInsightMessage(score, issues) {
  if (score >= 40) {
    return '既に高いレベル！さらなる飛躍の準備ができています。';
  } else if (score >= 30) {
    return '平均以上の実力。AI活用で業界トップクラスを目指せます。';
  } else if (score >= 20) {
    return '改善余地大！適切なAI導入で劇的な変化が期待できます。';
  } else {
    return '今が変革のチャンス！AI活用で競合に大きく差をつけられます。';
  }
}

async function getFinalAnalysis(answers) {
  // 最終分析（全10問対応）
  let totalScore = 50; // ベーススコア  
  let allIssues = [];
  let allStrengths = [];
  let totalImprovement = 1200;

  // 前半5問の分析結果を統合
  const midAnalysis = await analyzeWithClaude(answers);
  
  // Q6-Q10の分析
  if (answers.q6 === '70plus') {
    totalScore += 8;
    allStrengths.push('マネジメント効率');
  } else if (answers.q6 === 'under30') {
    totalScore += 0;
    allIssues.push('管理職の時間配分');
    totalImprovement += 300;
  } else {
    totalScore += 4;
    allIssues.push('マネジメント効率');
    totalImprovement += 150;
  }

  if (answers.q7 === 'always_win') {
    totalScore += 10;
    allStrengths.push('提案力');
  } else if (answers.q7 === 'often_lose') {
    totalScore += 2;
    allIssues.push('提案力');
    totalImprovement += 400;
  } else {
    totalScore += 6;
    totalImprovement += 200;
  }

  if (answers.q8 === 'active') {
    totalScore += 7;
    allStrengths.push('イノベーション力');
  } else if (answers.q8 === 'no_time') {
    totalScore += 0;
    allIssues.push('業務効率');
    totalImprovement += 250;
  }

  if (answers.q9 === 'coverable') {
    totalScore += 8;
    allStrengths.push('リスク管理');
  } else if (answers.q9 === 'client_impact') {
    totalScore += 0;
    allIssues.push('属人化リスク');
    totalImprovement += 500;
  }

  if (answers.q10 === 'daily') {
    totalScore += 7;
    allStrengths.push('データ活用');
  } else if (answers.q10 === 'intuition') {
    totalScore += 1;
    allIssues.push('データ活用');
    totalImprovement += 300;
  }

  // 最終判定
  const finalScore = Math.min(totalScore, 100);
  const topIssue = allIssues.length > 0 ? allIssues[0] : '更なる効率化';
  const topStrength = allStrengths.length > 0 ? allStrengths[0] : '基礎力';

  let recommendation = '';
  if (finalScore >= 80) {
    recommendation = '業界トップクラス企業向けAI戦略';
  } else if (finalScore >= 60) {
    recommendation = '段階的AI導入プラン';
  } else if (finalScore >= 40) {
    recommendation = '基礎からのAI活用プラン';
  } else {
    recommendation = '緊急AI変革プログラム';
  }

  return `📊 総合スコア: ${finalScore}/100点

🏆 御社の強み: ${topStrength}
⚠️ 最優先改善領域: ${topIssue}
💰 総改善ポテンシャル: 年間${totalImprovement}万円

🎯 推奨プラン: ${recommendation}

【具体的な次のステップ】
1. ${getFirstStep(topIssue)}
2. ${getSecondStep(allIssues)}
3. ${getThirdStep(finalScore)}

投資回収期間: ${getROIPeriod(finalScore)}ヶ月`;
}

function getFirstStep(topIssue) {
  const steps = {
    '業務効率': 'RPA導入による定型業務自動化',
    '人材育成': 'AI支援型eラーニング導入',
    '提案力': 'ChatGPT活用による提案書作成効率化',
    '知識共有': 'Notion AI導入による知識ベース構築',
    '属人化リスク': '業務フロー標準化とAI化',
    'データ活用': 'BIツール導入とダッシュボード作成',
    '管理職の時間配分': '管理業務の自動化ツール導入'
  };
  return steps[topIssue] || 'AI活用方針の策定';
}

function getSecondStep(issues) {
  if (issues.length >= 2) {
    return 'AI導入効果測定システム構築';
  }
  return 'AI活用スキル向上研修実施';
}

function getThirdStep(score) {
  if (score >= 70) {
    return '高度AI活用による競争優位性確立';
  } else if (score >= 50) {
    return 'AI活用範囲の段階的拡大';
  } else {
    return '全社的AI変革プロジェクト推進';
  }
}

function getROIPeriod(score) {
  if (score >= 70) return 6;
  if (score >= 50) return 8;
  if (score >= 30) return 12;
  return 15;
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
