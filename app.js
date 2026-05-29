/**
 * ==========================================================================
 * 细胞大作战 (Cell Wars) - 游戏核心逻辑脚本
 * ==========================================================================
 */

// ==========================================
// 1. Web Audio API 音效合成器 (Sound Synth)
// ==========================================
const SoundEffects = {
  ctx: null,

  // 延时初始化以绕过浏览器的自动播放策略
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // 如果处于悬挂状态，尝试恢复
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // 攻击/打击音效 (清脆短促的下沉音)
  playHit() {
    try {
      this.init();
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  },

  // 治疗音效 (向上攀升的电音)
  playHeal() {
    try {
      this.init();
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  },

  // 护盾音效 (锯齿波科幻充能音)
  playShield() {
    try {
      this.init();
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  },

  // 升级音效 (欢乐的马里奥式大三和弦)
  playUpgrade() {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const playNote = (freq, time, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.linearRampToValueAtTime(0.01, time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
      };
      
      playNote(261.63, now, 0.12);       // C4
      playNote(329.63, now + 0.12, 0.12); // E4
      playNote(392.00, now + 0.24, 0.12); // G4
      playNote(523.25, now + 0.36, 0.35); // C5
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  },

  // 胜利音效 (凯旋交响小和弦)
  playVictory() {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const notes = [
        { f: 261.63, d: 0.1 }, // C4
        { f: 329.63, d: 0.1 }, // E4
        { f: 392.00, d: 0.1 }, // G4
        { f: 523.25, d: 0.15 }, // C5
        { f: 392.00, d: 0.1 }, // G4
        { f: 523.25, d: 0.4 }  // C5
      ];
      let offset = 0;
      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + offset);
        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.linearRampToValueAtTime(0.01, now + offset + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + n.d);
        offset += n.d;
      });
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  },

  // 失败音效 (逐渐衰落悲伤声)
  playDefeat() {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const notes = [
        { f: 392.00, d: 0.2 }, // G4
        { f: 349.23, d: 0.2 }, // F4
        { f: 311.13, d: 0.2 }, // Eb4
        { f: 246.94, d: 0.6 }  // B3
      ];
      let offset = 0;
      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.f, now + offset);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now + offset);
        
        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.linearRampToValueAtTime(0.01, now + offset + n.d);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + offset);
        osc.stop(now + offset + n.d);
        offset += n.d;
      });
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  }
};

// ==========================================
// 2. 角色与细菌数据库 (Data Configuration)
// ==========================================
const PlayerCells = [
  {
    id: 'red_cell',
    name: '红细胞',
    role: '氧气运送员',
    avatar: '🎒',
    color: 'hsl(342, 85%, 60%)',
    glow: 'rgba(255, 50, 90, 0.4)',
    desc: '在体内血液循环中运送氧气和二氧化碳的勤劳小跑腿。虽然战斗力普通，但是可以使用独特的支援技能呼叫白细胞大哥，保护自身安全！',
    hp: 150, atk: 45, def: 40, spd: 75, sup: 0,
    skillName: '氧气配送',
    skillDesc: '恢复自身 40% 的最大生命值。 (冷却: 2 回合)',
    supName: '呼叫白细胞支援',
    supDesc: '大喊“白细胞救命！”。召唤中性粒细胞大哥发动突袭，造成攻击力 1.5 倍的伤害，并为红细胞阻挡下一回合 50% 的伤害。'
  },
  {
    id: 'neutrophil',
    name: '中性粒细胞',
    role: '前线巡逻兵',
    avatar: '🗡️',
    color: 'hsl(210, 20%, 90%)',
    glow: 'rgba(255, 255, 255, 0.3)',
    desc: '免疫系统中最前线的白细胞，专门清理入侵体内的细菌。性格冷静，一旦发现细菌会立刻化身杀手。速度极快，拥有非常高的先手率 and 暴击倾向！',
    hp: 155, atk: 60, def: 55, spd: 95, sup: 0,
    skillName: '游走杀菌',
    skillDesc: '闪电般突刺，造成 1.5 倍攻击力伤害，且有 45% 的概率产生暴击（造成双倍伤害）。 (冷却: 2 回合)',
    supName: '活性氧爆发',
    supDesc: '释放活性氧，使自身攻击力增加 25%，持续 2 回合。'
  },
  {
    id: 'killer_t',
    name: '杀伤性T细胞',
    role: '主力突击队',
    avatar: '👊',
    color: 'hsl(25, 95%, 55%)',
    glow: 'rgba(255, 100, 0, 0.4)',
    desc: '免疫系统中的精英主力战队，听从辅助T细胞的指令出击。外表粗鲁强悍，拥有极具破坏力的铁拳，可以直接粉碎细菌的坚硬防御！',
    hp: 180, atk: 70, def: 60, spd: 60, sup: 0,
    skillName: 'T细胞重拳',
    skillDesc: '挥出重装一拳，造成 1.8 倍攻击力伤害，并直接破防（无视目标 50% 的防御力）。 (冷却: 3 回合)',
    supName: '战斗怒吼',
    supDesc: '强力怒吼鼓舞斗志，使自身攻击力与防御力同时提升 15%，持续 3 回合。'
  },
  {
    id: 'macrophage',
    name: '巨噬细胞',
    role: '优雅扫除者',
    avatar: '🧹',
    color: 'hsl(330, 85%, 75%)',
    glow: 'rgba(255, 180, 200, 0.4)',
    desc: '身穿优雅白色女仆装的大姐姐，在血管中打扫细胞垃圾。但当面对大量细菌入侵时，她会举起沉重的大柴刀，面带微笑地横扫全场！',
    hp: 200, atk: 80, def: 75, spd: 80, sup: 35,
    skillName: '大柴刀横扫',
    skillDesc: '优雅挥舞柴刀，造成 1.4 倍攻击力伤害，同时将造成伤害 of 50% 转化为生命值治疗自己。 (冷却: 2 回合)',
    supName: '抗原呈递',
    supDesc: '向免疫系统汇报细菌情报，使敌人的防御力降低 30% 持续 3 回合，同时治疗自身 15% 生命值。'
  },
  {
    id: 'nk_cell',
    name: 'NK细胞',
    role: '免疫游侠',
    avatar: '🤺',
    color: 'hsl(175, 100%, 45%)',
    glow: 'rgba(0, 255, 200, 0.4)',
    desc: '自然杀伤细胞，不受指令限制在体内到处游荡，寻找并摧毁突变的癌细胞。性格独立洒脱，在自身生命值越低时，爆发出的战斗力越强大！',
    hp: 160, atk: 85, def: 50, spd: 50, sup: 0,
    skillName: '免疫突击',
    skillDesc: '凌厉剑风突击，造成 2.0 倍攻击力伤害。若自身血量低于 50%，则伤害提升至 3.0 倍！ (冷却: 3 回合)',
    supName: '活性化笑脸',
    supDesc: '以爽朗的大笑激活体能，恢复最大生命值的 25% 并提升速度 20%，持续 2 回合。'
  },
  {
    id: 'platelet',
    name: '血小板',
    role: '血管修补师',
    avatar: '👧',
    color: 'hsl(45, 100%, 60%)',
    glow: 'rgba(255, 200, 0, 0.4)',
    desc: '身型娇小可爱的修补小分队，主要负责堵塞血管伤口。虽然她没有任何直接的攻击力，但是能召唤纤维蛋白和凝血网筑起坚固屏障，抵御任何猛烈的攻击！',
    hp: 120, atk: 0, def: 35, spd: 60, sup: 95,
    skillName: '纤维蛋白屏障',
    skillDesc: '修补血管，获得一层相当于自身【辅助属性】1.2倍 (114点) 的坚固护盾。 (冷却: 3 回合)',
    supName: '伤口凝聚止血',
    supDesc: '治疗自己 30% 生命值，并为身上的护盾再次充能【辅助属性】0.6倍 (57点) 的护盾值。'
  }
];

