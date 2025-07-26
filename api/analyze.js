// Vercel Serverless Function for ChatGPT API Integration (新質問対応完全版)
export default async function handler(req, res) {
  console.log('API呼び出し受信:', req.method);

  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS リクエスト処理');
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    console.log('GET リクエスト - 動作確認');
    return res.status(200).json({ 
      success: true, 
      message: 'AI診断API エンドポイント正常動作',
      timestamp: new Date().toISOString(),
      version: '4.0-new-questions-support',
      supportedQuestions: '新10問対応（AI活用実態把握）'
    });
  }

  if (req.method !== 'POST') {
    console.log('不正なメソッド:', req.method);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('POST リクエスト処理開始');
    
    // フロントエンドの送信形式に対応
    const { answers, totalScore, totalImprovement } = req.body;
    
    console.log('受信データ:', {
      totalScore,
      totalImprovement,
      answersCount: answers?.length || 0
    });
    
    // データ検証（フロントエンド形式）
    if (typeof totalScore !== 'number' || typeof totalImprovement !== 'number' || !answers || !Array.isArray(answers)) {
      console.log('無効なリクエストデータ形式');
      return res.status(400).json({
        success: false,
        error: 'Invalid request data format'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    console.log('APIキー確認:', apiKey ? 'あり' : 'なし');
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY が設定されていません');
      return res.status(500).json({
        success: false,
        error: 'API configuration error - OPENAI_API_KEY not set'
      });
    }

    // AI分析生成（新質問対応版）
    const analysis = await generateAIAnalysis(totalScore, totalImprovement, answers, apiKey);
    
    console.log('AI分析生成成功');
    return res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('API処理エラー:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// AI分析生成関数（新質問対応完全版）
async function generateAIAnalysis(totalScore, totalImprovement, answers, apiKey) {
  console.log('ChatGPT API呼び出し開始');
  
  const systemPrompt = `あなたは1,200社のAI導入を支援した経験豊富な専門コンサルタントです。

# 診断内容の理解
この診断は企業のAI活用実態を把握するための10問構成です：
1. ChatGPT等の生成AIツール活用状況
2. 社員の生成AI活用スキルレベル  
3. AI活用による業務効率化の実感
4. データ活用とAI分析への取り組み
5. 業務プロセスの自動化レベル
6. AI導入における課題認識
7. 経営陣の理解とサポート
8. 社員のAI活用に対する意識
9. 成果測定と改善サイクル
10. 今後の拡大準備状況

# 重要な分析方針
- 高スコア = AI活用改善余地が大きい = 支援機会が多い
- 低スコア = 既に効率的にAI活用 = 更なる高度化提案
- 実態に基づく具体的で実行可能な提案を行う
- 顧客の現状レベルに応じた段階的改善策を提示

# 必須出力形式
以下のHTML構造で出力してください：

<div class="ai-analysis">
  <h3>🤖 AI活用実態分析レポート</h3>
  
  <div class="highlight-box">
    <h4>📊 診断結果サマリー</h4>
    <p><strong>AI活用改善スコア：${totalScore}点/100点</strong></p>
    <p><strong>年間改善効果ポテンシャル：${totalImprovement}万円</strong></p>
    <p>貴社のAI活用実態から、${getScoreLevelDescription(totalScore)}ことが判明いたしました。</p>
  </div>
  
  <h4>🎯 現状分析と改善ポイント</h4>
  <div class="highlight-box">
    <p><strong>生成AI活用状況:</strong> ${generateAIUsageAnalysis(answers)}</p>
    <p><strong>組織の準備度:</strong> ${generateReadinessAnalysis(answers)}</p>
    <p><strong>最重要改善領域:</strong> ${generateTopPriorityArea(answers)}</p>
  </div>
  
  <h4>💡 段階別改善ロードマップ</h4>
  <ol>
    <li><strong>Phase 1（1-3ヶ月）- 基盤整備</strong><br>
    ${generatePhase1Recommendations(totalScore, answers)}
    <br><em>期待効果: 月額${Math.floor(totalImprovement/12 * 0.3)}万円</em></li>
    
    <li><strong>Phase 2（3-6ヶ月）- 活用拡大</strong><br>
    ${generatePhase2Recommendations(totalScore, answers)}
    <br><em>期待効果: 月額${Math.floor(totalImprovement/12 * 0.5)}万円</em></li>
    
    <li><strong>Phase 3（6-12ヶ月）- 高度化・最適化</strong><br>
    ${generatePhase3Recommendations(totalScore, answers)}
    <br><em>期待効果: 月額${Math.floor(totalImprovement/12)}万円</em></li>
  </ol>
  
  <h4>📈 詳細ROI分析</h4>
  <ul>
    <li>推奨初期投資額: <strong>${calculateInitialInvestment(totalScore)}万円</strong></li>
    <li>年間効率化効果: <strong>${Math.floor(totalImprovement * 0.6)}万円</strong></li>
    <li>年間売上向上効果: <strong>${Math.floor(totalImprovement * 0.4)}万円</strong></li>
    <li>投資回収期間: <strong>${calculateROIPeriod(totalScore, totalImprovement)}ヶ月</strong></li>
    <li>3年間累計効果: <strong>${totalImprovement * 3 - calculateInitialInvestment(totalScore)}万円</strong></li>
    <li>従業員1人当たり年間効果: <strong>約${Math.floor(totalImprovement / 50)}万円</strong>（50名想定）</li>
  </ul>
  
  <h4>⚡ 即座に実行可能なクイックウィン</h4>
  <ul>
    ${generateQuickWins(answers)}
  </ul>
  
  <div class="cta-box">
    <h4>🚀 無料60分個別コンサルティングのご案内</h4>
    <p>この分析結果を基に、貴社専用のAI活用戦略を詳細設計いたします。</p>
    <p><strong>特典：</strong>Phase 1の詳細実装計画書（25ページ）を無料提供</p>
    <p><strong>参加者特典：</strong>ChatGPT Business導入支援（通常30万円）を特別価格でご提供</p>
    <a href="mailto:ai-consulting@business.com?subject=AI活用診断の個別相談&body=診断スコア: ${totalScore}点%0A改善効果: ${totalImprovement}万円%0A%0A相談希望日時：%0A第1希望：%0A第2希望：%0A第3希望：" 
       style="background: #28a745; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 15px 0;">
       📧 無料個別相談を申し込む
    </a>
  </div>
</div>`;

  const userPrompt = `
【AI活用実態診断分析依頼】

企業診断結果:
- 総合スコア: ${totalScore}/100点（高スコア=改善余地大）
- 年間改善ポテンシャル: ${totalImprovement}万円
- 回答データ: ${answers.length}項目の詳細分析

回答データの詳細:
${formatAnswersForAnalysis(answers)}

この企業のAI活用実態を詳細に分析し、現状レベルに応じた具体的で実行可能なAI活用改善戦略を提案してください。

重要: 
- 実際の回答内容に基づいた現実的な分析
- 段階的で実行可能な改善提案
- 具体的な数値とROIの算出
- 即座に実行できるクイックウィンの提示
`;

  try {
    console.log('OpenAI API リクエスト送信');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.7
      }),
    });

    console.log('OpenAI API レスポンス:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI API 成功');

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Unexpected response format from OpenAI');
    }

  } catch (error) {
    console.error('ChatGPT API呼び出しエラー:', error);
    throw error;
  }
}

