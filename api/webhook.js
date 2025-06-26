}

// 詳細コメント関数
function getDetailedAnswerComment(answerData) {
  const detailedComments = {
    // Q1: 売上高
    'answer_q1_excellent': `驚異的な成長率！🚀
御社は既に業界のトップランナーですね。

💡 知ってましたか？
AI活用企業の87%が「一人当たり売上高」を
平均23%向上させています。`,
    
    'answer_q1_very_good': `順調な成長です！📈
さらにAI活用で加速できそうです。

💡 ベンチマーク：
この成長率は上位20%に入ります。`,
    
    'answer_q1_good': `安定した成長ですね。📊
AIで更なる飛躍が期待できます。`,
    
    'answer_q1_fair': `現状維持は後退と同じ...😐
競合はAIで生産性を20%以上改善しています。`,
    
    'answer_q1_poor': `厳しい状況ですね。😰
でも、AIなら少ない人数で売上向上が可能です。`,
    
    'answer_q1_critical': `今すぐ手を打つ必要があります！🚨
AI活用で劇的な改善事例があります。`,

    // Q2: 育成期間
    'answer_q2_excellent': `育成システムが優秀ですね！✨
AIでさらに効率化できます。`,
    
    'answer_q2_good': `標準的な育成期間です。🌱
AI活用で2ヶ月短縮した企業もあります。`,
    
    'answer_q2_fair': `もう少し短縮できそうです。⏰
育成期間半減で年間650万円の効果も。`,
    
    'answer_q2_poor': `育成に時間がかかりすぎかも...😓
AI支援で劇的に短縮可能です。`,
    
    'answer_q2_critical': `育成期間が長すぎます！😱
競合に人材を奪われるリスクが...`,

    // Q3-Q10も同様に（簡略版）
    'answer_q3_excellent': `理想的な時間の使い方です！💡
価値創造に集中できていますね。`,
    'answer_q3_poor': `優秀な人材が作業に忙殺...😔
AIなら彼らを解放できます。`,
    'answer_q3_fair': `育成は大切ですが...🤔
AI活用で指導時間も効率化できます。`,
    'answer_q3_bad': `もったいない！😭
優秀人材は戦略に集中すべきです。`,
    'answer_q3_perfect': `ワークライフバランス◎👏
生産性の高い組織ですね。`,

    'answer_q4_good': `前向きな退職は組織の健全性の証。🌟`,
    'answer_q4_fair': `待遇改善も大切ですが...💰
業務効率化で原資を作れます。`,
    'answer_q4_poor': `業務負荷での離職は危険信号！⚠️`,
    'answer_q4_bad': `成長実感は重要です。📚`,
    'answer_q4_excellent': `定着率が高い！👥
良い組織文化の表れです。`,
    'answer_q4_critical': `組織風土の改善が急務です。😰`,

    'answer_q5_excellent': `知識管理が進んでいます！📚`,
    'answer_q5_good': `惜しい！文書はあるのに...📁`,
    'answer_q5_fair': `バランス型ですね。🤹`,
    'answer_q5_poor': `暗黙知の宝庫ですね。🧠`,
    'answer_q5_bad': `危険な状態です！😨`,
    'answer_q5_critical': `知識は最重要資産です！💎`,

    'answer_q6_excellent': `理想的な状態！🎯`,
    'answer_q6_good': `まずまずですが...🤷`,
    'answer_q6_fair': `管理職が作業に忙殺...😵`,
    'answer_q6_poor': `深刻な状況です。😱`,
    'answer_q6_critical': `緊急事態です！🚨`,

    'answer_q7_excellent': `圧倒的な提案力！💪`,
    'answer_q7_good': `高い勝率ですね！🏆`,
    'answer_q7_fair': `もったいない...😅`,
    'answer_q7_poor': `提案力強化が急務！📝`,
    'answer_q7_critical': `危機的状況です...😰`,

    'answer_q8_excellent': `イノベーティブな組織！🚀`,
    'answer_q8_fair': `アイデアを形にしたい...💭`,
    'answer_q8_poor': `若手が諦めているかも...😔`,
    'answer_q8_bad': `日常業務に追われすぎ！😫`,
    'answer_q8_critical': `仕組みがないと始まらない。🔧`,

    'answer_q9_excellent': `属人化を防げています！👏`,
    'answer_q9_good': `ギリギリセーフ...😅`,
    'answer_q9_poor': `危険な属人化！🛑`,
    'answer_q9_bad': `最悪のシナリオ...😱`,
    'answer_q9_critical': `現実から目を背けずに！👀`,

    'answer_q10_excellent': `データドリブン経営！📊`,
    'answer_q10_good': `要所では活用できてます。📈`,
    'answer_q10_fair': `もったいない！📉`,
    'answer_q10_poor': `経験も大切ですが...🎲`,
    'answer_q10_critical': `データは宝の山！💰`
  };

  return detailedComments[answerData] || '貴重な回答をありがとうございます！🎯';
}