const EnemyBacteria = [
  {
    name: '绿脓杆菌',
    avatar: '👾',
    diff: '简单',
    color: 'var(--color-toxic-green)',
    glow: 'rgba(40, 200, 100, 0.3)',
    desc: '自然界常见的细菌，对免疫健全的身体没有太大威胁。会喷涂粘液进行单体撞击。',
    hp: 120, atk: 50, def: 30, spd: 70, sup: 0,
    specialName: '粘液喷吐',
    specialDesc: '喷吐粘液，造成 1.3 倍的普通攻击伤害。'
  },
  {
    name: '肺炎链球菌',
    avatar: '🌀',
    diff: '普通',
    color: 'var(--color-toxic-purple)',
    glow: 'rgba(150, 50, 255, 0.3)',
    desc: '引起肺炎的细菌，拥有一层厚厚的荚膜。会吐出难缠的荚膜物质限制免疫细胞的活动。',
    hp: 145, atk: 60, def: 55, spd: 80, sup: 25,
    specialName: '荚膜泥泞',
    specialDesc: '造成 1.2 倍伤害，并降低玩家 20% 的速度，持续 2 回合。',
    healName: '孢子增殖',
    healDesc: '启动自我分裂，恢复自身 35 点生命值。'
  },
  {
    name: '金黄色葡萄球菌',
    avatar: '🔱',
    diff: '困难',
    color: 'var(--color-toxic-yellow)',
    glow: 'rgba(255, 200, 0, 0.3)',
    desc: '定植于皮肤表面的强悍病菌，能够产生多种毒素，防御力极其惊人，擅长消耗战。',
    hp: 165, atk: 60, def: 85, spd: 75, sup: 0,
    specialName: '金黄色刺杀',
    specialDesc: '造成 1.4 倍物理攻击伤害。',
    healName: '凝固酶护盾',
    healDesc: '增加自身 30% 的防御力，持续 2 回合。'
  },
  {
    name: '脑膜炎球菌',
    avatar: '☠️',
    diff: '极难',
    color: 'var(--color-toxic-purple)',
    glow: 'rgba(200, 0, 150, 0.4)',
    desc: '进入血液会引起严重败血症的烈性病菌，攻击非常凶残，还会释放内毒素削弱细胞。',
    hp: 180, atk: 70, def: 80, spd: 85, sup: 30,
    specialName: '毒素穿刺',
    specialDesc: '造成 1.3 倍伤害，并降低玩家 20% 的攻击力，持续 2 回合。',
    healName: '荚膜防御壁',
    healDesc: '获得 50 点屏障护盾，并恢复自身 20 点生命值。'
  },
  {
    name: '幽门螺杆菌',
    avatar: '🛸',
    diff: '史诗',
    color: 'var(--color-toxic-acid)',
    glow: 'rgba(0, 180, 100, 0.4)',
    desc: '生活在强酸胃液中的生存大师，形状像一架直升机，能够喷射强酸液，具有极高的破坏力。',
    hp: 200, atk: 75, def: 95, spd: 60, sup: 0,
    specialName: '酸液喷射',
    specialDesc: '喷涂强腐蚀性胃酸，造成 1.6 倍的巨大伤害。',
    healName: '尿素酶中和',
    healDesc: '中和周围环境，获得 70 点强酸护盾。'
  },
  {
    name: '癌细胞',
    avatar: '👑',
    diff: '终极 BOSS',
    color: 'var(--color-cancer)',
    glow: 'rgba(255, 0, 0, 0.5)',
    desc: '身体内发生基因突变而疯狂增殖的恶性肿瘤细胞。拥有极其变态的破坏力与生存本领，会不断自我分裂复制，必须将其彻底消灭！',
    hp: 280, atk: 95, def: 95, spd: 75, sup: 40,
    specialName: '异常基因突变',
    specialDesc: '造成 1.8 倍毁灭打击，并使玩家每回合受到 15 点剧毒伤害，持续 3 回合。',
    healName: '恶性细胞增殖',
    healDesc: '吸收营养疯狂增殖，恢复自身 60 点生命值，并永久提升 10% 攻击力！'
  }
];

