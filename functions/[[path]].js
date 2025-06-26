export async function onRequest(context) {
  const { request, env } = context;
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();
      console.log('Received webhook:', JSON.stringify(body));

      if (body.events && body.events.length > 0) {
        for (const event of body.events) {
          await handleEvent(event, env);
        }
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

async function handleEvent(event, env) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userId = event.source.userId;
    const messageText = event.message.text;

    if (messageText === '診断を始める' || messageText === 'start') {
      await startDiagnosis(userId, event.replyToken, env);
    } else {
      await handleAnswer(userId, messageText, event.replyToken, env);
    }
  } else if (event.type === 'postback') {
    const userId = event.source.userId;
    const data = event.postback.data;
    await handlePostback(userId, data, event.replyToken, env);
  }
}

async function startDiagnosis(userId, replyToken, env) {
  // ユーザー状態を初期化
  await resetUserProgress(userId, env);
  
  const welcomeMessage = {
    type: 'text',
    text: '【3分でわかる！あなたの会社の真の実力診断】\n\n' +
          'この診断は1,200社の実績データを基に、\n' +
          'あなたの会社の改善可能性を客観的に数値化します。\n\n' +
          '特に「人材の潜在能力」という\n' +
          '最も重要な資産に着目します。\n\n' +
          '全10問、3分程度で完了します。\n' +
          '準備はよろしいですか？'
  };

  const quickReply = {
    type: 'text',
    text: '診断を開始しますか？',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '診断開始',
            data: 'start_q1'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '後で',
            data: 'later'
          }
        }
      ]
    }
  };

  await sendReply(replyToken, [welcomeMessage, quickReply], env);
}

async function handlePostback(userId, data, replyToken, env) {
  if (data.startsWith('start_q')) {
    const questionNum = parseInt(data.replace('start_q', ''));
    await sendQuestion(userId, questionNum, replyToken, env);
  } else if (data.startsWith('q') && data.includes('_a')) {
    const parts = data.split('_');
    const questionNum = parseInt(parts[0].replace('q', ''));
    const answerIndex = parseInt(parts[1].replace('a', ''));
    await processAnswer(userId, questionNum, answerIndex, replyToken, env);
  } else if (data === 'later') {
    await sendReply(replyToken, [{
      type: 'text',
      text: 'いつでもお気軽にお声がけください！\n' +
            '診断をご希望の際は「診断を始める」と送信してくださいね。'
    }], env);
  }
}

async function sendQuestion(userId, questionNum, replyToken, env) {
  const questions = getQuestions();
  
  if (questionNum > questions.length) {
    await calculateAndSendResult(userId, replyToken, env);
    return;
  }

  const question = questions[questionNum - 1];
  
  const quickReplyItems = question.options.map((option, index) => ({
    type: 'action',
    action: {
      type: 'postback',
      label: option.text,
      data: `q${questionNum}_a${index}`
    }
  }));

  const message = {
    type: 'text',
    text: `【質問${questionNum}/10】\n\n${question.text}`,
    quickReply: {
      items: quickReplyItems
    }
  };

  await sendReply(replyToken, [message], env);
}

async function processAnswer(userId, questionNum, answerIndex, replyToken, env) {
  // デバッグメッセージ追加
  await sendReply(replyToken, [{
    type: 'text',
    text: `デバッグ: Q${questionNum} 回答${answerIndex} を処理中...`
  }], env);
  const questions = getQuestions();
  const questions = getQuestions();
  const question = questions[questionNum - 1];
  const selectedOption = question.options[answerIndex];
  
  // 回答を保存
  await saveAnswer(userId, questionNum, answerIndex, selectedOption.score, env);
  
  // ベンチマークメッセージを送信
  if (selectedOption.response) {
    await sendReply(replyToken, [{
      type: 'text',
      text: selectedOption.response
    }], env);
    
    // 少し待ってから次の質問
      }
  
  // 次の質問またはスコア表示
  if (questionNum < 10) {
    await sendQuestion(userId, questionNum + 1, replyToken, env);
  } else {
    await calculateAndSendResult(userId, replyToken, env);
  }
}