// プログレス表示機能
function getProgressMessage(questionNum) {
  if (questionNum === 3) {
    return `順調です！あと7問 📝
ここまでの回答から、
改善の余地が見えてきました...`;
  } else if (questionNum === 6) {
    return `折り返し地点！あと4問 🏃
興味深いパターンが
見えてきています...`;
  } else if (questionNum === 9) {
    return `ラスト1問！🏁
診断結果の準備を
始めています...`;
  }
  return null;
}

async function handleQuestionAnswer(replyToken, userId, answerData) {
  try {
    console.log(`Handling answer: ${answerData} from user: ${userId}`);
    
    const userData = userAnswers.get(userId);
    if (!userData) {
      await startDiagnosis(replyToken, userId);
      return;
    }
    
    // 回答を保存
    const questionNum = userData.currentQuestion;
    userData.answers[`q${questionNum}`] = answerData;
    
    // 回答ラベルマップ
    const answerLabels = {
      'answer_q1_excellent': '20%以上向上（急成長）',
      'answer_q1_very_good': '10-20%向上（高成長）',
      'answer_q1_good': '5-10%向上（安定成長）',
      'answer_q1_fair': 'ほぼ横ばい（±5%以内）',
      'answer_q1_poor': '5-15%減少',
      'answer_q1_critical': '15%以上減少（危機的）',
      'answer_q2_excellent': '3ヶ月以内（超効率）',
      'answer_q2_good': '3-6ヶ月（標準的）',
      'answer_q2_fair': '6ヶ月-1年（やや長い）',
      'answer_q2_poor': '1-2年（長期間）',
      'answer_q2_critical': '2年以上（課題あり）',
      'answer_q3_excellent': '新規プロジェクト・企画',
      'answer_q3_poor': '通常業務が追いつかない',
      'answer_q3_fair': '部下の指導・フォロー',
      'answer_q3_bad': '会議・報告書作成',
      'answer_q3_perfect': '残業はほぼない',
      'answer_q4_good': 'キャリアアップ転職',
      'answer_q4_fair': '給与・待遇への不満',
      'answer_q4_poor': '業務負荷・残業過多',
      'answer_q4_bad': '成長実感の欠如',
      'answer_q4_excellent': '退職者はいない',
      'answer_q4_critical': '人間関係・組織風土',
      'answer_q5_excellent': '体系化・DB化済み',
      'answer_q5_good': '文書化されているが散在',
      'answer_q5_fair': '一部文書化、一部暗黙知',
      'answer_q5_poor': '主にベテランの頭の中',
      'answer_q5_bad': '人が辞めると失われる',
      'answer_q5_critical': '特に管理していない',
      'answer_q6_excellent': '80%以上（理想的）',
      'answer_q6_good': '60-80%（良好）',
      'answer_q6_fair': '40-60%（普通）',
      'answer_q6_poor': '20-40%（問題あり）',
      'answer_q6_critical': '20%未満（緊急事態）',
      'answer_q7_excellent': '9割以上勝てる',
      'answer_q7_good': '7-8割は勝てる',
      'answer_q7_fair': '五分五分',
      'answer_q7_poor': '3-4割程度',
      'answer_q7_critical': '負けることが多い',
      'answer_q8_excellent': '活発に出て実行している',
      'answer_q8_fair': 'たまに出るが実現は少ない',
      'answer_q8_poor': 'ほとんど出てこない',
      'answer_q8_bad': '出ても検討する余裕なし',
      'answer_q8_critical': '提案する仕組みがない',
      'answer_q9_excellent': '他のメンバーでカバー可能',
      'answer_q9_good': 'なんとか回るが大変',
      'answer_q9_poor': '特定業務が完全に止まる',
      'answer_q9_bad': '取引先との関係に影響',
      'answer_q9_critical': '考えたくない状況',
      'answer_q10_excellent': '日常的にデータ活用',
      'answer_q10_good': '重要な決定時のみ活用',
      'answer_q10_fair': 'たまに参考にする程度',
      'answer_q10_poor': '勘と経験が中心',
      'answer_q10_critical': 'データがそもそもない'
    };
    
    const selectedAnswer = answerLabels[answerData] || '選択された回答';
    
    // 詳細コメントを使用
    const detailedComment = getDetailedAnswerComment(answerData);
    
    const confirmMessage = `✅ あなたの回答：${selectedAnswer}

${detailedComment}`;
    
    const messages = [
      {
        type: 'text',
        text: confirmMessage
      }
    ];
    
    // プログレス表示（3問、6問、9問で表示）
    const progressMsg = getProgressMessage(questionNum);
    if (progressMsg) {
      messages.push({
        type: 'text',
        text: progressMsg
      });
    }
    
    // 次の質問またはアクションボタン
    let nextAction;
    if (questionNum === 5) {
      nextAction = {
        type: 'postback',
        label: '🤖 AI中間分析を見る',
        data: 'show_intermediate_analysis'
      };
    } else if (questionNum === 10) {
      nextAction = {
        type: 'postback',
        label: '📊 最終結果を見る',
        data: 'show_final_results'
      };
    } else {
      nextAction = {
        type: 'postback',
        label: `▶️ 次の質問（${questionNum + 1}/10）`,
        data: `start_question_${questionNum + 1}`
      };
    }
    
    messages.push({
      type: 'template',
      altText: '次のアクション',
      template: {
        type: 'buttons',
        text: '次に進みますか？',
        actions: [nextAction]
      }
    });
    
    await client.replyMessage(replyToken, messages);
    
  } catch (error) {
    console.error('Error in handleQuestionAnswer:', error);
    await client.replyMessage(replyToken, {
      type: 'text',
      text: 'エラーが発生しました。「診断開始」と送信してやり直してください。'
    });
  }
}

