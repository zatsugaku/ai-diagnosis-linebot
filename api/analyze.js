import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: "AI診断API エンドポイント正常動作",
      version: "3.0-japanese-optimized"
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { totalScore, totalImprovement, detailedAnswers } = req.body;

    // データ検証
    if (typeof totalScore !== 'number' || typeof totalImprovement !== 'number' || !detailedAnswers || !Array.isArray(detailedAnswers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data format'
      });
    }

    // スコアレベルの判定
    const scoreLevel = getScoreLevel(totalScore);
    const performanceData = getPerformanceAnalysis(detailedAnswers);

    // ChatGPT API呼び出し
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたは日本企業のAI活用を専門とするトップコンサルタントです。

以下の厳格な要件に従って、企業向けAI活用診断レポートを作成してください：

【出力要件】
1. 完全日本語のみ使用（英語単語は一切使用禁止）
2. HTMLタグは一切使用しない（プレーンテキストのみ）
3. 冒頭に余計な文字列を含めない
4. 必ず「🤖 AI専門分析レポート」から開始
5. 文字数：1,800-2,200文字
6. 具体的な日本国内利用可能ツール名を含める
7. 数値は必ず日本円（万円）で表示

【構成】
🤖 AI専門分析レポート

📊 診断結果サマリー
総合スコア：XX点/100点
年間改善効果：XXXX万円

🔍 現状分析
（診断回答から読み取れる具体的な課題を3-4個指摘）

🎯 重要課題TOP3と解決策
1. 課題名
   具体的な日本国内ツール名（例：ChatGPT、kintone、Slack等）による解決策

2. 課題名  
   具体的解決策

3. 課題名
   具体的解決策

💡 段階別実装ロードマップ
第1段階（1-3ヶ月）：具体的アクション
第2段階（3-6ヶ月）：具体的アクション  
第3段階（6-12ヶ月）：具体的アクション

📈 詳細投資対効果分析
初期投資額：XXX万円
年間削減効果：XXX万円
年間売上向上：XXX万円
投資回収期間：X ヶ月
3年間累計効果：XXXX万円

🚀 次のステップ
この分析結果を基に、60分の無料個別相談で具体的な実装計画を設計いたします。

【重要】
- 日本語のみ使用
- HTMLタグ禁止
- 冒頭文字列禁止
- 必ず🤖から開始`
        },
        {
          role: "user",
          content: `以下の企業診断結果を分析してください：

総合スコア: ${totalScore}点/100点
年間改善効果: ${totalImprovement}万円
スコアレベル: ${scoreLevel}

詳細回答データ:
${detailedAnswers.map(answer => 
  `Q${answer.questionNumber}: ${answer.questionText}
回答: ${answer.selectedOption}
スコア: ${answer.score}点
改善効果: ${answer.improvementAmount}万円`
).join('\n\n')}

主要課題領域:
${performanceData.majorIssues.join('、')}

この企業に最適なAI活用戦略をレポート形式で提案してください。`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const analysis = completion.data.choices[0].message.content.trim();
    
    // 出力の後処理（不要な文字列の除去）
    const cleanedAnalysis = cleanAnalysisOutput(analysis);

    return res.status(200).json({
      success: true,
      analysis: cleanedAnalysis,
      metadata: {
        scoreLevel,
        timestamp: new Date().toISOString(),
        version: "3.0-japanese"
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

function getScoreLevel(score) {
  if (score >= 80) return "優秀";
  if (score >= 60) return "良好";
  if (score >= 40) return "改善必要";
  return "緊急改善必要";
}

function getPerformanceAnalysis(detailedAnswers) {
  const lowScoreQuestions = detailedAnswers
    .filter(answer => answer.score < 5)
    .map(answer => answer.questionText);
    
  const majorIssues = [];
  
  // 主要課題領域の特定
  lowScoreQuestions.forEach(question => {
    if (question.includes('AI') || question.includes('技術')) {
      majorIssues.push('AI技術への意識不足');
    }
    if (question.includes('人材') || question.includes('社員')) {
      majorIssues.push('人材管理の課題');
    }
    if (question.includes('競争') || question.includes('優位')) {
      majorIssues.push('競争力の低下');
    }
    if (question.includes('業務') || question.includes('効率')) {
      majorIssues.push('業務効率の問題');
    }
  });
  
  return {
    majorIssues: [...new Set(majorIssues)], // 重複除去
    lowPerformanceCount: lowScoreQuestions.length
  };
}

function cleanAnalysisOutput(analysis) {
  // 不要な文字列を除去
  let cleaned = analysis
    .replace(/^html\s*/i, '') // 冒頭のhtmlを除去
    .replace(/^```html\s*/i, '') // ```htmlを除去
    .replace(/```$/m, '') // 末尾の```を除去
    .replace(/^<[^>]*>/gm, '') // HTMLタグ開始を除去
    .replace(/<\/[^>]*>$/gm, '') // HTMLタグ終了を除去
    .trim();

  // 英語の一般的な単語を日本語に置換
  const replacements = {
    'AI': 'AI', // AIはそのまま
    'ROI': '投資対効果',
    'Phase': '段階',
    'Business': 'ビジネス',
    'System': 'システム',
    'Tool': 'ツール',
    'Platform': 'プラットフォーム',
    'Software': 'ソフトウェア',
    'Application': 'アプリケーション',
    'Service': 'サービス'
  };

  Object.entries(replacements).forEach(([eng, jpn]) => {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    cleaned = cleaned.replace(regex, jpn);
  });

  return cleaned;
}