// 回答データの分析用フォーマット（新質問対応）
function formatAnswersForAnalysis(answers) {
  const questionCategories = [
    "生成AI活用状況", "社員スキルレベル", "効率化実感度", "データ活用状況", "自動化レベル",
    "AI導入課題", "経営サポート", "社員意識", "成果測定・改善", "拡大準備状況"
  ];
  
  return answers.map((answer, index) => {
    return `Q${index + 1}(${questionCategories[index]}): スコア${answer.score}点, 改善効果${answer.amount}万円`;
  }).join('\n');
}

// スコアレベル説明（新質問対応）
function getScoreLevelDescription(score) {
  if (score >= 80) return 'AI活用において大幅な改善余地があり、適切な支援により劇的な効果向上が期待できる';
  if (score >= 60) return 'AI活用において一定の改善余地があり、計画的な取り組みで大きな効果を実現できる';
  if (score >= 40) return 'AI活用において標準的なレベルにあり、重点的な改善により効果を向上できる';
  if (score >= 20) return 'AI活用において比較的効率的なレベルにあり、さらなる最適化により効果を拡大できる';
  return 'AI活用において非常に効率的なレベルにあり、先進的な技術導入により更なる競争優位を獲得できる';
}

// 生成AI活用状況分析
function generateAIUsageAnalysis(answers) {
  const usageScore = answers[0]?.score || 5;
  const skillScore = answers[1]?.score || 5;
  
  if (usageScore <= 3 && skillScore <= 3) return "先進的な活用レベル - さらなる高度化が可能";
  if (usageScore <= 5 && skillScore <= 5) return "良好な活用レベル - 活用範囲の拡大が効果的";
  if (usageScore <= 7) return "基本的な活用レベル - 体系的な活用促進が必要";
  return "活用開始段階 - 導入・教育支援が最優先";
}