async function showIntermediateAnalysis(replyToken, userId) {
  try {
    const userData = userAnswers.get(userId);
    if (!userData) return;
    
    // より詳細なスコア計算
    const answers = userData.answers;
    let score = 0;
    
    // 回答パターン分析
    const patterns = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      critical: 0
    };
    
    Object.values(answers).forEach(answer => {
      if (answer.includes('excellent') || answer.includes('perfect')) {
        score += 10;
        patterns.excellent++;
      } else if (answer.includes('very_good')) {
        score += 8;
        patterns.good++;
      } else if (answer.includes('good')) {
        score += 7;
        patterns.good++;
      } else if (answer.includes('fair')) {
        score += 5;
        patterns.fair++;
      } else if (answer.includes('poor')) {
        score += 2;
        patterns.poor++;
      } else if (answer.includes('bad')) {
        score += 1;
        patterns.poor++;
      } else if (answer.includes('critical')) {
        score += 0;
        patterns.critical++;
      }
    });
    
    // 分析結果の生成
    let primaryIssue = '業務効率化';
    let recommendedTool = 'ChatGPT Business';
    let estimatedEffect = '年間800万円';
    
    if (patterns.critical >= 2) {
      primaryIssue = '緊急体制立て直し';
      recommendedTool = '包括的AI変革プログラム';
      estimatedEffect = '年間1,500万円';
    } else if (patterns.poor >= 3) {
      primaryIssue = '基盤強化';
      recommendedTool = 'RPA + ChatGPT導入';
      estimatedEffect = '年間1,200万円';
    } else if (patterns.excellent >= 3) {
      primaryIssue = '更なる成長加速';
      recommendedTool = 'ChatGPT Enterprise + 高度AI';
      estimatedEffect = '年間2,000万円';
    }
    
    const analysisMessage = `🤖 【AI中間分析結果】

📊 現在のスコア: ${score}/50点
🎯 最優先改善領域: ${primaryIssue}
💰 推定改善効果: ${estimatedEffect}
⚡ 推奨AIツール: ${recommendedTool}

📋 パターン分析：
${patterns.excellent > 0 ? `✅ 優秀領域: ${patterns.excellent}項目` : ''}
${patterns.good > 0 ? `🟢 良好領域: ${patterns.good}項目` : ''}
${patterns.fair > 0 ? `🟡 改善余地: ${patterns.fair}項目` : ''}
${patterns.poor > 0 ? `🔴 要改善: ${patterns.poor}項目` : ''}
${patterns.critical > 0 ? `🚨 緊急対応: ${patterns.critical}項目` : ''}

後半の質問で、より詳細な
改善ポイントを特定していきます！`;

    await client.replyMessage(replyToken, [
      {
        type: 'text',
        text: analysisMessage
      },
      {
        type: 'template',
        altText: '後半に進む',
        template: {
          type: 'buttons',
          text: '残り5問で詳細分析を完了します',
          actions: [
            {
              type: 'postback',
              label: '▶️ 質問6に進む',
              data: 'continue_to_q6'
            }
          ]
        }
      }
    ]);
    
  } catch (error) {
    console.error('Error in showIntermediateAnalysis:', error);
  }
}

