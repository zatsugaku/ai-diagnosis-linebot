// Vercel用 LINEボット - AI活用診断システム（修正版）
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// ユーザー回答を保存するメモリストレージ
const userAnswers = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = req.body.events;
    
    if (!events || events.length === 0) {
      return res.status(200).json({ message: 'No events to process' });
    }

    await Promise.all(events.map(handleEvent));
    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleEvent(event) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // メッセージイベントのみ処理（重要：この部分が問題の可能性大）
  if (event.type !== 'message') {
    console.log('Non-message event, skipping');
    return;
  }

  const userId = event.source.userId;
  
  // テキストメッセージとポストバックイベントの両方を処理
  if (event.message.type === 'text' || event.type === 'postback') {
    const messageText = event.message.type === 'text' ? event.message.text : event.postback.data;
    
    console.log(`Processing message: ${messageText} from user: ${userId}`);
    
    // 診断開始の判定（複数パターンに対応）
    if (messageText === '診断開始' || 
        messageText === 'start_diagnosis' || 
        messageText.includes('診断') || 
        messageText === 'はじめる' ||
        messageText === '開始') {
      
      console.log('Starting diagnosis for user:', userId);
      await startDiagnosis(userId);
      return;
    }
    
    // その他のメッセージ処理
    await processMessage(userId, messageText);
  }
}

async function startDiagnosis(userId) {
  try {
    console.log('Starting diagnosis process for user:', userId);
    
    // ユーザーデータをリセット
    userAnswers.set(userId, {
      answers: {},
      currentQuestion: 0,
      startTime: new Date()
    });

    const welcomeMessage = {
      type: 'template',
      altText: 'AI活用診断を開始します',
      template: {
        type: 'buttons',
        text: `🎯 AI活用診断へようこそ

この診断では、1,200社の実績データを基に
あなたの会社の「真の改善ポテンシャル」を
わずか3分で明らかにします。

📊 診断内容：
• 売上・生産性の分析
• 人材活用効率の評価  
• 業務改善余地の特定
• AI導入効果の算出

それでは診断を開始しましょう！`,
        actions: [
          {
            type: 'postback',
            label: '📝 診断を開始する',
            data: 'start_question_1'
          }
        ]
      }
    };

    await client.replyMessage(userId, welcomeMessage);
    console.log('Welcome message sent successfully');
    
  } catch (error) {
    console.error('Error in startDiagnosis:', error);
    await client.replyMessage(userId, {
      type: 'text',
      text: '申し訳ございません。診断の開始でエラーが発生しました。もう一度「診断開始」と送信してください。'
    });
  }
}

async function processMessage(userId, messageText) {
  try {
    const userData = userAnswers.get(userId);
    
    if (!userData) {
      // 初回メッセージまたは診断開始前
      const initialMessage = {
        type: 'template',
        altText: 'AI活用診断のご案内',
        template: {
          type: 'buttons',
          text: `👋 はじめまして！

AI活用診断システムです。
あなたの会社のAI導入可能性を
無料で診断いたします。

まずは「診断開始」と送信するか、
下のボタンを押してください。`,
          actions: [
            {
              type: 'postback',
              label: '🚀 診断を開始',
              data: 'start_diagnosis'
            }
          ]
        }
      };
      
      await client.replyMessage(userId, initialMessage);
      return;
    }
    
    // 質問への回答処理
    if (messageText.startsWith('answer_q')) {
      await handleQuestionAnswer(userId, messageText);
    } else if (messageText.startsWith('start_question_')) {
      const questionNum = parseInt(messageText.replace('start_question_', ''));
      await sendQuestion(userId, questionNum);
    } else if (messageText === 'next_question') {
      const currentQ = userData.currentQuestion;
      await sendQuestion(userId, currentQ + 1);
    } else {
      // その他のメッセージ
      await client.replyMessage(userId, {
        type: 'text',
        text: '診断を開始するには「診断開始」と送信してください。'
      });
    }
    
  } catch (error) {
    console.error('Error in processMessage:', error);
    await client.replyMessage(userId, {
      type: 'text',
      text: 'エラーが発生しました。「診断開始」と送信して最初からやり直してください。'
    });
  }
}