// 組織準備度分析
function generateReadinessAnalysis(answers) {
  const managementScore = answers[6]?.score || 5;
  const employeeScore = answers[7]?.score || 5;
  
  if (managementScore <= 3 && employeeScore <= 3) return "組織全体で高い準備度 - 大胆な戦略実行が可能";
  if (managementScore <= 5) return "経営陣の理解良好 - 社員巻き込み強化で効果拡大";
  if (employeeScore <= 5) return "現場の意識良好 - 経営支援獲得が重要";
  return "組織的な意識改革が必要 - 段階的な理解促進から開始";
}

// 最重要改善領域特定
function generateTopPriorityArea(answers) {
  const scores = answers.map(a => a.score);
  const maxIndex = scores.indexOf(Math.max(...scores));
  
  const areas = [
    "生成AI活用の促進", "社員スキル育成", "効果実感の向上", "データ活用強化", "業務自動化",
    "課題解決策の実行", "経営理解の促進", "社員意識の向上", "成果測定の強化", "拡大戦略の策定"
  ];
  
  return areas[maxIndex] || "包括的なAI活用促進";
}

// Phase別推奨事項生成
function generatePhase1Recommendations(totalScore, answers) {
  if (totalScore >= 70) return "ChatGPT Business導入、基本操作研修、文書作成業務での活用開始";
  if (totalScore >= 40) return "既存活用の効率化、追加ツール検討、成果測定の仕組み構築";
  return "高度な活用方法の導入、AI戦略の見直し、競争優位性の拡大";
}

function generatePhase2Recommendations(totalScore, answers) {
  if (totalScore >= 70) return "RPA導入、データ分析ツール活用、部門横断的な活用拡大";
  if (totalScore >= 40) return "活用範囲の拡大、高度な機能の導入、効果測定の精緻化";
  return "先進的AI技術の導入、業界ベストプラクティスの適用";
}

function generatePhase3Recommendations(totalScore, answers) {
  if (totalScore >= 70) return "予測分析システム、機械学習活用、包括的業務改革の実行";
  if (totalScore >= 40) return "AI活用の最適化、新技術の継続導入、組織全体での効果最大化";
  return "次世代AI技術の導入、業界リーダーシップの確立";
}

// 投資額計算
function calculateInitialInvestment(totalScore) {
  if (totalScore >= 70) return 300;
  if (totalScore >= 40) return 200;
  return 150;
}

// ROI期間計算
function calculateROIPeriod(totalScore, totalImprovement) {
  const investment = calculateInitialInvestment(totalScore);
  const monthlyReturn = totalImprovement / 12;
  return Math.ceil(investment / monthlyReturn);
}

// クイックウィン生成
function generateQuickWins(answers) {
  const wins = [];
  
  if (answers[0]?.score >= 6) wins.push("<li>ChatGPT無料版での文書作成効率化テスト（即座開始可能）</li>");
  if (answers[3]?.score >= 6) wins.push("<li>Excel/Googleスプレッドシートでのデータ可視化改善（1週間で効果実感）</li>");
  if (answers[4]?.score >= 6) wins.push("<li>メール定型文作成の自動化（Outlook/Gmail活用）</li>");
  
  if (wins.length === 0) {
    wins.push("<li>既存AI活用の効果測定とベストプラクティスの社内共有</li>");
    wins.push("<li>高度なプロンプト技術の導入による効率向上</li>");
  }
  
  return wins.join('\n    ');
}
