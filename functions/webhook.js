// AI活用診断LINEボット - Cloudflare Pages版
const line = require('@line/bot-sdk');

// ユーザーセッション管理（メモリ内）
const userSessions = new Map();

// 診断質問データ
const questions = [
  {
    text: "Q1. 昨年度と比較して、一人当たりの売上高は？",
    options: [
      { text: "10%以上向上", score: 15 },
      { text: "5-10%向上", score: 12 },
      { text: "ほぼ横ばい", score: 7 },
      { text: "5-10%減少", score: 3 },
      { text: "10%以上減少", score: 0 }
    ]
  },
  {
    text: "Q2. 新入社員が一人前になるまでの期間は？",
    options: [
      { text: "3ヶ月以内", score: 10 },
      { text: "3-6ヶ月", score: 8 },
      { text: "6ヶ月-1年", score: 5 },
      { text: "1-2年", score: 2 },
      { text: "2年以上", score: 0 }
    ]
  },
  {
    text: "Q3. 先月、最も優秀な社員が残業した主な理由は？",
    options: [
      { text: "新規プロジェクト", score: 10 },
      { text: "通常業務が追いつかない", score: 3 },
      { text: "部下の指導", score: 7 },
      { text: "会議・報告書", score: 0 },
      { text: "残業はほぼない", score: 10 }
    ]
  },
  {
    text: "Q4. 直近3ヶ月で退職した社員の主な理由は？",
    options: [
      { text: "キャリアアップ", score: 8 },
      { text: "給与・待遇", score: 4 },
      { text: "業務負荷", score: 2 },
      { text: "成長実感の欠如", score: 3 },
      { text: "退職者はいない", score: 8 }
    ]
  },
  {
    text: "Q5. 社内の「知識・ノウハウ」の共有状況は？",
    options: [
      { text: "データベース化", score: 10 },
      { text: "文書化but散在", score: 7 },
      { text: "頭の中", score: 3 },
      { text: "人が辞めると失われる", score: 1 },
      { text: "特に管理なし", score: 0 }
    ]
  },
  {
    text: "Q6. 管理職が「本来の仕事」に使える時間の割合は？",
    options: [
      { text: "70%以上", score: 10 },
      { text: "50-70%", score: 7 },
      { text: "30-50%", score: 4 },
      { text: "30%未満", score: 0 },
      { text: "把握していない", score: 2 }
    ]
  },
  {
    text: "Q7. 「提案の質」で競合に勝てる自信は？",
    options: [
      { text: "常に勝っている", score: 10 },
      { text: "7割は勝てる", score: 8 },
      { text: "五分五分", score: 5 },
      { text: "負けることが多い", score: 2 },
      { text: "比較したことがない", score: 3 }
    ]
  },
  {
    text: "Q8. 若手社員からの改善提案や新しいアイデアは？",
    options: [
      { text: "活発に実行", score: 7 },
      { text: "たまに出るが実現少", score: 5 },
      { text: "ほとんど出ない", score: 3 },
      { text: "検討する余裕なし", score: 1 },
      { text: "提案する仕組みなし", score: 0 }
    ]
  },
  {
    text: "Q9. もし主力社員が突然1ヶ月休んだら？",
    options: [
      { text: "カバー可能", score: 10 },
      { text: "なんとか回る", score: 7 },
      { text: "業務が止まる", score: 3 },
      { text: "取引先に影響", score: 1 },
      { text: "考えたくない", score: 0 }
    ]
  },
  {
    text: "Q10. データに基づいて意思決定する頻度は？",
    options: [
      { text: "日常的に活用", score: 10 },
      { text: "重要な決定時のみ", score: 7 },
      { text: "たまに参考", score: 4 },
      { text: "勘と経験中心", score: 2 },
      { text: "データがない", score: 0 }
    ]
  }
];

// スコア計算関数
function calculateTotalScore(answers) {
  let totalScore = 0;
  for (let i = 0; i < answers.length; i++) {
    const question = questions[i];
    const selectedOption = question.options.find(opt => opt.text === answers[i]);
    if (selectedOption) {
      totalScore += selectedOption.score;
    }
  }
  return totalScore;
}

