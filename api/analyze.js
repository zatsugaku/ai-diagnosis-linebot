// api/analyze.js - ChatGPT API連携
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { answers, totalScore, totalImprovement } = req.body;

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ error: '診断データが不正です' });
      return;
    }

    // ChatGPT APIを呼び出し
    const analysis = await generateAIAnalysis(answers, totalScore, totalImprovement);
    
    res.status(200).json({ 
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI分析中にエラーが発生しました。しばらく後に再試行してください。'
    });
  }
}

async function generateAIAnalysis(answers, totalScore, totalImprovement) {
  const prompt = createAnalysisPrompt(answers, totalScore, totalImprovement);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたは経験豊富な経営コンサルタント・AI活用専門家です。
企業の診断結果から、具体的で実行可能な改善提案を行います。
必ず以下の形式で回答し、HTML形式で出力してください：

- 現状分析は簡潔で的確に
- 改善策は具体的で実行可能なものを
- 数値は現実的で根拠のあるものを
- 日本語で分かりやすく説明
- HTMLタグを使って見やすい形式で出力`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function createAnalysisPrompt(answers, totalScore, totalImprovement) {
  const analysisData = analyzeAnswers(answers);
  
  return `
【企業診断AI分析依頼】

## 診断結果サマリー
- 総合スコア: ${totalScore}/100点
- 年間改善効果: ${totalImprovement}万円
- 診断レベル: ${getScoreLevel(totalScore)}

## 各質問の回答詳細
${formatAnswersForAnalysis(answers)}

## 特に注目すべき課題
${identifyKeyIssues(analysisData)}

以下のHTML形式で分析結果を出力してください：

<div class="ai-analysis">
  <h3>🤖 AI専門分析</h3>
  
  <div class="current-status">
    <h4>📊 現状分析</h4>
    <p>（貴社の現状を200文字程度で分析）</p>
  </div>
  
  <div class="key-issues">
    <h4>🎯 最重要課題TOP3</h4>
    <ol>
      <li><strong>課題名</strong>: 具体的な問題と影響1</li>
      <li><strong>課題名</strong>: 具体的な問題と影響2</li>
      <li><strong>課題名</strong>: 具体的な問題と影響3</li>
    </ol>
  </div>
  
  <div class="improvement-plan">
    <h4>💡 AI活用による改善策</h4>
    <ul>
      <li><strong>短期（1-3ヶ月）</strong>: 即効性のある改善</li>
      <li><strong>中期（3-6ヶ月）</strong>: 本格的なAI導入</li>
      <li><strong>長期（6-12ヶ月）</strong>: 組織変革</li>
    </ul>
  </div>
  
  <div class="expected-results">
    <h4>📈 期待される効果</h4>
    <ul>
      <li>年間コスト削減: <strong>○○万円</strong></li>
      <li>売上向上効果: <strong>○○万円</strong></li>
      <li>生産性向上: <strong>○○%</strong></li>
    </ul>
  </div>
  
  <div class="next-steps">
    <h4>🚀 推奨される次のステップ</h4>
    <p>（具体的なアクションプランを3つ程度）</p>
  </div>
</div>

必ず実行可能で具体的な提案をし、数値は現実的な範囲で提示してください。
`;
}

function analyzeAnswers(answers) {
  const issues = [];
  
  answers.forEach((answer, index) => {
    if (answer.score <= 2) {
      issues.push({
        questionIndex: index,
        severity: 'high',
        score: answer.score
      });
    } else if (answer.score <= 5) {
      issues.push({
        questionIndex: index,
        severity: 'medium', 
        score: answer.score
      });
    }
  });
  
  return { issues };
}

function identifyKeyIssues(analysisData) {
  const questionTopics = [
    '組織自律性', '人材活用', '収益性', '経営ストレス', '成長性',
    '人材育成', 'イノベーション', 'データ活用', '差別化', '改善力'
  ];
  
  return analysisData.issues
    .filter(issue => issue.severity === 'high')
    .map(issue => `- ${questionTopics[issue.questionIndex]}: スコア${issue.score}点（緊急改善必要）`)
    .join('\n');
}

function formatAnswersForAnalysis(answers) {
  const questions = [
    'Q1: 社長不在時の会社運営',
    'Q2: 高額人材の業務内容', 
    'Q3: 利益率への満足度',
    'Q4: 経営への心配・ストレス',
    'Q5: 5年後の会社見通し',
    'Q6: 新入社員の育成期間',
    'Q7: 社員からの改善提案',
    'Q8: データ活用の頻度',
    'Q9: 競合との差別化',
    'Q10: 業務効率改善の実績'
  ];
  
  return answers.map((answer, index) => 
    `${questions[index]}: ${answer.score}点 (年間改善効果: ${answer.amount}万円)`
  ).join('\n');
}

function getScoreLevel(score) {
  if (score >= 80) return '業界トップクラス';
  if (score >= 65) return '業界上位レベル';
  if (score >= 50) return '業界平均レベル';
  if (score >= 35) return '改善余地大';
  return '緊急改善必要';
}
