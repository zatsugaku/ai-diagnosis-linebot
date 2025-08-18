/**
 * パワースポット縁診断システム v9.1
 * 統計学的根拠に基づく3層統合縁診断エンジン
 * 修正版：目的別・季節別スポット選定機能改善
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
    
    // 名前音韻自動解析
    analyzeNameAcoustic(fullName) {
        const vowels = fullName.match(/[あいうえおアイウエオaiueo]/g) || [];
        let ketuenScore = 0, shinenScore = 0, kouenScore = 0;
        
        vowels.forEach(vowel => {
            switch(vowel.toLowerCase()) {
                case 'i': case 'い': case 'イ':
                    ketuenScore += 2; // 軽やか
                    break;
                case 'u': case 'う': case 'ウ':
                    shinenScore += 2; // 深み
                    break;
                case 'a': case 'あ': case 'ア':
                    kouenScore += 2; // 明るさ
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
        
        // 文字数による補正
        const nameLength = fullName.length;
        if (nameLength <= 3) ketuenScore += 3;
        else if (nameLength >= 6) shinenScore += 3;
        else kouenScore += 2;
        
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
            // 五行属性の正規化（オブジェクト形式対応）
            let spotElement = powerspot.五行属性;
            if (typeof spotElement === 'object' && spotElement !== null) {
                spotElement = Object.entries(spotElement).sort(([,a], [,b]) => b - a)[0][0];
            }
            
            const baseScore = this.calculateBaseCompatibility(
                userProfile.diagnostics.layer1.naturalType, 
                spotElement
            );
            
            const nameBonus = this.calculateNameBonus(
                userProfile.diagnostics.layer1.nameAcousticType, 
                spotElement
            );
            
            const attractionBonus = this.calculateAttractionBonus(
                userProfile.diagnostics.layer2.attractionType, 
                spotElement
            );
            
            const stateBonus = this.calculateStateBonus(
                userProfile.diagnostics.layer3.currentState, 
                spotElement
            );
            
            const finalScore = Math.max(30, Math.min(100, Math.round(
                baseScore + nameBonus + attractionBonus + stateBonus
            )));
            
            return {
                powerspot: {
                    ...powerspot,
                    五行属性: spotElement // 正規化された五行属性を保存
                },
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
        
        console.log('スポット選定開始 - 総候補数:', compatibilityResults.length);
        
        // 運命スポット（TOP2）
        const destinySpots = compatibilityResults
            .slice(0, 2)
            .map(result => {
                usedSpots.add(result.powerspot.パワースポット名);
                return result;
            });
        
        console.log('運命スポット選定完了:', destinySpots.length, '件');
        
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
    
    // 目的別スポット選定（修正版）
    selectPurposeSpots(results, usedSpots) {
        const categories = ['金運', '恋愛', '健康', '全体運'];
        const selected = {};
        
        categories.forEach(category => {
            console.log(`${category}スポット選定開始`);
            
            // カテゴリに適したスポットをフィルタリング
            const categorySpots = results.filter(result => {
                if (usedSpots.has(result.powerspot.パワースポット名)) return false;
                return this.isSpotSuitableForCategory(result.powerspot, category);
            });
            
            console.log(`${category}に適したスポット数:`, categorySpots.length);
            
            // 適性スポットが足りない場合、未使用スポットから高相性を選択
            const selectedSpots = [];
            
            if (categorySpots.length >= 2) {
                selectedSpots.push(...categorySpots.slice(0, 2));
            } else {
                // 適性スポットを全て追加
                selectedSpots.push(...categorySpots);
                
                // 不足分を未使用の高相性スポットから補完
                const fallbackSpots = results.filter(result => 
                    !usedSpots.has(result.powerspot.パワースポット名) &&
                    !selectedSpots.some(s => s.powerspot.パワースポット名 === result.powerspot.パワースポット名)
                ).slice(0, 2 - selectedSpots.length);
                
                console.log(`${category}フォールバック選定:`, fallbackSpots.length, '件');
                selectedSpots.push(...fallbackSpots);
            }
            
            // 使用済みスポットに追加
            selectedSpots.forEach(spot => {
                if (spot && spot.powerspot) {
                    usedSpots.add(spot.powerspot.パワースポット名);
                }
            });
            
            selected[category] = selectedSpots;
            console.log(`${category}選定完了:`, selectedSpots.length, '件');
        });
        
        return selected;
    },
    
    // カテゴリ適性判定（修正版）
    isSpotSuitableForCategory(powerspot, category) {
        // パワースポットの五行属性を取得（正規化済み）
        const spotElement = powerspot.五行属性;
        
        // ベースエネルギーを取得
        const baseEnergy = powerspot.ベースエネルギー || 0;
        
        const suitability = {
            '金運': {
                elements: ['土', '金'],
                energyThreshold: 0.75
            },
            '恋愛': {
                elements: ['水', '木'],
                energyThreshold: 0.70
            },
            '健康': {
                elements: ['木', '土', '水'],
                energyThreshold: 0.80
            },
            '全体運': {
                elements: ['火', '土', '金'],
                energyThreshold: 0.85
            }
        };
        
        const criteria = suitability[category];
        if (!criteria) return false;
        
        // 五行属性による適性
        const elementMatch = criteria.elements.includes(spotElement);
        
        // エネルギー閾値による適性
        const energyMatch = baseEnergy >= criteria.energyThreshold;
        
        // いずれかの条件を満たせば適性あり
        const isMatch = elementMatch || energyMatch;
        
        return isMatch;
    },
    
    // 季節別スポット選定（修正版）
    selectSeasonalSpots(results, usedSpots) {
        const seasons = ['春', '夏', '秋', '冬'];
        const selected = {};
        
        seasons.forEach(season => {
            console.log(`${season}スポット選定開始`);
            
            // 季節に適したスポットをフィルタリング
            const seasonSpots = results.filter(result => {
                if (usedSpots.has(result.powerspot.パワースポット名)) return false;
                return this.isSpotSuitableForSeason(result.powerspot, season);
            });
            
            console.log(`${season}に適したスポット数:`, seasonSpots.length);
            
            // 適性スポットが足りない場合、未使用スポットから高相性を選択
            const selectedSpots = [];
            
            if (seasonSpots.length >= 2) {
                selectedSpots.push(...seasonSpots.slice(0, 2));
            } else {
                // 適性スポットを全て追加
                selectedSpots.push(...seasonSpots);
                
                // 不足分を未使用の高相性スポットから補完
                const fallbackSpots = results.filter(result => 
                    !usedSpots.has(result.powerspot.パワースポット名) &&
                    !selectedSpots.some(s => s.powerspot.パワースポット名 === result.powerspot.パワースポット名)
                ).slice(0, 2 - selectedSpots.length);
                
                console.log(`${season}フォールバック選定:`, fallbackSpots.length, '件');
                selectedSpots.push(...fallbackSpots);
            }
            
            // 使用済みスポットに追加
            selectedSpots.forEach(spot => {
                if (spot && spot.powerspot) {
                    usedSpots.add(spot.powerspot.パワースポット名);
                }
            });
            
            selected[season] = selectedSpots;
            console.log(`${season}選定完了:`, selectedSpots.length, '件');
        });
        
        return selected;
    },
    
    // 季節適性判定（修正版）
    isSpotSuitableForSeason(powerspot, season) {
        // パワースポットの五行属性を取得（正規化済み）
        const spotElement = powerspot.五行属性;
        
        const seasonElements = {
            '春': ['木'],
            '夏': ['火'],
            '秋': ['金'],
            '冬': ['水']
        };
        
        return seasonElements[season]?.includes(spotElement) || false;
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
            