async function showFinalResults(replyToken, userId) {
  try {
    const userData = userAnswers.get(userId);
    if (!userData) return;
    
    // 全10問の詳細スコア計算
    const answers = userData.answers;
    let totalScore = 0;
    
    // より精密なスコアリング
    const scoreMap = {
      'answer_q1_excellent': 15, 'answer_q1_very_good': 12, 'answer_q1_good': 8, 'answer_q1_fair': 4, 'answer_q1_poor': 1, 'answer_q1_critical': 0,
      'answer_q2_excellent': 10, 'answer_q2_good': 8, 'answer_q2_fair': 5, 'answer_q2_poor': 2, 'answer_q2_critical': 0,
      'answer_q3_excellent': 10, 'answer_q3_perfect': 10, 'answer_q3_fair': 7, 'answer_q3_poor': 3, 'answer_q3_bad': 0,
      'answer_q4_excellent': 8, 'answer_q4_good': 8, 'answer_q4_fair': 4, 'answer_q4_bad': 3, 'answer_q4_poor': 2, 'answer_q4_critical': 1,
      'answer_q5_excellent': 10, 'answer_q5_good': 7, 'answer_q5_fair': 5, 'answer_q5_poor': 3, 'answer_q5_bad': 1, 'answer_q5_critical': 0,
      'answer_q6_excellent': 10, 'answer_q6_good': 7, 'answer_q6_fair': 4, 'answer_q6_poor': 2, 'answer_q6_critical': 0,
      'answer_q7_excellent': 10, 'answer_q7_good': 8, 'answer_q7_fair': 5, 'answer_q7_poor': 2, 'answer_q7_critical': 0,
      'answer_q8_excellent': 7, 'answer_q8_fair': 5, 'answer_q8_poor': 3, 'answer_q8_bad': 1, 'answer_q8_critical': 0,
      'answer_q9_excellent': 10, 'answer_q9_good': 7, 'answer_q9_poor': 3, 'answer_q9_bad': 1, 'answer_q9_critical': 0,
      'answer_q10_excellent': 10, 'answer_q10_good': 7, 'answer_q10_fair': 4, 'answer_q10_poor': 2, 'answer_q10_critical': 0
    };
    
    Object.values(answers).forEach(answer => {
      totalScore += scoreMap[answer] || 0;
    });
    
    // スコア別の詳細結果メッセージ
    let resultData;
    if (totalScore >= 80) {
      resultData = {
        title: '🏆 診断スコア：' + totalScore + '/100点',
        judgment: '【判定】業界トップクラス！',
        message: `すでに高いレベルにある御社。
でも、満足していませんよね？

AIを活用すれば、
今の2倍の成長速度も可能です。

【期待効果】
✅ 売上成長率：さらに+30%
✅ 業界No.1の生産性
✅ 人材が集まる企業に

トップ企業の次の一手を
一緒に考えませんか？`
      };
    } else if (totalScore >= 60) {
      resultData = {
        title: '🌟 診断スコア：' + totalScore + '/100点',
        judgment: '【判定】大きな成長余地あり！',
        message: `良い部分と改善点が
はっきり見えました。

今がチャンスです！

【改善可能額】
年間1,800万円〜2,500万円

【優先改善ポイント】
1. 業務効率化（最重要）
2. 人材活用度向上
3. 知識資産の活用

6ヶ月で上位20%に入れます。
詳細な改善プランをご提案します。`
      };
    } else if (totalScore >= 40) {
      resultData = {
        title: '⚡ 診断スコア：' + totalScore + '/100点',
        judgment: '【判定】今すぐ改善が必要',
        message: `残念ながら
業界平均をやや下回っています。

このままでは、
3年後に大きな差がつきます。

【緊急改善必要額】
年間2,500万円の損失を防げます

でも大丈夫。
適切な対策を打てば、
1年で業界上位に入れます。

まず何から始めるべきか
お伝えします。`
      };
    } else {
      resultData = {
        title: '🚨 診断スコア：' + totalScore + '/100点',
        judgment: '【判定】変革が急務！',
        message: `厳しい結果ですが、
これは「伸びしろ最大」
ということでもあります。

【現在の損失】
年間3,000万円以上

【朗報】
同じ状況から2年で
業界トップになった企業があります。

今なら間に合います。
緊急改善プランをご提案します。`
      };
    }
    
    const finalMessage = `${resultData.title}

${resultData.judgment}

${resultData.message}

【詳細分析レポート】
📧 個別相談で以下をご提供：
• 御社専用の改善ロードマップ
• 具体的なAIツール選定
• 投資対効果の詳細計算
• 成功事例との比較分析

【特別オファー】
診断実施企業限定：
初回相談60分→90分に無料延長！`;

    await client.replyMessage(replyToken, [
      {
        type: 'text',
        text: finalMessage
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
              uri: 'https://calendly.com/your-calendar'
            },
            {
              type: 'postback',
              label: '🔄 診断をやり直す',
              data: 'start_diagnosis'
            }
          ]
        }
      },
      {
        type: 'text',
        text: `📋 診断完了！

今回の診断結果から見える
御社の3つの重要ポイント：

1️⃣ ${getTopInsight(answers)}
2️⃣ 最も効果的なAI活用領域の特定
3️⃣ 6ヶ月での具体的改善プラン

これらの詳細について、
無料相談でお話しします。

📅 下記から都合の良い時間を
お選びください：
https://calendly.com/your-calendar

診断結果を同僚の方にも
シェアしていただけると嬉しいです！`
      }
    ]);
    
    // ログ出力
    console.log('Diagnosis completed for user:', userId, 'Score:', totalScore);
    
  } catch (error) {
    console.error('Error in showFinalResults:', error);
    await client.replyMessage(replyToken, {
      type: 'text',
      text: '結果の表示でエラーが発生しました。申し訳ございません。'
    });
  }
}