async function calculateAndSendResult(userId, replyToken, env) {
  const answers = await getUserAnswers(userId, env);
  const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
  
  // 結果メッセージを取得
  const resultMessage = getResultMessage(totalScore);
  
  // 結果を送信
  await sendReply(replyToken, [{
    type: 'text',
    text: resultMessage
  }], env);
  
  // 詳細レポートの案内
  const followUpMessage = {
    type: 'text',
    text: 'より詳細な分析レポートや改善提案について\n' +
          '個別にご相談いただけます。\n\n' +
          '30分の無料相談はいかがですか？',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '相談を申し込む',
            data: 'request_consultation'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '事例を見る',
            data: 'view_cases'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '後で検討',
            data: 'consider_later'
          }
        }
      ]
    }
  };
  
  await sendReply(replyToken, [followUpMessage], env);
  
  // Google Sheetsに記録
  await saveToGoogleSheets(userId, answers, totalScore, env);
}

async function handleAnswer(userId, messageText, replyToken, env) {
  // テキストでの回答処理（必要に応じて実装）
  await sendReply(replyToken, [{
    type: 'text',
    text: '診断を開始するには「診断を始める」と送信してください。'
  }], env);
}

function getResultMessage(score) {
  if (score >= 80) {
    return `【診断スコア：${score}/100点】\n\n【判定】業界トップクラス！\n\nすでに高いレベルにある御社。\nでも、満足していませんよね？\n\nAIを活用すれば、\n今の2倍の成長速度も可能です。\n\n【期待効果】\n・売上成長率：さらに+30%\n・業界No.1の生産性\n・人材が集まる企業に\n\nトップ企業の次の一手を\n一緒に考えませんか？`;
  } else if (score >= 60) {
    return `【診断スコア：${score}/100点】\n\n【判定】大きな成長余地あり！\n\n良い部分と改善点が\nはっきり見えました。\n\n今がチャンスです！\n\n【改善可能額】\n年間1,800万円〜2,500万円\n\n6ヶ月で上位20%に入れます。\n詳細な改善プランをご提案します。`;
  } else if (score >= 40) {
    return `【診断スコア：${score}/100点】\n\n【判定】今すぐ改善が必要\n\n残念ながら\n業界平均をやや下回っています。\n\nこのままでは、\n3年後に大きな差がつきます。\n\n【緊急改善必要額】\n年間2,500万円の損失を防げます\n\nでも大丈夫。\n適切な対策を打てば、\n1年で業界上位に入れます。`;
  } else {
    return `【診断スコア：${score}/100点】\n\n【判定】変革が急務！\n\n厳しい結果ですが、\nこれは「伸びしろ最大」\nということでもあります。\n\n【現在の損失】\n年間3,000万円以上\n\n【朗報】\n同じ状況から2年で\n業界トップになった企業があります。\n\n今なら間に合います。\n緊急改善プランをご提案します。`;
  }
}