// 診断結果メッセージ生成
function generateResultMessage(score) {
  if (score >= 80) {
    return ` 診断スコア：${score}/100点\n\n【判定】業界トップクラス！\n\nすでに高いレベルにある御社。\nでも、満足していませんよね？\n\nAIを活用すれば、\n今の2倍の成長速度も可能です。\n\n【期待効果】\n 売上成長率：さらに+30%\n 業界No.1の生産性\n 人材が集まる企業に\n\nトップ企業の次の一手を\n一緒に考えませんか？`;
  } else if (score >= 60) {
    return ` 診断スコア：${score}/100点\n\n【判定】大きな成長余地あり！\n\n良い部分と改善点が\nはっきり見えました。\n\n今がチャンスです！\n\n【改善可能額】\n年間1,800万円〜2,500万円\n\n6ヶ月で上位20%に入れます。\n詳細な改善プランをご提案します。`;
  } else if (score >= 40) {
    return ` 診断スコア：${score}/100点\n\n【判定】今すぐ改善が必要\n\n残念ながら\n業界平均をやや下回っています。\n\nこのままでは、\n3年後に大きな差がつきます。\n\n【緊急改善必要額】\n年間2,500万円の損失を防げます\n\nでも大丈夫。\n適切な対策を打てば、\n1年で業界上位に入れます。`;
  } else {
    return ` 診断スコア：${score}/100点// AI活用診断LINEボット - Cloudflare Pages版
const line = require('@line/bot-sdk');

// ユーザーセッション管理（メモリ内）
const userSessions = new Map();

// 診断質問データ
const questions = [
  {
    text: "Q1. 昨年度と比較して、一人当たりの売上高は？",
    options: [
      { text: "10%以上向上", score: 15 },
      { text: "5-10%向上", score: 12 },
      { text: "ほぼ横ばい", score: 7 },
      { text: "5-10%減少", score: 3 },
      { text: "10%以上減少", score: 0 }
    ]
  },
  {
    text: "Q2. 新入社員が一人前になるまでの期間は？",
    options: [
      { text: "3ヶ月以内", score: 10 },
      { text: "3-6ヶ月", score: 8 },
      { text: "6ヶ月-1年", score: 5 },
      { text: "1-2年", score: 2 },
      { text: "2年以上", score: 0 }
    ]
  },
  {
    text: "Q3. 先月、最も優秀な社員が残業した主な理由は？",
    options: [
      { text: "新規プロジェクト", score: 10 },
      { text: "通常業務が追いつかない", score: 3 },
      { text: "部下の指導", score: 7 },
      { text: "会議・報告書", score: 0 },
      { text: "残業はほぼない", score: 10 }
    ]
  },
  {
    text: "Q4. 直近3ヶ月で退職した社員の主な理由は？",
    options: [
      { text: "キャリアアップ", score: 8 },
      { text: "給与・待遇", score: 4 },
      { text: "業務負荷", score: 2 },
      { text: "成長実感の欠如", score: 3 },
      { text: "退職者はいない", score: 8 }
    ]
  },
  {
    text: "Q5. 社内の「知識・ノウハウ」の共有状況は？",
    options: [
      { text: "データベース化", score: 10 },
      { text: "文書化but散在", score: 7 },
      { text: "頭の中", score: 3 },
      { text: "人が辞めると失われる", score: 1 },
      { text: "特に管理なし", score: 0 }
    ]
  },
  {
    text: "Q6. 管理職が「本来の仕事」に使える時間の割合は？",
    options: [
      { text: "70%以上", score: 10 },
      { text: "50-70%", score: 7 },
      { text: "30-50%", score: 4 },
      { text: "30%未満", score: 0 },
      { text: "把握していない", score: 2 }
    ]
  },
  {
    text: "Q7. 「提案の質」で競合に勝てる自信は？",
    options: [
      { text: "常に勝っている", score: 10 },
      { text: "7割は勝てる", score: 8 },
      { text: "五分五分", score: 5 },
      { text: "負けることが多い", score: 2 },
      { text: "比較したことがない", score: 3 }
    ]
  },
  {
    text: "Q8. 若手社員からの改善提案や新しいアイデアは？",
    options: [
      { text: "活発に実行", score: 7 },
      { text: "たまに出るが実現少", score: 5 },
      { text: "ほとんど出ない", score: 3 },
      { text: "検討する余裕なし", score: 1 },
      { text: "提案する仕組みなし", score: 0 }
    ]
  },
  {
    text: "Q9. もし主力社員が突然1ヶ月休んだら？",
    options: [
      { text: "カバー可能", score: 10 },
      { text: "なんとか回る", score: 7 },
      { text: "業務が止まる", score: 3 },
      { text: "取引先に影響", score: 1 },
      { text: "考えたくない", score: 0 }
    ]
  },
  {
    text: "Q10. データに基づいて意思決定する頻度は？",
    options: [
      { text: "日常的に活用", score: 10 },
      { text: "重要な決定時のみ", score: 7 },
      { text: "たまに参考", score: 4 },
      { text: "勘と経験中心", score: 2 },
      { text: "データがない", score: 0 }
    ]
  }
];

// スコア計算関数
function calculateTotalScore(answers) {
  let totalScore = 0;
  for (let i = 0; i < answers.length; i++) {
    const question = questions[i];
    const selectedOption = question.options.find(opt => opt.text === answers[i]);
    if (selectedOption) {
      totalScore += selectedOption.score;
    }
  }
  return totalScore;
}

// 診断結果メッセージ生成
function generateResultMessage(score) {
  if (score >= 80) {
return `診断スコア：${score}/100点\n\n【判定】業界トップクラス！\n\nすでに高いレベルにある御社。\nでも、満足していませんよね？\n\nAIを活用すれば、\n今の2倍の成長速度も可能です。\n\n【期待効果】\n売上成長率：さらに+30%\n業界No.1の生産性\n人材が集まる企業に\n\nトップ企業の次の一手を\n一緒に考えませんか？`;
  } else if (score >= 60) {
    return `診断スコア：${score}/100点\n\n【判定】大きな成長余地あり！\n\n良い部分と改善点が\nはっきり見えました。\n\n今がチャンスです！\n\n【改善可能額】\n年間1,800万円〜2,500万円\n\n6ヶ月で上位20%に入れます。\n詳細な改善プランをご提案します。`;
  } else if (score >= 40) {
    return `診断スコア：${score}/100点\n\n【判定】今すぐ改善が必要\n\n残念ながら\n業界平均をやや下回っています。\n\nこのままでは、\n3年後に大きな差がつきます。\n\n【緊急改善必要額】\n年間2,500万円の損失を防げます\n\nでも大丈夫。\n適切な対策を打てば、\n1年で業界上位に入れます。`;
  } else {
    return `診断スコア：${score}/100点\n\n【判定】変革が急務！\n\n厳しい結果ですが、\nこれは「伸びしろ最大」\nということでもあります。\n\n【現在の損失】\n年間3,000万円以上\n\n【朗報】\n同じ状況から2年で\n業界トップになった企業があります。\n\n今なら間に合います。\n緊急改善プランをご提案します。`;
  }
}

// メッセージハンドラー
async function handleEvent(event, env) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const config = {
    channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: env.LINE_CHANNEL_SECRET
  };
  const client = new line.Client(config);

  const userId = event.source.userId;
  const messageText = event.message.text.trim();

  // セッション取得または初期化
  if (!userSessions.has(userId)) {
    userSessions.set(userId, {
      currentQuestion: 0,
      answers: [],
      started: false
    });
  }

  const session = userSessions.get(userId);

  // 診断開始
  if (messageText === '診断開始' || messageText === 'スタート' || !session.started) {
    session.started = true;
    session.currentQuestion = 0;
    session.answers = [];

    const firstQuestion = questions[0];
    const quickReplyItems = firstQuestion.options.map(option => ({
      type: 'action',
      action: {
        type: 'message',
        label: option.text,
        text: option.text
      }
    }));

    const replyMessage = {
      type: 'text',
      text: ` AI活用診断を開始します！\n\n${firstQuestion.text}`,
      quickReply: {
        items: quickReplyItems
      }
    };

    return client.replyMessage(event.replyToken, replyMessage);
  }

  // 診断中の回答処理
  if (session.started && session.currentQuestion < questions.length) {
    const currentQuestion = questions[session.currentQuestion];
    const validOptions = currentQuestion.options.map(opt => opt.text);

    if (validOptions.includes(messageText)) {
      session.answers.push(messageText);
      session.currentQuestion++;

      // 次の質問または結果表示
      if (session.currentQuestion < questions.length) {
        // 次の質問
        const nextQuestion = questions[session.currentQuestion];
        const quickReplyItems = nextQuestion.options.map(option => ({
          type: 'action',
          action: {
            type: 'message',
            label: option.text,
            text: option.text
          }
        }));

        const replyMessage = {
          type: 'text',
          text: `【質問${session.currentQuestion + 1}/10】\n\n${nextQuestion.text}`,
          quickReply: {
            items: quickReplyItems
          }
        };

        return client.replyMessage(event.replyToken, replyMessage);
      } else {
        // 診断完了 - 結果表示
        const score = calculateTotalScore(session.answers);
        const resultMessage = generateResultMessage(score);

        // セッションリセット
        userSessions.delete(userId);

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: resultMessage + '\n\n新しい診断を始めるには「診断開始」と送信してください。'
        });
      }
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '上のボタンから選択してください。'
      });
    }
  }

  // デフォルトメッセージ
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: 'AI活用診断を開始するには「診断開始」と送信してください。'
  });
}

// Cloudflare Pages Functions用のエクスポート
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const signature = request.headers.get('x-line-signature');

    if (!signature) {
      return new Response('Unauthorized', { status: 401 });
    }

    const events = body.events;

    if (events && events.length > 0) {
      await Promise.all(events.map(event => handleEvent(event, env)));
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// GET リクエスト用（ヘルスチェック）
export async function onRequestGet() {
  return new Response('AI Diagnosis Bot is running on Cloudflare Pages!', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