function getTopInsight(answers) {
  // 回答パターンから最も重要な洞察を抽出
  if (answers.q1 && answers.q1.includes('critical')) {
    return '売上急減への緊急対策が必要';
  } else if (answers.q3 && answers.q3.includes('poor')) {
    return '優秀人材の時間活用に大きな無駄';
  } else if (answers.q5 && answers.q5.includes('critical')) {
    return '知識流出リスクが極めて高い';
  } else if (answers.q9 && answers.q9.includes('bad')) {
    return '属人化による事業継続リスク';
  } else if (answers.q6 && answers.q6.includes('critical')) {
    return '管理職の機能不全状態';
  } else if (answers.q2 && answers.q2.includes('critical')) {
    return '人材育成システムの抜本改革';
  } else if (answers.q7 && answers.q7.includes('critical')) {
    return '提案力向上による売上回復';
  } else if (answers.q4 && answers.q4.includes('poor')) {
    return '離職率改善による組織安定化';
  } else {
    return '基礎的な業務効率化が最優先';
  }
}// Vercel用 LINEボット - AI活用診断システム（修正版・完全統合）
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
  
  if (event.type !== 'message' && event.type !== 'postback') {
    return;
  }

  const userId = event.source.userId;
  const replyToken = event.replyToken;
  let messageText = '';
  
  if (event.type === 'message' && event.message.type === 'text') {
    messageText = event.message.text;
  } else if (event.type === 'postback') {
    messageText = event.postback.data;
  } else {
    return;
  }
  
  console.log(`Processing message: ${messageText} from user: ${userId}`);
  
  // 診断開始の判定
  if (messageText === '診断開始' || 
      messageText === 'start_diagnosis' || 
      messageText.includes('診断') || 
      messageText === 'はじめる' ||
      messageText === '開始') {
    
    console.log('Starting diagnosis for user:', userId);
    await startDiagnosis(replyToken, userId);
    return;
  }
  
  // その他のメッセージ処理
  await processMessage(replyToken, userId, messageText);
}