// ==========================================
// 3. 游戏全局状态机 (Game State Manager)
// ==========================================
const Game = {
  // 玩家状态
  player: {
    baseInfo: null, // 选中的基础细胞对象
    level: 1,
    exp: 0,
    // 战斗实时属性
    hp: 0,
    maxHp: 0,
    atk: 0,
    def: 0,
    spd: 0,
    sup: 0,
    shield: 0,
    cooldowns: { skill: 0, support: 0 },
    buffs: {} // {buffName: duration}
  },

  // 敌方状态
  enemy: {
    baseInfo: null,
    hp: 0,
    maxHp: 0,
    atk: 0,
    def: 0,
    spd: 0,
    sup: 0,
    shield: 0,
    buffs: {}
  },

  // 关卡进度
  currentStageIdx: 0,
  unlockedStageIdx: 0, // 当前解锁的最高关卡 (0-5)

  // 战斗回合数据
  roundNum: 1,
  currentTurn: 'player', // 'player' | 'enemy'
  isFighting: false,

  // 初始化入口
  init() {
    this.bindEvents();
    this.renderSelectorGrid();
  },

  // 绑定 DOM 事件
  bindEvents() {
    // 1. 欢迎页进入选择页
    document.getElementById('btn-start-game').addEventListener('click', () => {
      SoundEffects.playHit();
      this.switchScreen('screen-welcome', 'screen-select');
    });

    // 2. 选择页确认选择，进入地图
    document.getElementById('btn-confirm-cell').addEventListener('click', () => {
      if (!this.player.baseInfo) return;
      SoundEffects.playUpgrade();
      this.initPlayerStats();
      this.renderMap();
      this.switchScreen('screen-select', 'screen-map');
    });

    // 3. 地图页返回选择页
    document.getElementById('btn-back-to-select').addEventListener('click', () => {
      SoundEffects.playHit();
      this.switchScreen('screen-map', 'screen-select');
    });

    // 4. 战斗中撤退
    document.getElementById('btn-escape').addEventListener('click', () => {
      SoundEffects.playHit();
      this.isFighting = false;
      this.switchScreen('screen-battle', 'screen-map');
    });

    // 5. 战斗指令按钮
    document.getElementById('btn-atk').addEventListener('click', () => this.handlePlayerAction('attack'));
    document.getElementById('btn-def').addEventListener('click', () => this.handlePlayerAction('defend'));
    document.getElementById('btn-skill').addEventListener('click', () => this.handlePlayerAction('skill'));
    document.getElementById('btn-support').addEventListener('click', () => this.handlePlayerAction('support'));

    // 6. 弹窗按钮
    document.getElementById('btn-victory-confirm').addEventListener('click', () => {
      SoundEffects.playHit();
      document.getElementById('modal-victory').classList.add('hidden');
      this.renderMap();
      this.switchScreen('screen-battle', 'screen-map');
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
      SoundEffects.playHit();
      document.getElementById('modal-defeat').classList.add('hidden');
      this.startBattle(this.currentStageIdx);
    });

    document.getElementById('btn-give-up').addEventListener('click', () => {
      SoundEffects.playHit();
      document.getElementById('modal-defeat').classList.add('hidden');
      this.switchScreen('screen-battle', 'screen-map');
    });

    document.getElementById('btn-restart-all').addEventListener('click', () => {
      SoundEffects.playUpgrade();
      document.getElementById('modal-gameclear').classList.add('hidden');
      // 重置游戏
      this.player.level = 1;
      this.player.exp = 0;
      this.unlockedStageIdx = 0;
      this.switchScreen('screen-battle', 'screen-select');
    });
  },

  // 页面切换
  switchScreen(fromId, toId) {
    document.getElementById(fromId).classList.add('hidden');
    document.getElementById(toId).classList.remove('hidden');
  },

  // ==========================================
  // 4. 渲染角色选择页面
  // ==========================================
  renderSelectorGrid() {
    const grid = document.getElementById('player-cell-grid');
    grid.innerHTML = '';

    PlayerCells.forEach(cell => {
      const card = document.createElement('div');
      card.className = 'character-select-card';
      card.style.setProperty('--theme-color', cell.color);
      card.style.setProperty('--theme-color-glow', cell.glow);
      
      card.innerHTML = `
        <span class="card-avatar-main">${cell.avatar}</span>
        <h4>${cell.name}</h4>
        <span class="card-role-mini">${cell.role}</span>
      `;

      card.addEventListener('click', () => {
        // 音效
        SoundEffects.playHit();
        
        // 视觉选中状态切换
        document.querySelectorAll('.character-select-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        // 显示详情面板
        this.selectCell(cell);
      });

      grid.appendChild(card);
    });
  },

  // 选中卡牌后渲染右侧详情板
  selectCell(cell) {
    this.player.baseInfo = cell;

    const panelContent = document.getElementById('cell-details-content');
    const placeholder = document.querySelector('.details-placeholder');
    
    placeholder.classList.add('hidden');
    panelContent.classList.remove('hidden');

    // 动态应用细胞配色
    const panel = document.getElementById('cell-details-panel');
    panel.style.setProperty('--theme-color', cell.color);
    panel.style.setProperty('--theme-color-glow', cell.glow);

    document.getElementById('detail-name').innerText = cell.name;
    document.getElementById('detail-role').innerText = cell.role;
    document.getElementById('detail-desc').innerText = cell.desc;

    // 数值比例化显示 (100为满度)
    document.getElementById('bar-atk').style.width = `${cell.atk}%`;
    document.getElementById('val-atk').innerText = cell.atk;
    
    document.getElementById('bar-def').style.width = `${cell.def}%`;
    document.getElementById('val-def').innerText = cell.def;
    
    document.getElementById('bar-spd').style.width = `${cell.spd}%`;
    document.getElementById('val-spd').innerText = cell.spd;
    
    document.getElementById('bar-sup').style.width = `${cell.sup}%`;
    document.getElementById('val-sup').innerText = cell.sup;

    document.getElementById('detail-skill-desc').innerText = cell.skillDesc;

    const confirmBtn = document.getElementById('btn-confirm-cell');
    confirmBtn.disabled = false;
    confirmBtn.style.background = cell.color;
    confirmBtn.style.color = cell.id === 'neutrophil' ? '#121212' : '#fff';
  },

  // ==========================================
  // 5. 初始化与升级计算
  // ==========================================
  initPlayerStats() {
    const base = this.player.baseInfo;
    this.player.maxHp = Math.round(base.hp * Math.pow(1.15, this.player.level - 1));
    this.player.hp = this.player.maxHp;
    this.player.atk = Math.round(base.atk * Math.pow(1.10, this.player.level - 1));
    this.player.def = Math.round(base.def * Math.pow(1.10, this.player.level - 1));
    this.player.spd = Math.round(base.spd * Math.pow(1.05, this.player.level - 1));
    this.player.sup = Math.round(base.sup * Math.pow(1.10, this.player.level - 1));
    this.player.shield = 0;
    this.player.cooldowns = { skill: 0, support: 0 };
    this.player.buffs = {};
  },

  // 获得经验值与升级判断
  gainExp(amount) {
    this.player.exp += amount;
    const requiredExp = this.player.level * 100;
    
    const lvlUpBox = document.getElementById('lvl-up-box');
    lvlUpBox.classList.add('hidden');

    if (this.player.exp >= requiredExp) {
      // 触发升级
      this.player.exp -= requiredExp;
      this.player.level += 1;
      SoundEffects.playUpgrade();

      // 计算新数值增量
      const base = this.player.baseInfo;
      const oldHp = this.player.maxHp;
      const oldAtk = this.player.atk;
      const oldDef = this.player.def;

      this.initPlayerStats(); // 重算新属性

      // 展现升级飘字
      document.getElementById('txt-up-hp').innerText = `+${this.player.maxHp - oldHp}`;
      document.getElementById('txt-up-atk').innerText = `+${this.player.atk - oldAtk}`;
      document.getElementById('txt-up-def').innerText = `+${this.player.def - oldDef}`;
      lvlUpBox.classList.remove('hidden');
    }
  },

  // ==========================================
  // 6. 渲染地图关卡
  // ==========================================
  renderMap() {
    // 渲染迷你头部徽章
    document.getElementById('map-player-badge').style.borderColor = this.player.baseInfo.color;
    document.getElementById('map-player-name').innerText = this.player.baseInfo.name;
    document.getElementById('map-player-level').innerText = `等级: ${this.player.level} (${this.player.exp}/${this.player.level * 100} EXP)`;
    document.getElementById('map-player-badge').querySelector('.avatar-icon').innerText = this.player.baseInfo.avatar;

    const container = document.getElementById('levels-container');
    container.innerHTML = '';

    EnemyBacteria.forEach((enemy, idx) => {
      const isLocked = idx > this.unlockedStageIdx;
      const node = document.createElement('div');
      node.className = `map-node-card ${isLocked ? 'locked' : ''}`;
      node.style.setProperty('--enemy-theme-color', enemy.color);
      node.style.setProperty('--enemy-theme-color-glow', enemy.glow);

      node.innerHTML = `
        <div class="node-status-glow"></div>
        <div class="node-stage-num">STAGE 0${idx + 1}</div>
        <div class="node-avatar">${isLocked ? '🔒' : enemy.avatar}</div>
        <div class="node-name">${enemy.name}</div>
        <div class="node-badge">${isLocked ? '已锁' : enemy.diff}</div>
      `;

      if (!isLocked) {
        node.addEventListener('click', () => {
          SoundEffects.playHit();
          this.startBattle(idx);
        });
      }

      container.appendChild(node);
    });

    // 动态计算 SVG 路径折线，把关卡连起来 (只在视口稳定后)
    setTimeout(() => this.drawMapConnections(), 100);
  },

  // 用 SVG 绘制关卡连线
  drawMapConnections() {
    const container = document.getElementById('levels-container');
    const cards = container.querySelectorAll('.map-node-card');
    const svgPath = document.getElementById('svg-map-line');
    
    if (cards.length < 2 || !svgPath) return;

    const containerRect = container.getBoundingClientRect();
    let pathD = '';

    cards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      // 获取卡片中央坐标
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;
      
      if (idx === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        // 贝塞尔波浪曲线连接
        const prevRect = cards[idx - 1].getBoundingClientRect();
        const prevX = prevRect.left - containerRect.left + prevRect.width / 2;
        const prevY = prevRect.top - containerRect.top + prevRect.height / 2;
        const cpX1 = prevX + (x - prevX) / 2;
        const cpY1 = prevY;
        const cpX2 = prevX + (x - prevX) / 2;
        const cpY2 = y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
      }
    });

    svgPath.setAttribute('d', pathD);
  },

  // ==========================================
  // 7. 战斗状态机 (Battle Loop)
  // ==========================================
  startBattle(stageIdx) {
    this.currentStageIdx = stageIdx;
    const enemyData = EnemyBacteria[stageIdx];

    // 初始化敌人属性
    this.enemy.baseInfo = enemyData;
    this.enemy.maxHp = enemyData.hp;
    this.enemy.hp = enemyData.hp;
    this.enemy.atk = enemyData.atk;
    this.enemy.def = enemyData.def;
    this.enemy.spd = enemyData.spd;
    this.enemy.sup = enemyData.sup;
    this.enemy.shield = 0;
    this.enemy.buffs = {};

    // 重算玩家的起始状态
    this.initPlayerStats();

    // 战斗场面数据
    this.roundNum = 1;
    this.isFighting = true;

    // 清空冷却与缓冲
    this.player.cooldowns = { skill: 0, support: 0 };

    // DOM UI 初始化
    document.getElementById('battle-stage-title').innerText = `第 ${stageIdx + 1} 关: ${enemyData.name} 对决`;
    document.getElementById('val-round-num').innerText = this.roundNum;

    // 渲染卡牌皮肤
    const pCard = document.getElementById('battle-player-card');
    pCard.style.setProperty('--theme-color', this.player.baseInfo.color);
    pCard.style.setProperty('--theme-color-glow', this.player.baseInfo.glow);
    document.getElementById('battle-player-avatar').innerText = this.player.baseInfo.avatar;
    document.getElementById('battle-player-name').innerText = this.player.baseInfo.name;

    const eCard = document.getElementById('battle-enemy-card');
    eCard.style.setProperty('--enemy-theme-color', enemyData.color);
    eCard.style.setProperty('--enemy-theme-color-glow', enemyData.glow);
    document.getElementById('battle-enemy-avatar').innerText = enemyData.avatar;
    document.getElementById('battle-enemy-name').innerText = enemyData.name;

    // 重置并清空战斗日志
    const logBox = document.getElementById('battle-log-lines');
    logBox.innerHTML = '';
    this.addLog(`🚨 血管巡逻警报！遭遇了 ${enemyData.name}！`, 'system-line');

    // 刷新指令描述
    this.updateActionTooltips();

    // 更新血条
    this.updateHpBars();

    this.switchScreen('screen-map', 'screen-battle');

    // 速度高者先手
    if (this.player.spd >= this.enemy.spd) {
      this.currentTurn = 'player';
      this.addLog(`⚡ 你的速度为 ${this.player.spd}，获得先手！`, 'player-line');
      this.enableActionButtons(true);
    } else {
      this.currentTurn = 'enemy';
      this.addLog(`⚡ 敌方速度为 ${this.enemy.spd}，获得了先手！`, 'enemy-line');
      this.enableActionButtons(false);
      setTimeout(() => this.executeEnemyTurn(), 1500);
    }
  },

  // 刷新指令说明
  updateActionTooltips() {
    const base = this.player.baseInfo;
    
    // 普通攻击描述
    if (base.id === 'platelet') {
      // 血小板特例
      document.getElementById('desc-atk').innerText = `召唤白细胞攻击 (造成约 ${Math.round(40 + this.player.level * 8)} 点伤害)`;
    } else {
      document.getElementById('desc-atk').innerText = `物理撞击 (造成约 ${Math.round(this.player.atk * (1 - this.enemy.def / 200))} 点伤害)`;
    }

    // 专属技能描述
    document.getElementById('desc-skill').innerText = `${base.skillName} (${this.player.cooldowns.skill > 0 ? `CD: ${this.player.cooldowns.skill}t` : '可用'})`;
    
    // 辅助描述
    document.getElementById('desc-support').innerText = `${base.supName}`;
  },

  // 开关操作盘
  enableActionButtons(enabled) {
    document.getElementById('btn-atk').disabled = !enabled;
    document.getElementById('btn-def').disabled = !enabled;
    
    // 冷却判定
    document.getElementById('btn-skill').disabled = !enabled || (this.player.cooldowns.skill > 0);
    document.getElementById('btn-support').disabled = !enabled || (this.player.cooldowns.support > 0);
  },

  // 伤害计算核心
  calcDamage(atk, def, multiplier = 1.0) {
    // 伤害 = 攻击力 * 技能倍率 * (1 - 防御力/200)
    let dmg = Math.round(atk * multiplier * (1 - def / 200));
    return Math.max(5, dmg); // 兜底 5 点伤害
  },

  // 写入战斗日志并向下滚动
  addLog(text, className = '') {
    const logBox = document.getElementById('battle-log-lines');
    const line = document.createElement('div');
    line.className = `log-line ${className}`;
    line.innerText = text;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  },

  // 更新双方 HP 及 护盾 UI
  updateHpBars() {
    // 玩家 HP
    const pPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    document.getElementById('battle-player-hp-bar').style.width = `${pPercent}%`;
    document.getElementById('battle-player-hp-txt').innerText = `${this.player.hp} / ${this.player.maxHp}`;
    
    // 玩家护盾
    const pShieldPercent = Math.min(100, (this.player.shield / this.player.maxHp) * 100);
    document.getElementById('battle-player-shield-bar').style.width = `${pShieldPercent}%`;

    // 敌方 HP
    const ePercent = Math.max(0, (this.enemy.hp / this.enemy.maxHp) * 100);
    document.getElementById('battle-enemy-hp-bar').style.width = `${ePercent}%`;
    document.getElementById('battle-enemy-hp-txt').innerText = `${this.enemy.hp} / ${this.enemy.maxHp}`;
    
    // 敌方护盾
    const eShieldPercent = Math.min(100, (this.enemy.shield / this.enemy.maxHp) * 100);
    document.getElementById('battle-enemy-shield-bar').style.width = `${eShieldPercent}%`;

    // 渲染 Buff/Debuff 徽章
    this.renderBuffBadges('battle-player-buffs', this.player.buffs);
    this.renderBuffBadges('battle-enemy-buffs', this.enemy.buffs);
  },

  // 渲染 Buff 状态小徽章
  renderBuffBadges(elemId, buffs) {
    const box = document.getElementById(elemId);
    box.innerHTML = '';
    
    Object.keys(buffs).forEach(bName => {
      if (buffs[bName] > 0) {
        const span = document.createElement('span');
        span.className = 'badge';
        
        let emoji = '🔮';
        let style = 'badge-buff';
        
        if (bName === 'defending') { emoji = '🛡️'; span.innerText = `${emoji} 防御中`; }
        else if (bName === 'speed_up') { emoji = '⚡'; span.innerText = `${emoji} 加速`; }
        else if (bName === 'atk_up') { emoji = '🗡️'; span.innerText = `${emoji} 增攻`; }
        else if (bName === 'morale_boost') { emoji = '🔥'; span.innerText = `${emoji} 增幅`; }
        else if (bName === 'poisoned') { emoji = '🤢'; span.innerText = `${emoji} 中毒`; style = 'badge-debuff'; }
        else if (bName === 'slowed') { emoji = '🕸️'; span.innerText = `${emoji} 减速`; style = 'badge-debuff'; }
        else if (bName === 'atk_down') { emoji = '🌫️'; span.innerText = `${emoji} 虚弱`; style = 'badge-debuff'; }
        else { span.innerText = bName; }
        
        span.classList.add(style);
        box.appendChild(span);
      }
    });
  },

  // 浮动伤害字效
  showDamagePop(amount, type, isPlayer = true) {
    const parent = document.getElementById(isPlayer ? 'card-player-container' : 'card-enemy-container');
    if (!parent) return;
    const pop = document.createElement('div');
    pop.className = `pop-text pop-${type}`;
    
    if (type === 'heal') pop.innerText = `+${amount} HP`;
    else if (type === 'shield') pop.innerText = `+${amount} 护盾`;
    else if (type === 'miss') pop.innerText = `闪避`;
    else pop.innerText = `-${amount}`;
    
    parent.appendChild(pop);

    // 0.8秒后彻底移除该节点
    setTimeout(() => pop.remove(), 800);
  },

  // ==========================================
  // 8. 玩家回合行动执行
  // ==========================================
  handlePlayerAction(type) {
    if (this.currentTurn !== 'player' || !this.isFighting) return;
    
    this.enableActionButtons(false); // 锁死面板
    const pCard = document.getElementById('battle-player-card');
    const eCard = document.getElementById('battle-enemy-card');
    
    // 执行相应动作
    if (type === 'attack') {
      // 物理攻击
      pCard.classList.add('dash-player');
      SoundEffects.playHit();
      
      let dmg = 0;
      if (this.player.baseInfo.id === 'platelet') {
        // 血小板是召唤攻击，无视防御，平滑上升
        dmg = 30 + this.player.level * 6;
        this.addLog(`👧 血小板挥舞小旗，呼唤中性粒细胞大哥支援！对敌方造成了 ${dmg} 点协助伤害！`, 'player-line');
      } else {
        // 普通伤害
        let multiplier = 1.0;
        let isCrit = false;
        
        // 中性粒细胞暴击判定
        if (this.player.baseInfo.id === 'neutrophil' && Math.random() < 0.15) {
          multiplier = 2.0;
          isCrit = true;
        }
        
        // 增攻buff
        if (this.player.buffs.atk_up > 0) multiplier *= 1.25;
        if (this.player.buffs.morale_boost > 0) multiplier *= 1.15;
        if (this.player.buffs.atk_down > 0) multiplier *= 0.8;

        dmg = this.calcDamage(this.player.atk, this.enemy.def, multiplier);
        if (isCrit) {
          this.addLog(`⚡ 暴击！${this.player.baseInfo.name} 普通攻击，对敌人造成了双倍 ${dmg} 点伤害！`, 'player-line');
        } else {
          this.addLog(`🗡️ ${this.player.baseInfo.name} 发起撞击，对敌人造成 ${dmg} 点伤害！`, 'player-line');
        }
      }

      setTimeout(() => {
        this.applyDamageToEnemy(dmg);
        pCard.classList.remove('dash-player');
        this.finishTurn();
      }, 400);

    } else if (type === 'defend') {
      // 防御动作
      SoundEffects.playShield();
      pCard.classList.add('flash-shield');
      this.player.buffs.defending = 2; // 2回合（本回合+下个敌人回合）
      this.addLog(`🛡️ ${this.player.baseInfo.name} 进入防御姿态，下一次受到的伤害将减半！`, 'player-line');

      setTimeout(() => {
        pCard.classList.remove('flash-shield');
        this.finishTurn();
      }, 400);

    } else if (type === 'skill') {
      // 触发专属大招
      pCard.classList.add('dash-player');
      this.player.cooldowns.skill = 3; // 冷却CD
      
      const pId = this.player.baseInfo.id;
      if (pId === 'red_cell') {
        // 红细胞吸氧恢复
        SoundEffects.playHeal();
        pCard.classList.add('flash-success');
        const healVal = Math.round(this.player.maxHp * 0.4);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healVal);
        this.showDamagePop(healVal, 'heal', true);
        this.addLog(`🎒 红细胞卸下二氧化碳，注入新鲜氧气！恢复了 ${healVal} 点生命值！`, 'heal-line');
        
        setTimeout(() => {
          pCard.classList.remove('flash-success');
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 500);

      } else if (pId === 'neutrophil') {
        // 游走杀菌
        SoundEffects.playHit();
        let isCrit = Math.random() < 0.45;
        let mult = isCrit ? 3.0 : 1.5;
        
        if (this.player.buffs.atk_up > 0) mult *= 1.25;
        if (this.player.buffs.atk_down > 0) mult *= 0.8;

        const dmg = this.calcDamage(this.player.atk, this.enemy.def, mult);
        
        if (isCrit) {
          this.addLog(`🔥 超强暴击！中性粒细胞使出【游走杀菌】大招，对敌人轰出 3.0 倍暴击伤害 ${dmg} 点！`, 'player-line');
        } else {
          this.addLog(`⚡ 中性粒细胞使用【游走杀菌】，对敌人造成 ${dmg} 点大额伤害！`, 'player-line');
        }

        setTimeout(() => {
          this.applyDamageToEnemy(dmg, isCrit ? 'damage-enemy' : 'damage-enemy');
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 400);

      } else if (pId === 'killer_t') {
        // T细胞重拳 - 忽略敌人50%防御
        SoundEffects.playHit();
        let mult = 1.8;
        if (this.player.buffs.morale_boost > 0) mult *= 1.15;
        if (this.player.buffs.atk_down > 0) mult *= 0.8;

        const partialDef = Math.round(this.enemy.def * 0.5);
        const dmg = this.calcDamage(this.player.atk, partialDef, mult);
        this.addLog(`👊 杀伤性T细胞怒吼出拳，重创细菌护甲！无视敌人一半防御，造成了 ${dmg} 点强力伤害！`, 'player-line');

        setTimeout(() => {
          this.applyDamageToEnemy(dmg);
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 400);

      } else if (pId === 'macrophage') {
        // 巨噬细胞大柴刀 - 造成伤害并回血 50%
        SoundEffects.playHit();
        let mult = 1.4;
        const dmg = this.calcDamage(this.player.atk, this.enemy.def, mult);
        const heal = Math.round(dmg * 0.5);
        
        this.addLog(`🧹 巨噬细胞微笑着挥起大柴刀进行大扫除！对敌人造成 ${dmg} 点伤害，并吸取了 ${heal} 点生命值！`, 'heal-line');

        setTimeout(() => {
          this.applyDamageToEnemy(dmg);
          SoundEffects.playHeal();
          pCard.classList.add('flash-success');
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
          this.showDamagePop(heal, 'heal', true);
          
          setTimeout(() => {
            pCard.classList.remove('flash-success');
            pCard.classList.remove('dash-player');
            this.finishTurn();
          }, 400);
        }, 400);

      } else if (pId === 'nk_cell') {
        // NK细胞免疫突击 - 绝地反击
        SoundEffects.playHit();
        let mult = 2.0;
        if (this.player.hp < this.player.maxHp * 0.5) {
          mult = 3.2; // 低血增伤
          this.addLog(`⚠️ 警告！自身处于半血危机！NK细胞眼神突变，免疫活性大幅度上升！`, 'system-line');
        }
        const dmg = this.calcDamage(this.player.atk, this.enemy.def, mult);
        this.addLog(`🤺 NK细胞高空跃起，拔出军刀极速突袭！对细菌造成了 ${dmg} 点斩击伤害！`, 'player-line');

        setTimeout(() => {
          this.applyDamageToEnemy(dmg);
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 400);

      } else if (pId === 'platelet') {
        // 血小板纤维蛋白网 - 生成 1.2倍 辅助值的盾
        SoundEffects.playShield();
        pCard.classList.add('flash-shield');
        const shieldVal = Math.round(this.player.sup * 1.2);
        this.player.shield += shieldVal;
        this.showDamagePop(shieldVal, 'shield', true);
        this.addLog(`👧 血小板凝聚起大量的纤维蛋白网，在前方筑起了一面 ${shieldVal} 点防御强度的止血护盾！`, 'shield-line');

        setTimeout(() => {
          pCard.classList.remove('flash-shield');
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 500);
      }

    } else if (type === 'support') {
      // 触发辅助支援技能
      pCard.classList.add('dash-player');
      this.player.cooldowns.support = 4; // 冷却

      const pId = this.player.baseInfo.id;
      if (pId === 'red_cell') {
        // 红细胞呼叫白细胞支援
        SoundEffects.playHit();
        pCard.classList.add('flash-success');
        
        let dmg = this.calcDamage(this.player.atk, this.enemy.def, 1.5);
        this.addLog(`🗣️ 红细胞大喊：“白细胞哥哥救命啊！！”`, 'player-line');
        this.addLog(`🗡️ 中性粒细胞瞬间破墙而出！对敌人造成了 ${dmg} 点击杀伤害！并掩护红细胞防守！`, 'player-line');
        
        this.player.buffs.defending = 2; // 下一回合伤害减半

        setTimeout(() => {
          this.applyDamageToEnemy(dmg);
          pCard.classList.remove('flash-success');
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 400);

      } else if (pId === 'neutrophil') {
        // 中性粒细胞爆发攻击力
        SoundEffects.playShield();
        pCard.classList.add('flash-success');
        this.player.buffs.atk_up = 3;
        this.addLog(`🗡️ 中性粒细胞处于杀菌兴奋状态！攻击力临时增幅 25%，持续 2 回合。`, 'shield-line');

        setTimeout(() => {
          pCard.classList.remove('flash-success');
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 400);

      } else if (pId === 'killer_t') {
        // T细胞战斗热血，攻防同升
        SoundEffects.playShield();
        pCard.classList.add('flash-shield');
        this.player.buffs.morale_boost = 4; // 3回合
        this.addLog(`🔥 杀伤性T细胞发出震天狂吼！3回合内自身攻击力与防御力同时提升 15%！`, 'shield-line');

        setTimeout(() => {
          pCard.classList.remove('flash-shield');
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 400);

      } else if (pId === 'macrophage') {
        // 巨噬细胞呈递抗原，减防敌方
        SoundEffects.playHeal();
        pCard.classList.add('flash-success');
        const heal = Math.round(this.player.maxHp * 0.15);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        this.showDamagePop(heal, 'heal', true);
        
        this.enemy.buffs.atk_down = 4; // 敌方减防/攻击
        this.addLog(`🧼 巨噬细胞呈递细菌抗原，指挥后方降低病菌 30% 防御力 (持续3回合)。自身恢复了 ${heal} 点生命！`, 'heal-line');

        setTimeout(() => {
          pCard.classList.remove('flash-success');
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 400);

      } else if (pId === 'nk_cell') {
        // NK细胞大笑回血与提速
        SoundEffects.playHeal();
        pCard.classList.add('flash-success');
        const heal = Math.round(this.player.maxHp * 0.25);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        this.showDamagePop(heal, 'heal', true);

        this.player.buffs.speed_up = 3;
        this.addLog(`⚡ NK细胞嘲讽大笑！活性化提升！恢复 ${heal} 点生命，并且 2 回合内速度提高 20%！`, 'heal-line');

        setTimeout(() => {
          pCard.classList.remove('flash-success');
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 400);

      } else if (pId === 'platelet') {
        // 血小板伤口凝聚，恢复生命与屏障
        SoundEffects.playHeal();
        pCard.classList.add('flash-success');
        const heal = Math.round(this.player.maxHp * 0.3);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        this.showDamagePop(heal, 'heal', true);

        const shieldVal = Math.round(this.player.sup * 0.6);
        this.player.shield += shieldVal;
        this.showDamagePop(shieldVal, 'shield', true);
        this.addLog(`💖 血小板们整齐划一，凝聚伤口！恢复 ${heal} 点生命，并修补了 ${shieldVal} 点护盾！`, 'heal-line');

        setTimeout(() => {
          pCard.classList.remove('flash-success');
          pCard.classList.remove('dash-player');
          this.finishTurn();
        }, 500);
      }
    }
  },

  // 结算给敌人伤害
  applyDamageToEnemy(amount, popType = 'damage-enemy') {
    const eCard = document.getElementById('battle-enemy-card');
    eCard.classList.add('shake-animation');
    eCard.classList.add('flash-danger');
    
    // 如果有护盾，优先抵扣护盾
    if (this.enemy.shield > 0) {
      if (this.enemy.shield >= amount) {
        this.enemy.shield -= amount;
        this.addLog(`🛡️ 敌方的屏障吸收了全部 ${amount} 点伤害！`, 'enemy-line');
      } else {
        const left = amount - this.enemy.shield;
        this.addLog(`🛡️ 敌方屏障碎裂！吸收了 ${this.enemy.shield} 点伤害，剩余 ${left} 点穿透生命值。`, 'enemy-line');
        this.enemy.shield = 0;
        this.enemy.hp = Math.max(0, this.enemy.hp - left);
      }
    } else {
      this.enemy.hp = Math.max(0, this.enemy.hp - amount);
    }
    
    this.showDamagePop(amount, popType, false);
    this.updateHpBars();

    setTimeout(() => {
      eCard.classList.remove('shake-animation');
      eCard.classList.remove('flash-danger');
    }, 400);
  },

  // ==========================================
  // 9. 敌方 AI 动作执行
  // ==========================================
  executeEnemyTurn() {
    if (!this.isFighting) return;
    
    const eCard = document.getElementById('battle-enemy-card');
    const pCard = document.getElementById('battle-player-card');

    eCard.classList.add('dash-enemy');

    // 敌人技能决策逻辑
    const base = this.enemy.baseInfo;
    let actionType = 'attack'; // 默认普通撞击

    // 半血以下且有治疗手段时，概率自我修复
    if (this.enemy.hp < this.enemy.maxHp * 0.4 && base.healName) {
      if (Math.random() < 0.6) {
        actionType = 'heal';
      }
    } else {
      // 否则 35% 几率发大招
      if (Math.random() < 0.4) {
        actionType = 'special';
      }
    }

    if (actionType === 'attack') {
      // 敌方普通撞击
      SoundEffects.playHit();
      const dmg = this.calcDamage(this.enemy.atk, this.player.def, 1.0);
      this.addLog(`👾 ${base.name} 发动触手撞击，对你造成了 ${dmg} 点伤害！`, 'enemy-line');
      
      setTimeout(() => {
        this.applyDamageToPlayer(dmg);
        eCard.classList.remove('dash-enemy');
        this.finishTurn();
      }, 400);

    } else if (actionType === 'special') {
      // 敌方特殊技能
      SoundEffects.playHit();
      
      if (base.name === '绿脓杆菌') {
        const dmg = this.calcDamage(this.enemy.atk, this.player.def, 1.3);
        this.addLog(`🤢 绿脓杆菌使出【粘液喷吐】，绿色的酸液泼洒，造成 ${dmg} 点酸蚀伤害！`, 'enemy-line');
        setTimeout(() => {
          this.applyDamageToPlayer(dmg);
          eCard.classList.remove('dash-enemy');
          this.finishTurn();
        }, 400);

      } else if (base.name === '肺炎链球菌') {
        const dmg = this.calcDamage(this.enemy.atk, this.player.def, 1.2);
        this.player.buffs.slowed = 3; // 减速2回合
        this.player.spd = Math.round(this.player.spd * 0.8);
        this.addLog(`🕸️ 肺炎链球菌喷出【荚膜泥泞】！造成 ${dmg} 点伤害，且黏住了你，降低移速 20%！`, 'enemy-line');
        setTimeout(() => {
          this.applyDamageToPlayer(dmg);
          eCard.classList.remove('dash-enemy');
          this.finishTurn();
        }, 400);

      } else if (base.name === '金黄色葡萄球菌') {
        const dmg = this.calcDamage(this.enemy.atk, this.player.def, 1.4);
        this.addLog(`🔱 金黄色葡萄球菌凝聚重装长枪，使用【金黄色刺杀】，造成 ${dmg} 点重创伤害！`, 'enemy-line');
        setTimeout(() => {
          this.applyDamageToPlayer(dmg);
          eCard.classList.remove('dash-enemy');
          this.finishTurn();
        }, 400);

      } else if (base.name === '脑膜炎球菌') {
        const dmg = this.calcDamage(this.enemy.atk, this.player.def, 1.3);
        this.player.buffs.atk_down = 3; // 2回合虚弱
        this.addLog(`🧠 脑膜炎球菌释放内毒素！使用【毒素穿刺】造成 ${dmg} 点伤害，并削弱了你的攻击力 20%！`, 'enemy-line');
        setTimeout(() => {
          this.applyDamageToPlayer(dmg);
          eCard.classList.remove('dash-enemy');
          this.finishTurn();
        }, 400);

      } else if (base.name === '幽门螺杆菌') {
        const dmg = this.calcDamage(this.enemy.atk, this.player.def, 1.6);
        this.addLog(`🌋 幽门螺杆菌直升机触手旋转，喷出【酸液喷射】！对你造成 ${dmg} 点胃酸爆裂伤害！`, 'enemy-line');
        setTimeout(() => {
          this.applyDamageToPlayer(dmg);
          eCard.classList.remove('dash-enemy');
          this.finishTurn();
        }, 400);

      } else if (base.name === '癌细胞') {
        // 癌细胞特殊大招：带毒
        const dmg = this.calcDamage(this.enemy.atk, this.player.def, 1.8);
        this.player.buffs.poisoned = 4; // 毒3回合
        this.addLog(`☠️ 癌细胞发生【异常基因突变】，长出畸形肿瘤鞭笞，轰出 ${dmg} 点毁灭伤害，并导致你身中剧毒！`, 'enemy-line');
        setTimeout(() => {
          this.applyDamageToPlayer(dmg);
          eCard.classList.remove('dash-enemy');
          this.finishTurn();
        }, 400);
      }

    } else if (actionType === 'heal') {
      // 敌方修复/叠防御
      eCard.classList.remove('dash-enemy');
      
      if (base.name === '肺炎链球菌') {
        SoundEffects.playHeal();
        eCard.classList.add('flash-success');
        this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + 35);
        this.showDamagePop(35, 'heal', false);
        this.addLog(`🌀 肺炎链球菌启动【孢子增殖】，分裂出更多小孢子，恢复了 35 点生命值。`, 'heal-line');
        setTimeout(() => {
          eCard.classList.remove('flash-success');
          this.updateHpBars();
          this.finishTurn();
        }, 500);

      } else if (base.name === '金黄色葡萄球菌') {
        SoundEffects.playShield();
        eCard.classList.add('flash-shield');
        this.enemy.buffs.morale_boost = 3;
        this.enemy.def = Math.round(this.enemy.def * 1.3);
        this.addLog(`🛡️ 金黄色葡萄球菌启动【凝固酶护盾】，将周围纤维网化为厚重铠甲，防御力提升 30%！`, 'shield-line');
        setTimeout(() => {
          eCard.classList.remove('flash-shield');
          this.updateHpBars();
          this.finishTurn();
        }, 500);

      } else if (base.name === '脑膜炎球菌') {
        SoundEffects.playShield();
        eCard.classList.add('flash-shield');
        this.enemy.shield += 50;
        this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + 20);
        this.showDamagePop(50, 'shield', false);
        this.showDamagePop(20, 'heal', false);
        this.addLog(`🧬 脑膜炎球菌开启【荚膜防御壁】，获得 50 点细菌防雨罩并偷偷治疗了 20 点生命！`, 'shield-line');
        setTimeout(() => {
          eCard.classList.remove('flash-shield');
          this.updateHpBars();
          this.finishTurn();
        }, 500);

      } else if (base.name === '幽门螺杆菌') {
        SoundEffects.playShield();
        eCard.classList.add('flash-shield');
        this.enemy.shield += 70;
        this.showDamagePop(70, 'shield', false);
        this.addLog(`🧪 幽门螺杆菌启动【尿素酶中和】，释放碱性氨气，中和胃酸获得 70 点酸性屏障！`, 'shield-line');
        setTimeout(() => {
          eCard.classList.remove('flash-shield');
          this.updateHpBars();
          this.finishTurn();
        }, 500);

      } else if (base.name === '癌细胞') {
        SoundEffects.playHeal();
        eCard.classList.add('flash-success');
        this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + 60);
        this.enemy.atk = Math.round(this.enemy.atk * 1.1); // 永久增幅10%攻击
        this.showDamagePop(60, 'heal', false);
        this.addLog(`👑 癌细胞疯狂吸收养分，启动【恶性细胞增殖】，治愈了 60 点生命，并且身体的攻击力永久变异提升了 10%！`, 'heal-line');
        setTimeout(() => {
          eCard.classList.remove('flash-success');
          this.updateHpBars();
          this.finishTurn();
        }, 500);
      }
    }
  },

  // 结算给玩家伤害
  applyDamageToPlayer(amount) {
    const pCard = document.getElementById('battle-player-card');
    pCard.classList.add('shake-animation');
    pCard.classList.add('flash-danger');

    // 战术防御buff减伤判定
    if (this.player.buffs.defending > 0) {
      amount = Math.round(amount * 0.5);
      this.addLog(`🛡️ 你的战术防御起效了！受到的伤害折半。`, 'player-line');
    }

    // 盾墙优先抵扣
    if (this.player.shield > 0) {
      if (this.player.shield >= amount) {
        this.player.shield -= amount;
        this.addLog(`🛡️ 纤维蛋白屏障吸收了全部 ${amount} 点伤害！`, 'player-line');
      } else {
        const left = amount - this.player.shield;
        this.addLog(`🛡️ 你的纤维屏障被打破！抵挡了 ${this.player.shield} 点伤害，穿透扣除了 ${left} 点健康值。`, 'player-line');
        this.player.shield = 0;
        this.player.hp = Math.max(0, this.player.hp - left);
      }
    } else {
      this.player.hp = Math.max(0, this.player.hp - amount);
    }

    this.showDamagePop(amount, 'damage', true);
    this.updateHpBars();

    setTimeout(() => {
      pCard.classList.remove('shake-animation');
      pCard.classList.remove('flash-danger');
    }, 400);
  },

  // ==========================================
  // 10. 终结回合与状态维护
  // ==========================================
  finishTurn() {
    // 检查死亡情况
    if (this.enemy.hp <= 0) {
      this.handleVictory();
      return;
    }
    if (this.player.hp <= 0) {
      this.handleDefeat();
      return;
    }

    // 回合交换
    if (this.currentTurn === 'player') {
      // 玩家回合结束，交换给敌方
      this.currentTurn = 'enemy';
      this.enableActionButtons(false);
      
      // 冷却减少
      if (this.player.cooldowns.skill > 0) this.player.cooldowns.skill--;
      if (this.player.cooldowns.support > 0) this.player.cooldowns.support--;
      
      // Buff时间自然消减
      this.decayBuffs(this.player.buffs, 'player');

      setTimeout(() => this.executeEnemyTurn(), 1200);
    } else {
      // 敌方回合结束，交换回玩家
      this.currentTurn = 'player';
      this.roundNum++;
      document.getElementById('val-round-num').innerText = this.roundNum;
      
      // 敌方 Buff 自然消竭
      this.decayBuffs(this.enemy.buffs, 'enemy');

      // 玩家剧毒Debuff结算
      if (this.player.buffs.poisoned > 0) {
        SoundEffects.playHit();
        const poisonDmg = 15;
        this.player.hp = Math.max(0, this.player.hp - poisonDmg);
        this.showDamagePop(poisonDmg, 'damage', true);
        this.addLog(`🤢 剧毒反应！体内的酸毒液正在侵蚀你，健康值减少 15 点！`, 'enemy-line');
        this.updateHpBars();
        
        if (this.player.hp <= 0) {
          setTimeout(() => this.handleDefeat(), 500);
          return;
        }
      }

      this.addLog(`--- 回合 ${this.roundNum} 开始 (你的回合) ---`, 'system-line');
      this.updateActionTooltips();
      this.enableActionButtons(true);
    }
  },

  // 降解状态层
  decayBuffs(buffs, target) {
    Object.keys(buffs).forEach(bKey => {
      if (buffs[bKey] > 0) {
        buffs[bKey]--;
        if (buffs[bKey] === 0) {
          // Buff失效时，还原某些临时加成的属性
          if (bKey === 'speed_up' && target === 'player') {
            this.player.spd = Math.round(this.player.spd / 1.3);
            this.addLog(`✨ 你的移速增幅效果已消失。`, 'system-line');
          }
          if (bKey === 'slowed' && target === 'player') {
            this.player.spd = Math.round(this.player.spd / 0.8);
            this.addLog(`✨ 粘液已被清理，你恢复了原本的速度。`, 'system-line');
          }
        }
      }
    });
  },

  // ==========================================
  // 11. 胜负判断与弹窗逻辑
  // ==========================================
  handleVictory() {
    this.isFighting = false;
    SoundEffects.playVictory();

    // 通关结算
    const isLastStage = this.currentStageIdx === EnemyBacteria.length - 1;

    setTimeout(() => {
      if (isLastStage) {
        // 游戏通关癌细胞
        document.getElementById('clear-cell-name').innerText = this.player.baseInfo.name;
        document.getElementById('clear-cell-lv').innerText = `LV.${this.player.level}`;
        document.getElementById('modal-gameclear').classList.remove('hidden');
      } else {
        // 普通胜利
        const rewardExpVal = 100;
        document.getElementById('reward-exp').innerText = `+${rewardExpVal} EXP`;

        // 升级关卡解锁进度
        if (this.currentStageIdx === this.unlockedStageIdx) {
          this.unlockedStageIdx = Math.min(EnemyBacteria.length - 1, this.unlockedStageIdx + 1);
        }

        this.gainExp(rewardExpVal);
        document.getElementById('modal-victory').classList.remove('hidden');
      }
    }, 800);
  },

  handleDefeat() {
    this.isFighting = false;
    SoundEffects.playDefeat();

    setTimeout(() => {
      // 随机给孩子提供一条温馨的细胞攻略说明
      const tips = [
        "红细胞的速度极快，可以通过【氧气配送】恢复最大生命值的 40%，要合理利用哦！",
        "白细胞哥哥的【游走杀菌】技能暴击率极高，配合【活性氧爆发】可以打出巨大爆发伤害！",
        "杀伤T细胞是重装克星，他的重拳技能可以无视敌人 50% 的防御力！",
        "血小板虽然没有攻击力，但是【纤维蛋白屏障】吸收伤害的强度惊人，配合【伤口凝血】甚至可以无伤击败病原体！",
        "巨噬细胞大姐姐的大柴刀大招有极强的【吸血治疗】效果，攻防兼备！",
        "NK细胞处于低血量（半血以下）时，大招【免疫突击】伤害会直接暴增至 3.2 倍，是绝地反击的神技！"
      ];
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      document.getElementById('defeat-tip-text').innerText = randomTip;
      
      document.getElementById('modal-defeat').classList.remove('hidden');
    }, 800);
  }
};

// 页面加载完毕执行初始化
window.addEventListener('DOMContentLoaded', () => Game.init());
