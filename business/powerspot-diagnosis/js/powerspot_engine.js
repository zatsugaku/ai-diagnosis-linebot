/**
 * パワースポット縁診断システム v9.0
 * 統計学的根拠に基づく3層統合縁診断エンジン
 */

const PowerspotDiagnosis = {
    // データベース
    powerspotDatabase: [],
    
    // 初期化
    async init() {
        try {
            await this.loadPowerspotData();
            this.bindEvents();
            console.log('パワースポット診断システム初期化完了');
        } catch (error) {
            console.error('初期化エラー:', error);
            this.showError('システムの初期化に失敗しました。ページを再読み込みしてください。');
        }
    },
    
    // パワースポットデータの読み込み
    async loadPowerspotData() {
        try {
            const response = await fetch('./data/powerspot_data.json');
            if (!response.ok) {
                throw new Error(`データ読み込みエラー: ${response.status}`);
            }
            this.powerspotDatabase = await response.json();
            console.log(`パワースポットデータ読み込み完了: ${this.powerspotDatabase.length}件`);
            
            if (this.powerspotDatabase.length === 0) {
                throw new Error('パワースポットデータが空です');
            }
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            // フォールバック: 最小限のサンプルデータ
            this.powerspotDatabase = this.getFallbackData();
            console.log('フォールバックデータを使用します');
        }
    },
    
    // フォールバックデータ（最小限）
    getFallbackData() {
        return [
            {
                "地域": "栃木県",
                "パワースポット名": "日光東照宮",
                "ベースエネルギー": 0.95,
                "五行属性": "火",
                "五行詳細": {
                    "主属性": "火",
                    "副属性": "土",
                    "信頼度": 16,
                    "判定根拠": ["光系→火", "その他→土", "高エネルギー→火"]
                },
                "縁特性": {
                    "相性タイプ": "活動表現型",
                    "推奨時期": "夏"
                }
            },
            {
                "地域": "島根県",
                "パワースポット名": "出雲大社",
                "ベースエネルギー": 0.94,
                "五行属性": "土",
                "五行詳細": {
                    "主属性": "土",
                    "副属性": "水",
                    "信頼度": 18,
                    "判定根拠": ["大社→土", "その他→土", "高エネルギー→火"]
                },
                "縁特性": {
                    "相性タイプ": "安定継続型",
                    "推奨時期": "土用"
                }
            }
        ];
    },
    
    // イベントバインド
    bindEvents() {
        const diagnoseBtn = document.getElementById('diagnoseBtn');
        const newDiagnosisBtn = document.getElementById('newDiagnosisBtn');
        const shareBtn = document.getElementById('shareBtn');
        
        if (diagnoseBtn) {
            diagnoseBtn.addEventListener('click', () => this.startDiagnosis());
        }
        if (newDiagnosisBtn) {
            newDiagnosisBtn.addEventListener('click', () => this.resetForm());
        }
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareResults());
        }
    },
    
    // 診断開始
    async startDiagnosis() {
        try {
            // フォーム検証
            const formData = this.validateForm();
            if (!formData) return;
            
            // ローディング表示
            this.showLoading();
            
            // 段階的診断実行
            await this.progressiveDiagnosis(formData);
            
        } catch (error) {
            console.error('診断エラー:', error);
            this.showError('診断中にエラーが発生しました。入力内容を確認してください。');
            this.hideLoading();
        }
    },
    
    // フォーム検証
    validateForm() {
        const fullName = document.getElementById('fullName').value.trim();
        const birthDate = document.getElementById('birthDate').value;
        const birthRegion = document.getElementById('birthRegion').value;
        const currentRegion = document.getElementById('currentRegion').value;
        const workPattern = document.getElementById('workPattern').value;
        const livingPattern = document.getElementById('livingPattern').value;
        const relationPattern = document.getElementById('relationPattern').value;
        const decisionPattern = document.getElementById('decisionPattern').value;
        
        if (!fullName || !birthDate || !birthRegion || !currentRegion || 
            !workPattern || !livingPattern || !relationPattern || !decisionPattern) {
            this.showError('全ての項目を入力してください。');
            return null;
        }
        
        return {
            fullName,
            birthDate: new Date(birthDate),
            birthRegion,
            currentRegion,
            workPattern,
            livingPattern,
            relationPattern,
            decisionPattern
        };
    },
    
    // 段階的診断実行
    async progressiveDiagnosis(formData) {
        const steps = [
            { text: '3層ユーザープロファイルを生成中...', progress: 20 },
            { text: 'パワースポットとの相性を計算中...', progress: 50 },
            { text: '最適なスポットを選定中...', progress: 80 },
            { text: '詳細レポートを生成中...', progress: 100 }
        ];
        
        // Step 1: ユーザープロファイル生成
        this.updateProgress(steps[0]);
        await this.delay(800);
        const userProfile = this.generateUserProfile(formData);
        
        // Step 2: 相性計算
        this.updateProgress(steps[1]);
        await this.delay(1200);
        const compatibilityResults = this.calculateCompatibility(userProfile);
        
        // Step 3: スポット選定
        this.updateProgress(steps[2]);
        await this.delay(1000);
        const selectedSpots = this.selectOptimalSpots(compatibilityResults);
        
        // Step 4: レポート生成
        this.updateProgress(steps[3]);
        await this.delay(800);
        const finalReport = this.generateDetailedReport(userProfile, selectedSpots);
        
        // 結果表示
        this.showResults(finalReport);
    },
    
    // ユーザープロファイル生成
    generateUserProfile(formData) {
        // 第1層: 生まれ持った縁
        const naturalType = this.calculateNaturalType(formData.birthDate);
        const nameAcousticType = this.analyzeNameAcoustic(formData.fullName);
        
        // 第2層: 引き寄せてきた縁
        const attractionType = this.determineAttractionType(formData);
        
        // 第3層: 現在の縁状態
        const currentState = this.calculateBiorhythm(formData.birthDate);
        
        return {
            basicInfo: {
                name: formData.fullName,
                birthDate: formData.birthDate,
                birthRegion: formData.birthRegion,
                currentRegion: formData.currentRegion
            },
            layer1: {
                naturalType,
                nameAcousticType
            },
            layer2: {
                attractionType
            },
            layer3: {
                currentState
            },
            diagnostics: {
                layer1: { naturalType, nameAcousticType },
                layer2: { attractionType },
                layer3: { currentState }
            }
        };
    },
    
    // 四柱推命による60分類自然タイプ算出
    calculateNaturalType(birthDate) {
        const baseDate = new Date('1900-01-01');
        const daysDiff = Math.floor((birthDate - baseDate) / (1000 * 60 * 60 * 24));
        
        // 十二支算出（自然現象決定）
        const eto = daysDiff % 12;
        const phenomena = [
            "春霞", "夏雨", "彩雲", "朝日", "夕陽", "秋風",
            "冬陽", "朧月", "霜夜", "氷刃", "春雷", "豊穣"
        ];
        
        // 五行算出
        const gogyou = ["木", "火", "土", "金", "水"];
        const gogyouIndex = Math.floor(daysDiff / 60) % 5;
        
        return `${gogyou[gogyouIndex]}の${phenomena[eto]}`;
    },
    
    // 名前音韻自動解析（ローマ字完全対応版）
    analyzeNameAcoustic(fullName) {
        // ローマ字・ひらがな・カタカナ・英語に対応
        const normalizedName = fullName.toLowerCase().replace(/\s+/g, '');
        const vowels = normalizedName.match(/[aiueoあいうえおアイウエオ]/g) || [];
        
        let ketuenScore = 0, shinenScore = 0, kouenScore = 0;
        
        vowels.forEach(vowel => {
            switch(vowel) {
                case 'i': case 'い': case 'イ':
                    ketuenScore += 2; // 軽やか・流れるような響き
                    break;
                case 'u': case 'う': case 'ウ':
                    shinenScore += 2; // 深み・重厚な響き
                    break;
                case 'a': case 'あ': case 'ア':
                    kouenScore += 2; // 明るさ・広がりのある響き
                    break;
                case 'e': case 'え': case 'エ':
                    ketuenScore += 1; // 軽やか
                    kouenScore += 1; // 明るさ
                    break;
                case 'o': case 'お': case 'オ':
                    shinenScore += 1; // 深み
                    kouenScore += 1; // 明るさ
                    break;
            }
        });
        
        // 子音による補正（ローマ字特有）
        const consonants = normalizedName.match(/[bcdfghjklmnpqrstvwxyz]/g) || [];
        consonants.forEach(consonant => {
            switch(consonant) {
                case 'k': case 'g': case 't': case 'd': case 'p': case 'b':
                    ketuenScore += 0.5; // 軽快な子音
                    break;
                case 'm': case 'n': case 'r': case 'l':
                    shinenScore += 0.5; // 深みのある子音
                    break;
                case 'h': case 'w': case 'y':
                    kouenScore += 0.5; // 広がりのある子音
                    break;
            }
        });
        
        // 文字数による補正
        const nameLength = normalizedName.length;
        if (nameLength <= 4) {
            ketuenScore += 3; // 短い名前は軽やか
        } else if (nameLength >= 8) {
            shinenScore += 3; // 長い名前は深み
        } else {
            kouenScore += 2; // 中程度は広がり
        }
        
        // 姓名バランス補正（スペースで分割可能な場合）
        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
            const firstPart = nameParts[0].toLowerCase();
            const lastPart = nameParts[nameParts.length - 1].toLowerCase();
            
            // 姓名の音韻バランスを評価
            if (firstPart.length !== lastPart.length) {
                kouenScore += 1; // 非対称は広がり
            }
            if (firstPart.charAt(0) === lastPart.charAt(0)) {
                shinenScore += 1; // 頭文字同じは深み
            }
        }
        
        const scores = { 結縁: ketuenScore, 深縁: shinenScore, 広縁: kouenScore };
        return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
    },
    
    // 五行縁型判定
    determineAttractionType(formData) {
        const scores = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
        
        scores[formData.workPattern]++;
        scores[formData.livingPattern]++;
        scores[formData.relationPattern]++;
        scores[formData.decisionPattern]++;
        
        const maxElement = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        return `${maxElement}縁型`;
    },
    
    // 10状態バイオリズム算出
    calculateBiorhythm(birthDate) {
        const now = new Date();
        const daysSinceBirth = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24));
        
        // 個人固有の周期パターン（365日周期）
        const yearPosition = daysSinceBirth % 365;
        
        const states = [
            "新生期", "発展期", "充実期", "安定期", "転換期",
            "調整期", "深化期", "収束期", "沈静期", "準備期"
        ];
        
        const periods = [32, 35, 38, 33, 29, 31, 36, 34, 30, 37];
        let currentDay = 0;
        
        for (let i = 0; i < states.length; i++) {
            currentDay += periods[i];
            if (yearPosition <= currentDay) {
                return states[i];
            }
        }
        
        return states[0]; // フォールバック
    },
    
    // 相性計算
    calculateCompatibility(userProfile) {
        return this.powerspotDatabase.map(powerspot => {
            const baseScore = this.calculateBaseCompatibility(
                userProfile.diagnostics.layer1.naturalType, 
                powerspot.五行属性
            );
            
            const nameBonus = this.calculateNameBonus(
                userProfile.diagnostics.layer1.nameAcousticType, 
                powerspot.五行属性
            );
            
            const attractionBonus = this.calculateAttractionBonus(
                userProfile.diagnostics.layer2.attractionType, 
                powerspot.五行属性
            );
            
            const stateBonus = this.calculateStateBonus(
                userProfile.diagnostics.layer3.currentState, 
                powerspot.五行属性
            );
            
            const finalScore = Math.max(30, Math.min(100, Math.round(
                baseScore + nameBonus + attractionBonus + stateBonus
            )));
            
            return {
                powerspot,
                finalScore,
                breakdown: {
                    base: baseScore,
                    name: nameBonus,
                    attraction: attractionBonus,
                    state: stateBonus
                },
                reasoning: this.generateReasoning(userProfile, powerspot, finalScore)
            };
        }).sort((a, b) => b.finalScore - a.finalScore);
    },
    
    // 基礎相性計算（3600パターン）
    calculateBaseCompatibility(naturalType, spotElement) {
        // 五行相生相剋の基本スコア
        const elementCompatibility = {
            '木': { '木': 75, '火': 85, '土': 65, '金': 55, '水': 80 },
            '火': { '木': 80, '火': 75, '土': 85, '金': 65, '水': 55 },
            '土': { '木': 65, '火': 80, '土': 75, '金': 85, '水': 55 },
            '金': { '木': 55, '火': 65, '土': 80, '金': 75, '水': 85 },
            '水': { '木': 85, '火': 55, '土': 65, '金': 80, '水': 75 }
        };
        
        const userElement = naturalType.charAt(0);
        return elementCompatibility[userElement]?.[spotElement] || 70;
    },
    
    // 名前音韻補正
    calculateNameBonus(nameType, spotElement) {
        const bonusMap = {
            '結縁': { '木': 4, '火': 3, '土': 2, '金': 2, '水': 3 },
            '深縁': { '木': 2, '火': 2, '土': 4, '金': 3, '水': 3 },
            '広縁': { '木': 3, '火': 4, '土': 2, '金': 2, '水': 3 }
        };
        
        return bonusMap[nameType]?.[spotElement] || 0;
    },
    
    // 五行縁型補正
    calculateAttractionBonus(attractionType, spotElement) {
        const element = attractionType.charAt(0);
        return element === spotElement ? 5 : 0;
    },
    
    // バイオリズム補正
    calculateStateBonus(currentState, spotElement) {
        const stateElementMap = {
            '新生期': '木', '発展期': '木', '充実期': '火', '安定期': '土',
            '転換期': '火', '調整期': '金', '深化期': '水', '収束期': '金',
            '沈静期': '水', '準備期': '土'
        };
        
        const preferredElement = stateElementMap[currentState];
        return preferredElement === spotElement ? 3 : 0;
    },
    
    // 相性根拠生成
    generateReasoning(userProfile, powerspot, score) {
        const reasons = [];
        
        if (score >= 85) {
            reasons.push(`生まれ持った縁「${userProfile.diagnostics.layer1.naturalType}」との非常に強い共鳴`);
        } else if (score >= 75) {
            reasons.push(`生まれ持った縁「${userProfile.diagnostics.layer1.naturalType}」との良好な調和`);
        }
        
        if (userProfile.diagnostics.layer1.nameAcousticType) {
            reasons.push(`名前の縁「${userProfile.diagnostics.layer1.nameAcousticType}」による特別な親和性`);
        }
        
        if (userProfile.diagnostics.layer2.attractionType.charAt(0) === powerspot.五行属性) {
            reasons.push(`引き寄せてきた「${userProfile.diagnostics.layer2.attractionType}」との完全一致`);
        }
        
        reasons.push(`現在の「${userProfile.diagnostics.layer3.currentState}」に適したエネルギー`);
        
        return reasons;
    },
    
    // 最適スポット選定
    selectOptimalSpots(compatibilityResults) {
        const usedSpots = new Set();
        
        // 運命スポット（TOP2）
        const destinySpots = compatibilityResults
            .slice(0, 2)
            .map(result => {
                usedSpots.add(result.powerspot.パワースポット名);
                return result;
            });
        
        // 目的別スポット選定
        const purposeSpots = this.selectPurposeSpots(compatibilityResults, usedSpots);
        
        // 季節別スポット選定
        const seasonalSpots = this.selectSeasonalSpots(compatibilityResults, usedSpots);
        
        return {
            destiny: destinySpots,
            purpose: purposeSpots,
            seasonal: seasonalSpots
        };
    },
    
    // 目的別スポット選定（改善版）
    selectPurposeSpots(results, usedSpots) {
        const categories = ['金運', '恋愛', '健康', '全体運'];
        const selected = {};
        
        categories.forEach(category => {
            // カテゴリに適したスポットをフィルタリング
            const categorySpots = results.filter(result => {
                if (usedSpots.has(result.powerspot.パワースポット名)) return false;
                return this.isSpotSuitableForCategory(result.powerspot, category);
            });
            
            // 相性順でソート
            categorySpots.sort((a, b) => b.finalScore - a.finalScore);
            
            // 2箇所選定（不足の場合はフォールバック）
            const selectedSpots = [];
            
            // 第1希望：カテゴリ適性のあるTOP2
            selectedSpots.push(...categorySpots.slice(0, 2));
            
            // 不足の場合：未使用スポットから高相性を補充
            if (selectedSpots.length < 2) {
                const fallbackSpots = results.filter(result => 
                    !usedSpots.has(result.powerspot.パワースポット名) &&
                    !selectedSpots.some(s => s.powerspot.パワースポット名 === result.powerspot.パワースポット名)
                ).slice(0, 2 - selectedSpots.length);
                
                selectedSpots.push(...fallbackSpots);
            }
            
            // 使用済みスポットに追加
            selectedSpots.forEach(spot => {
                if (spot && spot.powerspot) {
                    usedSpots.add(spot.powerspot.パワースポット名);
                }
            });
            
            selected[category] = selectedSpots;
        });
        
        return selected;
    },
    
    // カテゴリ適性判定（改善版）
    isSpotSuitableForCategory(powerspot, category) {
        const suitability = {
            '金運': {
                elements: ['土', '金'],
                energyThreshold: 0.80,
                preferredTypes: ['安定継続型', '完成効率型']
            },
            '恋愛': {
                elements: ['水', '木'],
                energyThreshold: 0.75,
                preferredTypes: ['流動浄化型', '成長発展型']
            },
            '健康': {
                elements: ['木', '土', '水'],
                energyThreshold: 0.85,
                preferredTypes: ['成長発展型', '安定継続型', '流動浄化型']
            },
            '全体運': {
                elements: ['火', '土', '金'],
                energyThreshold: 0.88,
                preferredTypes: ['活動表現型', '安定継続型', '完成効率型']
            }
        };
        
        const criteria = suitability[category];
        if (!criteria) return false;
        
        // 五行属性チェック
        const elementMatch = criteria.elements.includes(powerspot.五行属性);
        
        // エネルギー閾値チェック
        const energyMatch = powerspot.ベースエネルギー >= criteria.energyThreshold;
        
        // 相性タイプチェック（あれば）
        const typeMatch = !powerspot.縁特性?.相性タイプ || 
                         criteria.preferredTypes.includes(powerspot.縁特性.相性タイプ);
        
        // いずれかの条件を満たせば適性あり
        return elementMatch || energyMatch || typeMatch;
    },
    
    // 季節別スポット選定（改善版）
    selectSeasonalSpots(results, usedSpots) {
        const seasons = ['春', '夏', '秋', '冬'];
        const selected = {};
        
        seasons.forEach(season => {
            // 季節に適したスポットをフィルタリング
            const seasonSpots = results.filter(result => {
                if (usedSpots.has(result.powerspot.パワースポット名)) return false;
                return this.isSpotSuitableForSeason(result.powerspot, season);
            });
            
            // 相性順でソート
            seasonSpots.sort((a, b) => b.finalScore - a.finalScore);
            
            // 2箇所選定（不足の場合はフォールバック）
            const selectedSpots = [];
            
            // 第1希望：季節適性のあるTOP2
            selectedSpots.push(...seasonSpots.slice(0, 2));
            
            // 不足の場合：未使用スポットから高相性を補充
            if (selectedSpots.length < 2) {
                const fallbackSpots = results.filter(result => 
                    !usedSpots.has(result.powerspot.パワースポット名) &&
                    !selectedSpots.some(s => s.powerspot.パワースポット名 === result.powerspot.パワースポット名)
                ).slice(0, 2 - selectedSpots.length);
                
                selectedSpots.push(...fallbackSpots);
            }
            
            // 使用済みスポットに追加
            selectedSpots.forEach(spot => {
                if (spot && spot.powerspot) {
                    usedSpots.add(spot.powerspot.パワースポット名);
                }
            });
            
            selected[season] = selectedSpots;
        });
        
        return selected;
    },
    
    // 季節適性判定（改善版）
    isSpotSuitableForSeason(powerspot, season) {
        const seasonalCriteria = {
            '春': {
                elements: ['木'],
                energyRange: [0.80, 0.95],
                preferredTypes: ['成長発展型'],
                timeKeywords: ['春', '新緑', '芽生え']
            },
            '夏': {
                elements: ['火'],
                energyRange: [0.85, 1.0],
                preferredTypes: ['活動表現型'],
                timeKeywords: ['夏', '太陽', '活動']
            },
            '秋': {
                elements: ['金'],
                energyRange: [0.75, 0.90],
                preferredTypes: ['完成効率型'],
                timeKeywords: ['秋', '収穫', '完成']
            },
            '冬': {
                elements: ['水'],
                energyRange: [0.70, 0.85],
                preferredTypes: ['流動浄化型'],
                timeKeywords: ['冬', '静寂', '蓄積']
            }
        };
        
        const criteria = seasonalCriteria[season];
        if (!criteria) return false;
        
        // 五行属性チェック
        const elementMatch = criteria.elements.includes(powerspot.五行属性);
        
        // エネルギー範囲チェック
        const energyMatch = powerspot.ベースエネルギー >= criteria.energyRange[0] && 
                           powerspot.ベースエネルギー <= criteria.energyRange[1];
        
        // 相性タイプチェック
        const typeMatch = !powerspot.縁特性?.相性タイプ || 
                         criteria.preferredTypes.includes(powerspot.縁特性.相性タイプ);
        
        // 推奨時期チェック（データにあれば）
        const timeMatch = !powerspot.縁特性?.推奨時期 || 
                         criteria.timeKeywords.some(keyword => 
                             powerspot.縁特性.推奨時期.includes(keyword) ||
                             powerspot.縁特性.推奨時期 === season
                         );
        
        // いずれかの条件を満たせば適性あり
        return elementMatch || (energyMatch && typeMatch) || timeMatch;
    },
    
    // 詳細レポート生成
    generateDetailedReport(userProfile, selectedSpots) {
        return {
            userProfile,
            selectedSpots,
            generatedAt: new Date(),
            diagnosticId: this.generateDiagnosticId()
        };
    },
    
    // 診断ID生成
    generateDiagnosticId() {
        return 'PWS' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    
    // UI操作メソッド
    showLoading() {
        document.getElementById('diagnosisForm').classList.add('hidden');
        document.getElementById('loadingSection').classList.remove('hidden');
    },
    
    hideLoading() {
        document.getElementById('loadingSection').classList.add('hidden');
    },
    
    updateProgress(step) {
        document.getElementById('loadingText').textContent = step.text;
        document.getElementById('progressFill').style.width = step.progress + '%';
    },
    
    showResults(report) {
        this.hideLoading();
        
        // プロファイル表示
        this.displayUserProfile(report.userProfile);
        
        // スポット表示
        this.displayDestinySpots(report.selectedSpots.destiny);
        this.displayPurposeSpots(report.selectedSpots.purpose);
        this.displaySeasonalSpots(report.selectedSpots.seasonal);
        
        // バイオリズム表示
        this.displayBiorhythm(report.userProfile);
        
        // アドバイス表示
        this.displayAdvice(report.userProfile);
        
        document.getElementById('resultsSection').classList.remove('hidden');
        
        // 結果セクションまでスクロール
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    },
    
    displayUserProfile(userProfile) {
        const profileCard = document.getElementById('profileCard');
        profileCard.innerHTML = `
            <h2>🔮 あなたの縁プロファイル</h2>
            <div class="profile-content">
                <div class="profile-layers">
                    <div class="layer-card">
                        <h3>第1層: 生まれ持った縁</h3>
                        <p><strong>自然タイプ:</strong> ${userProfile.diagnostics.layer1.naturalType}</p>
                        <p><strong>名前の縁:</strong> ${userProfile.diagnostics.layer1.nameAcousticType}</p>
                    </div>
                    <div class="layer-card">
                        <h3>第2層: 引き寄せてきた縁</h3>
                        <p><strong>縁のタイプ:</strong> ${userProfile.diagnostics.layer2.attractionType}</p>
                    </div>
                    <div class="layer-card">
                        <h3>第3層: 現在の縁状態</h3>
                        <p><strong>バイオリズム:</strong> ${userProfile.diagnostics.layer3.currentState}</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    displayDestinySpots(destinySpots) {
        const container = document.getElementById('destinySpots');
        container.innerHTML = `
            <h2>⭐ 運命の開運スポット（2箇所）</h2>
            ${destinySpots.map((spot, index) => this.createSpotCard(spot, index + 1)).join('')}
        `;
    },
    
    displayPurposeSpots(purposeSpots) {
        const container = document.getElementById('purposeSpots');
        const categoriesHtml = Object.entries(purposeSpots).map(([category, spots]) => `
            <div class="purpose-category">
                <h3>${this.getCategoryIcon(category)} ${category}スポット</h3>
                ${spots.map(spot => this.createSpotCard(spot)).join('')}
            </div>
        `).join('');
        
        container.innerHTML = `
            <h2>💰 目的別開運スポット</h2>
            ${categoriesHtml}
        `;
    },
    
    displaySeasonalSpots(seasonalSpots) {
        const container = document.getElementById('seasonalSpots');
        const seasonsHtml = Object.entries(seasonalSpots).map(([season, spots]) => `
            <div class="season-category">
                <h3>${this.getSeasonIcon(season)} ${season}の開運スポット</h3>
                ${spots.map(spot => this.createSpotCard(spot)).join('')}
            </div>
        `).join('');
        
        container.innerHTML = `
            <h2>🌸 季節別開運スポット</h2>
            ${seasonsHtml}
        `;
    },
    
    createSpotCard(spotData, ranking) {
        const spot = spotData.powerspot;
        const score = spotData.finalScore;
        const stars = '★'.repeat(Math.ceil(score / 20));
        
        return `
            <div class="spot-card">
                <div class="spot-header">
                    <div class="spot-info">
                        ${ranking ? `<div class="ranking-badge">${ranking}位</div>` : ''}
                        <div class="spot-name">${spot.パワースポット名}</div>
                        <div class="spot-location">${spot.地域}</div>
                    </div>
                    <div class="compatibility-info">
                        <div class="compatibility-stars">${stars}</div>
                        <div class="compatibility-score">${score}%</div>
                    </div>
                </div>
                
                <div class="spot-details">
                    <div class="detail-section">
                        <h4>🔮 相性の根拠</h4>
                        <ul>
                            ${spotData.reasoning.map(reason => `<li>${reason}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="detail-section">
                        <h4>✨ 期待できるご利益</h4>
                        <ul>
                            ${this.generateBenefits(spot).map(benefit => `<li>${benefit}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="detail-section">
                        <h4>📍 基本情報</h4>
                        <p><strong>五行属性:</strong> ${spot.五行属性}</p>
                        <p><strong>エネルギー:</strong> ${Math.round(spot.ベースエネルギー * 100)}%</p>
                        <p><strong>推奨時期:</strong> ${spot.縁特性?.推奨時期 || '年間通して'}</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    generateBenefits(spot) {
        const baseBenefits = {
            '木': ['成長発展', '新規開拓', '学業成就', '健康増進'],
            '火': ['活力向上', '表現力強化', '情熱回復', '勝負運'],
            '土': ['安定', '基盤固め', '家庭円満', '商売繁盛'],
            '金': ['完成', '効率化', '金運向上', '権威獲得'],
            '水': ['浄化', '流れ改善', '知恵獲得', '直感力向上']
        };
        
        return baseBenefits[spot.五行属性] || ['開運招福', '心願成就'];
    },
    
    displayBiorhythm(userProfile) {
        const container = document.getElementById('biorhythmCalendar');
        container.innerHTML = `
            <h2>📅 あなたの縁バイオリズムカレンダー</h2>
            <div class="biorhythm-content">
                <div class="current-state">
                    <h3>現在の状態: ${userProfile.diagnostics.layer3.currentState}</h3>
                    <p>${this.getStateDescription(userProfile.diagnostics.layer3.currentState)}</p>
                </div>
                <div class="yearly-cycle">
                    <h4>年間サイクル予測</h4>
                    ${this.generateYearlyCycle(userProfile.basicInfo.birthDate)}
                </div>
            </div>
        `;
    },
    
    getStateDescription(state) {
        const descriptions = {
            '新生期': '新しい縁の始まりの時期。積極的な行動が吉。',
            '発展期': '縁が広がっていく時期。新しい出会いを大切に。',
            '充実期': '縁が最も活発な時期。エネルギッシュに活動を。',
            '安定期': '縁が安定している時期。継続と維持を重視。',
            '転換期': '縁の変化が起こる時期。変化を受け入れて。',
            '調整期': '縁を整理・調整する時期。冷静な判断を。',
            '深化期': '縁を深める時期。内省と探求が重要。',
            '収束期': '縁をまとめる時期。統合と完成を意識。',
            '沈静期': '縁が静かになる時期。蓄積と回復を。',
            '準備期': '次のサイクルへの準備期。基盤作りを。'
        };
        
        return descriptions[state] || '良好な縁の流れにあります。';
    },
    
    generateYearlyCycle(birthDate) {
        // 簡略化された年間サイクル表示
        const states = [
            "新生期", "発展期", "充実期", "安定期", "転換期",
            "調整期", "深化期", "収束期", "沈静期", "準備期"
        ];
        
        const currentMonth = new Date().getMonth();
        return states.map((state, index) => {
            const month = (currentMonth + index) % 12 + 1;
            return `<div class="cycle-item">
                <span class="month">${month}月</span>
                <span class="state">${state}</span>
            </div>`;
        }).join('');
    },
    
    displayAdvice(userProfile) {
        const container = document.getElementById('comprehensiveAdvice');
        container.innerHTML = `
            <h2>🎯 総合アドバイス</h2>
            <div class="advice-content">
                <div class="advice-section">
                    <h3>あなたの縁の特徴</h3>
                    <p>${this.generatePersonalAdvice(userProfile)}</p>
                </div>
                
                <div class="advice-section">
                    <h3>パワースポット活用法</h3>
                    <ul>
                        <li>最適な訪問時期は${userProfile.diagnostics.layer3.currentState}に合わせて選択</li>
                        <li>${userProfile.diagnostics.layer1.nameAcousticType}の特性を活かした参拝を</li>
                        <li>${userProfile.diagnostics.layer2.attractionType}に関連するスポットを重点的に</li>
                    </ul>
                </div>
                
                <div class="advice-section">
                    <h3>開運行動指針</h3>
                    <p>${this.generateActionAdvice(userProfile)}</p>
                </div>
            </div>
        `;
    },
    
    generatePersonalAdvice(userProfile) {
        const naturalElement = userProfile.diagnostics.layer1.naturalType.charAt(0);
        const adviceMap = {
            '木': 'あなたは成長と発展の縁を持っています。新しい挑戦を恐れず、学び続けることで運気が向上します。',
            '火': 'あなたは活動と表現の縁を持っています。情熱的に行動し、自分らしさを表現することで道が開けます。',
            '土': 'あなたは安定と継続の縁を持っています。着実な努力と信頼関係の構築が成功の鍵となります。',
            '金': 'あなたは完成と効率の縁を持っています。質の高さを追求し、洗練された行動が幸運を呼び込みます。',
            '水': 'あなたは流動と知恵の縁を持っています。柔軟性を保ち、直感を信じることで良い流れに乗れます。'
        };
        
        return adviceMap[naturalElement] || 'あなたは特別な縁の力を持っています。';
    },
    
    generateActionAdvice(userProfile) {
        const currentState = userProfile.diagnostics.layer3.currentState;
        const actionAdvice = {
            '新生期': '新しい環境に積極的に飛び込み、初心を大切にして行動してください。',
            '発展期': '人とのつながりを広げ、学びの機会を積極的に求めてください。',
            '充実期': 'エネルギッシュに活動し、リーダーシップを発揮する時期です。',
            '安定期': '継続的な努力を重視し、基盤をしっかり固めてください。',
            '転換期': '変化を恐れず、新しい可能性に目を向けてください。',
            '調整期': '冷静に状況を分析し、必要な調整を行ってください。',
            '深化期': '内省の時間を大切にし、深い学びを求めてください。',
            '収束期': 'これまでの経験を統合し、完成に向けて集中してください。',
            '沈静期': '無理をせず、心身の回復と蓄積に努めてください。',
            '準備期': '次のステップに向けて、しっかりとした準備を整えてください。'
        };
        
        return actionAdvice[currentState] || '自分らしく、前向きに行動することが大切です。';
    },
    
    getCategoryIcon(category) {
        const icons = {
            '金運': '💰',
            '恋愛': '💖',
            '健康': '🌿',
            '全体運': '🌟'
        };
        return icons[category] || '✨';
    },
    
    getSeasonIcon(season) {
        const icons = {
            '春': '🌸',
            '夏': '☀️',
            '秋': '🍁',
            '冬': '❄️'
        };
        return icons[season] || '🌟';
    },
    
    // ユーティリティメソッド
    resetForm() {
        document.getElementById('resultsSection').classList.add('hidden');
        document.getElementById('diagnosisForm').classList.remove('hidden');
        
        // フォームリセット
        document.querySelectorAll('input, select').forEach(element => {
            if (element.type === 'text' || element.type === 'date') {
                element.value = '';
            } else if (element.tagName === 'SELECT') {
                element.selectedIndex = 0;
            }
        });
        
        // トップまでスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    shareResults() {
        if (navigator.share) {
            navigator.share({
                title: 'パワースポット縁診断結果',
                text: 'あなたに最適なパワースポットが見つかりました！',
                url: window.location.href
            }).catch(console.error);
        } else {
            // フォールバック: URLをクリップボードにコピー
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('診断結果のURLがクリップボードにコピーされました！');
            }).catch(() => {
                alert('シェア機能はこのブラウザではサポートされていません。');
            });
        }
    },
    
    showError(message) {
        // エラー表示（簡易版）
        alert(message);
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// グローバルエラーハンドリング
window.addEventListener('error', function(event) {
    console.error('システムエラー:', event.error);
    PowerspotDiagnosis.showError('予期しないエラーが発生しました。ページを再読み込みしてください。');
});

// 未処理のPromise拒否をキャッチ
window.addEventListener('unhandledrejection', function(event) {
    console.error('未処理のPromiseエラー:', event.reason);
    event.preventDefault();
});

// DOM読み込み完了時の初期化は、HTMLファイル側で実行される
    
    
    