async function startDiagnosis(replyToken, userId) {
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

    await client.replyMessage(replyToken, welcomeMessage);
    console.log('Welcome message sent successfully');
    
  } catch (error) {
    console.error('Error in startDiagnosis:', error);
    await client.replyMessage(replyToken, {
      type: 'text',
      text: '申し訳ございません。診断の開始でエラーが発生しました。もう一度「診断開始」と送信してください。'
    });
  }
}

async function processMessage(replyToken, userId, messageText) {
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
      
      await client.replyMessage(replyToken, initialMessage);
      return;
    }
    
    // 質問への回答処理
    if (messageText.startsWith('answer_q')) {
      await handleQuestionAnswer(replyToken, userId, messageText);
    } else if (messageText.startsWith('start_question_')) {
      const questionNum = parseInt(messageText.replace('start_question_', ''));
      await sendQuestion(replyToken, userId, questionNum);
    } else if (messageText === 'next_question') {
      const currentQ = userData.currentQuestion;
      await sendQuestion(replyToken, userId, currentQ + 1);
    } else if (messageText === 'show_intermediate_analysis') {
      await showIntermediateAnalysis(replyToken, userId);
    } else if (messageText === 'continue_to_q6') {
      await sendQuestion(replyToken, userId, 6);
    } else if (messageText === 'show_final_results') {
      await showFinalResults(replyToken, userId);
    } else {
      // その他のメッセージ
      await client.replyMessage(replyToken, {
        type: 'text',
        text: '診断を開始するには「診断開始」と送信してください。'
      });
    }
    
  } catch (error) {
    console.error('Error in processMessage:', error);
    await client.replyMessage(replyToken, {
      type: 'text',
      text: 'エラーが発生しました。「診断開始」と送信して最初からやり直してください。'
    });
  }
}

