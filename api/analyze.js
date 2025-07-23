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
      version: "4.0-fixed-scoring"
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { totalScore, totalImprovement, detailedAnswers } = req.body;

    // デバッグログ追加
    console.log('受信データ:', { totalScore, totalImprovement, detailedAnswers: detailedAnswers?.length });

    // データ検証（スコア範囲チェック追加）
    if (typeof totalScore !== 'number' || totalScore < 0 || totalScore > 100) {
      console.error('無効なスコア:', totalScore);
      return res.status(400).json({
        success: false,
        error: 'Invalid score range. Expected 0-100.',
        receivedScore: totalScore
      });
    }

    if (typeof totalImprovement !== 'number' || !detailedAnswers || !Array.isArray(detailedAnswers)) {
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
          content: `あなたは企業のAI活用可能性を診断する専門コンサルタントです。

この診断は「AI活用診断システム」として、企業がAI導入によってどれだけの改善が可能かを分析するものです。

【重要な診断文脈】
- これは「AI活用診断」です
- 企業の現状から「AI導入でどこまで改善できるか」を診断
- 各質問の回答内容を詳細に分析し、具体的なAI活用シーンを提案
- 1,200社のデータベースとの比較分析

【出力要件】
1. 完全日本語のみ使用
2. HTMLタグは一切使用しない
3. 必ず「🤖 AI活用診断レポート」から開始
4. 文字数：1,800-2,200文字
5. 各回答内容に基づく具体的分析を含める

【必須構成】
🤖 AI活用診断レポート

📊 診断結果サマリー
AI活用余地スコア：${totalScore}点/100点
年間改善効果ポテンシャル：${totalImprovement}万円

🔍 回答分析から見える現状
（各質問の選択内容を具体的に分析し、なぜその回答がAI活用の必要性を示すかを説明）

🎯 AI活用による解決策TOP3
1. 【具体的課題】→【具体的AIソリューション】
   例：ChatGPT Business、kintone、Slack AI等の日本で利用可能ツール

2. 【具体的課題】→【具体的AIソリューション】

3. 【具体的課題】→【具体的AIソリューション】

💡 段階別AI導入ロードマップ
Phase 1（1-3ヶ月）：【具体的AI導入アクション】
Phase 2（3-6ヶ月）：【具体的AI導入アクション】
Phase 3（6-12ヶ月）：【具体的AI導入アクション】

📈 詳細投資対効果分析
初期投資額：XXX万円（AI導入コスト）
年間削減効果：XXX万円（AI活用による効率化）
年間売上向上：XXX万円（AI活用による売上増）
投資回収期間：X ヶ月
3年間累計効果：XXXX万円

🚀 推奨される次のステップ
この診断結果を基に、貴社専用のAI活用戦略を60分の無料個別相談で詳細設計いたします。

【分析の重要ポイント】
- 各回答内容からAI導入の必要性を具体的に説明
- 実際に日本で導入可能な具体的AIツール名を含める
- スコア${totalScore}点に応じた現実的な改善提案
- 1,200社データとの比較による権威性演出`
        },
        {
          role: "user",
          content: `【AI活用診断分析依頼】

企業の「AI活用診断」結果を詳細分析し、AI導入による改善可能性を診断してください。

■ 診断結果概要
AI活用余地スコア: ${totalScore}点/100点
年間改善効果ポテンシャル: ${totalImprovement}万円
診断レベル: ${scoreLevel}

■ 各質問の回答詳細分析
${detailedAnswers.map(answer => 
  `【Q${answer.questionNumber}】${answer.questionText}
→ 選択回答：「${answer.selectedOption}」
→ この回答が示すAI活用の必要性：スコア${answer.score}点、改善効果${answer.improvementAmount}万円
→ カテゴリー：${answer.category || '一般'}`
).join('\n\n')}

■ 特に注目すべき回答パターン
${performanceData.majorIssues.length > 0 ? 
  `主要課題領域: ${performanceData.majorIssues.join('、')}` : 
  '全体的に良好な状況'}

■ 1,200社データベースとの比較
スコア${totalScore}点は、当データベースにおいて${getPerformanceRank(totalScore)}に位置します。

この企業専用のAI活用診断レポートを詳細に作成してください。`
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
        actualScore: totalScore,
        timestamp: new Date().toISOString(),
        version: "4.0-fixed"
      }
    });

  } catch (error) {
    console.error('API Error Details:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'API処理エラー'
    });
  }
}
          content: `あなたは企業のAI活用可能性を診断する専門コンサルタントです。

この診断は「隠れた利益流出診断」として、企業がAI活用によってどれだけの利益改善が可能かを分析するものです。

【重要な診断文脈】
- これは「AI活用診断」です
- 企業の現状から「AI導入でどこまで改善できるか」を診断
- 各質問の回答内容を詳細に分析し、具体的なAI活用シーンを提案
- 1,200社のデータベースとの比較という設定

【出力要件】
1. 完全日本語のみ使用
2. HTMLタグは一切使用しない
3. 必ず「🤖 AI活用診断レポート」から開始
4. 文字数：1,800-2,200文字
5. 各回答内容に基づく具体的分析を含める

【必須構成】
🤖 AI活用診断レポート

📊 診断結果サマリー
AI活用余地スコア：XX点/100点
年間改善効果ポテンシャル：XXXX万円

🔍 回答分析から見える現状
（各質問の選択内容を具体的に分析し、なぜその回答がAI活用の必要性を示すかを説明）

🎯 AI活用による解決策TOP3
1. 【具体的課題】→【具体的AIソリューション】
   例：ChatGPT Business、kintone、Slack AI等の日本で利用可能ツール

2. 【具体的課題】→【具体的AIソリューション】

3. 【具体的課題】→【具体的AIソリューション】

💡 段階別AI導入ロードマップ
Phase 1（1-3ヶ月）：【具体的AI導入アクション】
Phase 2（3-6ヶ月）：【具体的AI導入アクション】
Phase 3（6-12ヶ月）：【具体的AI導入アクション】

📈 詳細投資対効果分析
初期投資額：XXX万円（AI導入コスト）
年間削減効果：XXX万円（AI活用による効率化）
年間売上向上：XXX万円（AI活用による売上増）
投資回収期間：X ヶ月
3年間累計効果：XXXX万円

🚀 推奨される次のステップ
この診断結果を基に、貴社専用のAI活用戦略を60分の無料個別相談で詳細設計いたします。

【分析の視点】
- 各回答がなぜAI導入の必要性を示すかを具体的に説明
- 1,200社データベースとの比較という設定で権威性を演出
- 回答内容に応じた個別のAI導入提案を作成
- 実際に日本で導入可能な具体的AIツール名を含める`
        },
        {
          role: "user",
          content: `【AI活用診断分析依頼】

この企業の「隠れた利益流出診断」結果を詳細分析し、AI活用による改善可能性を診断してください。

■ 診断結果概要
AI活用余地スコア: ${totalScore}点/100点
年間改善効果ポテンシャル: ${totalImprovement}万円
診断レベル: ${scoreLevel}

■ 各質問の回答詳細分析
${detailedAnswers.map(answer => 
  `【Q${answer.questionNumber}】${answer.questionText}
→ 選択回答：「${answer.selectedOption}」
→ この回答が示すAI活用の必要性：スコア${answer.score}点、改善効果${answer.improvementAmount}万円
→ カテゴリー：${answer.category}`
).join('\n\n')}

■ 特に注目すべき回答パターン
${performanceData.majorIssues.length > 0 ? 
  `主要課題領域: ${performanceData.majorIssues.join('、')}` : 
  '全体的に良好な状況'}

■ 分析指示
1. 各質問の選択内容から具体的にどのようなAI活用が有効かを分析
2. なぜその回答がAI導入の必要性を示すかを論理的に説明
3. 1,200社のデータベースと比較した場合の位置づけを示す
4. 選択内容に応じた個別最適化されたAI導入戦略を提案

この企業専用のAI活用診断レポートを作成してください。`
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

function getPerformanceRank(score) {
  if (score >= 80) return "上位10%（優秀企業レベル）";
  if (score >= 60) return "上位30%（良好企業レベル）";
  if (score >= 40) return "中位50%（平均的企業レベル）";
  if (score >= 20) return "下位30%（改善必要レベル）";
  return "下位10%（緊急改善必要レベル）";
}