function getQuestions() {
  return [
    {
      text: '昨年度と比較して、一人当たりの売上高は？',
      options: [
        { text: '10%以上向上', score: 15, response: '素晴らしい成長率です！\nさらにAIを活用すれば、この成長を加速できます。' },
        { text: '5-10%向上', score: 12, response: '順調な成長ですね！\nAI活用で2桁成長も見えてきます。' },
        { text: 'ほぼ横ばい', score: 7, response: '現状維持は後退と同じです...\n競合はAIで生産性を20%以上改善しています。' },
        { text: '5-10%減少', score: 3, response: '厳しい状況ですね。\nでも、AIなら少ない人数で売上向上が可能です。' },
        { text: '10%以上減少', score: 0, response: '今すぐ手を打つ必要があります！\nAI活用で劇的な改善事例があります。' }
      ]
    },
    {
      text: '新入社員が一人前になるまでの期間は？',
      options: [
        { text: '3ヶ月以内', score: 10, response: '育成システムが優秀ですね！\nAIでさらに効率化できます。' },
        { text: '3-6ヶ月', score: 8, response: '標準的な育成期間です。\nAI活用で2ヶ月短縮した企業もあります。' },
        { text: '6ヶ月-1年', score: 5, response: 'もう少し短縮できそうです。\n育成期間半減で年間650万円の効果も。' },
        { text: '1-2年', score: 2, response: '育成に時間がかかりすぎかも...\nAI支援で劇的に短縮可能です。' },
        { text: '2年以上', score: 0, response: '育成期間が長すぎます！\n競合に人材を奪われるリスクが...' }
      ]
    },
    {
      text: '先月、最も優秀な社員が残業した主な理由は？',
      options: [
        { text: '新規プロジェクト', score: 10, response: '理想的な時間の使い方です！\n価値創造に集中できていますね。' },
        { text: '通常業務が追いつかない', score: 3, response: '優秀な人材が作業に忙殺されています...\nAIなら彼らを解放できます。' },
        { text: '部下の指導', score: 7, response: '育成は大切ですが...\nAI活用で指導時間も効率化できます。' },
        { text: '会議・報告書', score: 0, response: 'もったいない！\n優秀人材は戦略に集中すべきです。' },
        { text: '残業はほぼない', score: 10, response: 'ワークライフバランス良好！\n生産性の高い組織ですね。' }
      ]
    },
    {
      text: '直近3ヶ月で退職した社員の主な理由は？',
      options: [
        { text: 'キャリアアップ', score: 8, response: '前向きな退職は組織の健全性の証。\n卒業生ネットワークは財産です。' },
        { text: '給与・待遇', score: 4, response: '待遇改善も大切ですが...\n業務効率化で原資を作れます。' },
        { text: '業務負荷', score: 2, response: '業務負荷での離職は危険信号！\nAIで業務を30%削減できます。' },
        { text: '成長実感の欠如', score: 3, response: '成長実感は重要です。\nAI活用でスキルアップ機会を。' },
        { text: '退職者はいない', score: 8, response: '定着率が高い！\n良い組織文化の表れです。' }
      ]
    },
    {
      text: '社内の「知識・ノウハウ」の共有状況は？',
      options: [
        { text: 'データベース化', score: 10, response: '知識管理が進んでいます！\nAIで更に活用度を高められます。' },
        { text: '文書化but散在', score: 7, response: '惜しい！文書はあるのに...\nAIで知識を統合・活用できます。' },
        { text: '頭の中', score: 3, response: '暗黙知の宝庫ですね。\nAIで見える化すれば財産に。' },
        { text: '人が辞めると失われる', score: 1, response: '危険な状態です！\n知識流出で年間850万円の損失リスク。' },
        { text: '特に管理なし', score: 0, response: '知識は最重要資産です！\n今すぐ対策が必要です。' }
      ]
    },
    {
      text: '管理職が「本来の仕事」に使える時間の割合は？',
      options: [
        { text: '70%以上', score: 10, response: '理想的な状態！\nマネジメントに集中できています。' },
        { text: '50-70%', score: 7, response: 'まずまずですが...\nもう少し戦略に時間を使いたいですね。' },
        { text: '30-50%', score: 4, response: '管理職が作業に忙殺されています...\nAIで本来の仕事に集中を。' },
        { text: '30%未満', score: 0, response: '緊急事態です！\n管理職の時給5000円が作業に...' },
        { text: '把握していない', score: 2, response: 'まず現状把握から。\n見えない問題は解決できません。' }
      ]
    },
    {
      text: '「提案の質」で競合に勝てる自信は？',
      options: [
        { text: '常に勝っている', score: 10, response: '圧倒的な提案力！\nAIでさらに差をつけましょう。' },
        { text: '7割は勝てる', score: 8, response: '高い勝率ですね！\nAIで9割勝利も可能です。' },
        { text: '五分五分', score: 5, response: 'もったいない...\nAIで提案作成70%高速化&質向上。' },
        { text: '負けることが多い', score: 2, response: '提案力強化が急務！\nAI活用で勝率45%向上の実績あり。' },
        { text: '比較したことがない', score: 3, response: '競合分析も大切です。\nまず現状把握から始めましょう。' }
      ]
    },
    {
      text: '若手社員からの改善提案や新しいアイデアは？',
      options: [
        { text: '活発に実行', score: 7, response: 'イノベーティブな組織！\n素晴らしい文化です。' },
        { text: 'たまに出るが実現少', score: 5, response: 'アイデアを形にしたい...\nAIで実現スピードを上げられます。' },
        { text: 'ほとんど出ない', score: 3, response: '若手が諦めているかも...\n環境改善が必要です。' },
        { text: '検討する余裕なし', score: 1, response: '日常業務に追われすぎ！\nAIで時間を作りましょう。' },
        { text: '提案する仕組みなし', score: 0, response: '仕組みがないと始まらない。\nまず環境整備から。' }
      ]
    },
    {
      text: 'もし主力社員が突然1ヶ月休んだら？',
      options: [
        { text: 'カバー可能', score: 10, response: '属人化を防げています！\nリスク管理が優秀です。' },
        { text: 'なんとか回る', score: 7, response: 'ギリギリセーフ...\nもう少し余裕を持ちたいですね。' },
        { text: '業務が止まる', score: 3, response: '危険な属人化！\n年間850万円の損失リスクです。' },
        { text: '取引先に影響', score: 1, response: '最悪のシナリオ...\n今すぐ対策が必要です！' },
        { text: '考えたくない', score: 0, response: '現実から目を背けずに！\nリスクは必ず顕在化します。' }
      ]
    },
    {
      text: 'データに基づいて意思決定する頻度は？',
      options: [
        { text: '日常的に活用', score: 10, response: 'データドリブン経営！\n素晴らしい経営スタイルです。' },
        { text: '重要な決定時のみ', score: 7, response: '要所では活用できてます。\n日常でも使えばもっと効果的に。' },
        { text: 'たまに参考', score: 4, response: 'もったいない！\nデータ活用で的中率64%向上です。' },
        { text: '勘と経験中心', score: 2, response: '経験も大切ですが...\nデータと組み合わせれば最強です。' },
        { text: 'データがない', score: 0, response: 'データは宝の山！\nまず収集から始めましょう。' }
      ]
    }
  ];
}

async function sendReply(replyToken, messages, env) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: messages
    })
  });

  if (!response.ok) {
    console.error('Failed to send reply:', await response.text());
  }
}

async function resetUserProgress(userId, env) {
  // KVに保存された進捗をリセット
  await env.USER_PROGRESS.delete(userId);
}

async function saveAnswer(userId, questionNum, answerIndex, score, env) {
  const key = `${userId}_answers`;
  let answers = [];
  
  try {
    const existingData = await env.USER_PROGRESS.get(key);
    if (existingData) {
      answers = JSON.parse(existingData);
    }
  } catch (error) {
    console.error('Error reading existing answers:', error);
  }
  
  answers.push({
    questionNum,
    answerIndex,
    score,
    timestamp: new Date().toISOString()
  });
  
  await env.USER_PROGRESS.put(key, JSON.stringify(answers));
}

async function getUserAnswers(userId, env) {
  const key = `${userId}_answers`;
  try {
    const data = await env.USER_PROGRESS.get(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting user answers:', error);
    return [];
  }
}

async function saveToGoogleSheets(userId, answers, totalScore, env) {
  // Google Sheets APIへの保存は後で実装
  console.log('Saving to Google Sheets:', { userId, answers, totalScore });
}