async function sendQuestion(replyToken, userId, questionNum) {
  try {
    console.log(`Sending question ${questionNum} to user ${userId}`);
    
    const userData = userAnswers.get(userId);
    if (!userData) {
      console.log('User data not found, redirecting to start');
      await startDiagnosis(replyToken, userId);
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
      },
      {
        text: `【質問3/10】先月、最も優秀な社員が残業した主な理由は？`,
        options: [
          { label: '新規プロジェクト・企画', data: 'answer_q3_excellent' },
          { label: '通常業務が追いつかない', data: 'answer_q3_poor' },
          { label: '部下の指導・フォロー', data: 'answer_q3_fair' },
          { label: '会議・報告書作成', data: 'answer_q3_bad' },
          { label: '残業はほぼない', data: 'answer_q3_perfect' }
        ]
      },
      {
        text: `【質問4/10】直近3ヶ月で退職した社員の主な理由は？`,
        options: [
          { label: 'キャリアアップ転職', data: 'answer_q4_good' },
          { label: '給与・待遇への不満', data: 'answer_q4_fair' },
          { label: '業務負荷・残業過多', data: 'answer_q4_poor' },
          { label: '成長実感の欠如', data: 'answer_q4_bad' },
          { label: '退職者はいない', data: 'answer_q4_excellent' },
          { label: '人間関係・組織風土', data: 'answer_q4_critical' }
        ]
      },
      {
        text: `【質問5/10】社内の「知識・ノウハウ」の共有状況は？`,
        options: [
          { label: '体系化・DB化済み', data: 'answer_q5_excellent' },
          { label: '文書化されているが散在', data: 'answer_q5_good' },
          { label: '一部文書化、一部暗黙知', data: 'answer_q5_fair' },
          { label: '主にベテランの頭の中', data: 'answer_q5_poor' },
          { label: '人が辞めると失われる', data: 'answer_q5_bad' },
          { label: '特に管理していない', data: 'answer_q5_critical' }
        ]
      },
      {
        text: `【質問6/10】管理職が「本来の仕事」に使える時間の割合は？`,
        options: [
          { label: '80%以上（理想的）', data: 'answer_q6_excellent' },
          { label: '60-80%（良好）', data: 'answer_q6_good' },
          { label: '40-60%（普通）', data: 'answer_q6_fair' },
          { label: '20-40%（問題あり）', data: 'answer_q6_poor' },
          { label: '20%未満（緊急事態）', data: 'answer_q6_critical' }
        ]
      },
      {
        text: `【質問7/10】「提案の質」で競合に勝てる自信は？`,
        options: [
          { label: '9割以上勝てる', data: 'answer_q7_excellent' },
          { label: '7-8割は勝てる', data: 'answer_q7_good' },
          { label: '五分五分', data: 'answer_q7_fair' },
          { label: '3-4割程度', data: 'answer_q7_poor' },
          { label: '負けることが多い', data: 'answer_q7_critical' }
        ]
      },
      {
        text: `【質問8/10】若手社員からの改善提案や新しいアイデアは？`,
        options: [
          { label: '活発に出て実行している', data: 'answer_q8_excellent' },
          { label: 'たまに出るが実現は少ない', data: 'answer_q8_fair' },
          { label: 'ほとんど出てこない', data: 'answer_q8_poor' },
          { label: '出ても検討する余裕なし', data: 'answer_q8_bad' },
          { label: '提案する仕組みがない', data: 'answer_q8_critical' }
        ]
      },
      {
        text: `【質問9/10】もし主力社員が突然1ヶ月休んだら？`,
        options: [
          { label: '他のメンバーでカバー可能', data: 'answer_q9_excellent' },
          { label: 'なんとか回るが大変', data: 'answer_q9_good' },
          { label: '特定業務が完全に止まる', data: 'answer_q9_poor' },
          { label: '取引先との関係に影響', data: 'answer_q9_bad' },
          { label: '考えたくない状況', data: 'answer_q9_critical' }
        ]
      },
      {
        text: `【質問10/10】データに基づいて意思決定する頻度は？`,
        options: [
          { label: '日常的にデータ活用', data: 'answer_q10_excellent' },
          { label: '重要な決定時のみ活用', data: 'answer_q10_good' },
          { label: 'たまに参考にする程度', data: 'answer_q10_fair' },
          { label: '勘と経験が中心', data: 'answer_q10_poor' },
          { label: 'データがそもそもない', data: 'answer_q10_critical' }
        ]
      }
    ];
    
    if (questionNum > questions.length) {
      await showFinalResults(replyToken, userId);
      return;
    }
    
    // 質問5完了後は中間分析を表示
    if (questionNum === 6 && userData.answers.q5) {
      await showIntermediateAnalysis(replyToken, userId);
      return;
    }
    
    const question = questions[questionNum - 1];
    
    // 5-6択の質問を2つのメッセージに分割（LINE制限対応）
    const firstHalf = question.options.slice(0, 3);
    const secondHalf = question.options.slice(3);
    
    const messages = [];
    
    // 最初のメッセージ（質問文 + 最初の3つの選択肢）
    messages.push({
      type: 'template',
      altText: `質問${questionNum}`,
      template: {
        type: 'buttons',
        text: question.text,
        actions: firstHalf.map(option => ({
          type: 'postback',
          label: option.label,
          data: option.data
        }))
      }
    });
    
    // 2つ目のメッセージ（残りの選択肢）
    if (secondHalf.length > 0) {
      messages.push({
        type: 'template',
        altText: '追加の選択肢',
        template: {
          type: 'buttons',
          text: '▼ その他の選択肢',
          actions: secondHalf.map(option => ({
            type: 'postback',
            label: option.label,
            data: option.data
          }))
        }
      });
    }
    
    await client.replyMessage(replyToken, messages);
    console.log(`Question ${questionNum} sent successfully`);
    
  } catch (error) {
    console.error('Error in sendQuestion:', error);
    await client.replyMessage(replyToken, {
      type: 'text',
      text: 'エラーが発生しました。「診断開始」と送信してやり直してください。'
    });
  }
}