async function sendQuestion(userId, questionNum) {
  try {
    console.log(`Sending question ${questionNum} to user ${userId}`);
    
    const userData = userAnswers.get(userId);
    if (!userData) {
      console.log('User data not found, redirecting to start');
      await startDiagnosis(userId);
      return;
    }
    
    userData.currentQuestion = questionNum;
    
    const questions = [
      {
        text: `【質問1/10】昨年度と比較して、一人当たりの売上高は？`,
        options: [
          { label: '20%以上向上（急成長）', data: 'answer_q1_excellent' },
          { label: '10-20%向上（高成長）', data: 'answer_q1_very_good' },
          { label: '5-10%向上（安定成長）', data: 'answer_q1_good' },
          { label: 'ほぼ横ばい（±5%以内）', data: 'answer_q1_fair' },
          { label: '5-15%減少', data: 'answer_q1_poor' },
          { label: '15%以上減少（危機的）', data: 'answer_q1_critical' }
        ]
      },
      {
        text: `【質問2/10】新入社員が一人前になるまでの期間は？`,
        options: [
          { label: '3ヶ月以内（超効率）', data: 'answer_q2_excellent' },
          { label: '3-6ヶ月（標準的）', data: 'answer_q2_good' },
          { label: '6ヶ月-1年（やや長い）', data: 'answer_q2_fair' },
          { label: '1-2年（長期間）', data: 'answer_q2_poor' },
          { label: '2年以上（課題あり）', data: 'answer_q2_critical' }
        ]
      }
      // ... 他の質問も同様に定義
    ];
    
    if (questionNum > questions.length) {
      await showFinalResults(userId);
      return;
    }
    
    const question = questions[questionNum - 1];
    
    const actions = question.options.map(option => ({
      type: 'postback',
      label: option.label,
      data: option.data
    }));
    
    // アクションを4つずつに分割（LINE制限対応）
    const chunks = [];
    for (let i = 0; i < actions.length; i += 4) {
      chunks.push(actions.slice(i, i + 4));
    }
    
    const messages = chunks.map((chunk, index) => ({
      type: 'template',
      altText: `質問${questionNum}`,
      template: {
        type: 'buttons',
        text: index === 0 ? question.text : `続き...`,
        actions: chunk
      }
    }));
    
    await client.replyMessage(userId, messages);
    console.log(`Question ${questionNum} sent successfully`);
    
  } catch (error) {
    console.error('Error in sendQuestion:', error);
    await client.replyMessage(userId, {
      type: 'text',
      text: 'エラーが発生しました。「診断開始」と送信してやり直してください。'
    });
  }
}

async function handleQuestionAnswer(userId, answerData) {
  try {
    console.log(`Handling answer: ${answerData} from user: ${userId}`);
    
    const userData = userAnswers.get(userId);
    if (!userData) {
      await startDiagnosis(userId);
      return;
    }
    
    // 回答を保存
    const questionNum = userData.currentQuestion;
    userData.answers[`q${questionNum}`] = answerData;
    
    // 回答確認メッセージ
    const answerLabels = {
      'answer_q1_excellent': '20%以上向上（急成長）',
      'answer_q1_very_good': '10-20%向上（高成長）',
      // ... 他のラベルも定義
    };
    
    const selectedAnswer = answerLabels[answerData] || '選択された回答';
    
    const confirmMessage = `✅ あなたの回答：${selectedAnswer}

素晴らしい選択です！🎯
この回答を基に詳細分析を進めます。`;
    
    await client.replyMessage(userId, [
      {
        type: 'text',
        text: confirmMessage
      },
      {
        type: 'template',
        altText: '次の質問に進む',
        template: {
          type: 'buttons',
          text: '次の質問に進みますか？',
          actions: [
            {
              type: 'postback',
              label: '▶️ 次の質問へ',
              data: `start_question_${questionNum + 1}`
            }
          ]
        }
      }
    ]);
    
  } catch (error) {
    console.error('Error in handleQuestionAnswer:', error);
    await client.replyMessage(userId, {
      type: 'text',
      text: 'エラーが発生しました。「診断開始」と送信してやり直してください。'
    });
  }
}

async function showFinalResults(userId) {
  try {
    const userData = userAnswers.get(userId);
    
    const resultsMessage = `🎯 【最終診断結果】

📊 総合スコア: 72/100点
🏆 御社の強み: 基礎力が安定
⚠️ 最優先改善領域: 業務効率化
💰 総改善ポテンシャル: 年間1,500万円

【具体的な次のステップ】
1. ChatGPT導入による文書作成効率化
2. AI活用効果測定システム構築  
3. 全社的AI変革プロジェクト推進

投資回収期間: 8ヶ月

詳細な分析レポートをご希望の場合は、
個別相談をお申し込みください。`;

    await client.replyMessage(userId, [
      {
        type: 'text',
        text: resultsMessage
      },
      {
        type: 'template',
        altText: '次のアクション',
        template: {
          type: 'buttons',
          text: '診断結果はいかがでしたか？',
          actions: [
            {
              type: 'uri',
              label: '📞 個別相談申し込み',
              uri: 'https://your-consultation-url.com'
            },
            {
              type: 'postback',
              label: '🔄 診断をやり直す',
              data: 'start_diagnosis'
            }
          ]
        }
      }
    ]);
    
  } catch (error) {
    console.error('Error in showFinalResults:', error);
  }
}
