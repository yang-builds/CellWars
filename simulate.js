/**
 * Cells at Work Game Balance Simulator (With Smart Player AI & Balanced Stats)
 * Run: node simulate.js
 */

const PlayerCells = [
  {
    id: 'red_cell',
    name: '红细胞',
    hp: 150, atk: 45, def: 40, spd: 75, sup: 0,
    skillName: '氧气配送',
    supName: '呼叫白细胞支援'
  },
  {
    id: 'neutrophil',
    name: '中性粒细胞',
    role: '前线巡逻兵',
    hp: 155, atk: 60, def: 55, spd: 95, sup: 0,
    skillName: '游走杀菌',
    supName: '活性氧爆发'
  },
  {
    id: 'killer_t',
    name: '杀伤性T细胞',
    role: '主力突击队',
    hp: 180, atk: 70, def: 60, spd: 60, sup: 0,
    skillName: 'T细胞重拳',
    supName: '战斗怒吼'
  },
  {
    id: 'macrophage',
    name: '巨噬细胞',
    role: '优雅扫除者',
    hp: 200, atk: 80, def: 75, spd: 80, sup: 35,
    skillName: '大柴刀横扫',
    supName: '抗原呈递'
  },
  {
    id: 'nk_cell',
    name: 'NK细胞',
    role: '免疫游侠',
    hp: 160, atk: 85, def: 50, spd: 50, sup: 0,
    skillName: '免疫突击',
    supName: '活性化笑脸'
  },
  {
    id: 'platelet',
    name: '血小板',
    role: '血管修补师',
    hp: 120, atk: 0, def: 35, spd: 60, sup: 95,
    skillName: '纤维蛋白屏障',
    supName: '伤口凝聚止血'
  }
];

const EnemyBacteria = [
  {
    name: '绿脓杆菌',
    hp: 120, atk: 50, def: 30, spd: 70, sup: 0,
    specialName: '粘液喷吐'
  },
  {
    name: '肺炎链球菌',
    hp: 145, atk: 60, def: 55, spd: 80, sup: 25,
    specialName: '荚膜泥泞',
    healName: '孢子增殖'
  },
  {
    name: '金黄色葡萄球菌',
    hp: 165, atk: 60, def: 85, spd: 75, sup: 0,
    specialName: '金黄色刺杀',
    healName: '凝固酶护盾'
  },
  {
    name: '脑膜炎球菌',
    hp: 180, atk: 70, def: 80, spd: 85, sup: 30,
    specialName: '毒素穿刺',
    healName: '荚膜防御壁'
  },
  {
    name: '幽门螺杆菌',
    hp: 200, atk: 75, def: 95, spd: 60, sup: 0,
    specialName: '酸液喷射',
    healName: '尿素酶中和'
  },
  {
    name: '癌细胞',
    hp: 280, atk: 95, def: 95, spd: 75, sup: 40,
    specialName: '异常基因突变',
    healName: '恶性细胞增殖'
  }
];

function getPlayerStatsAtLevel(baseCell, level) {
  return {
    id: baseCell.id,
    name: baseCell.name,
    level: level,
    maxHp: Math.round(baseCell.hp * Math.pow(1.15, level - 1)),
    atk: Math.round(baseCell.atk * Math.pow(1.10, level - 1)),
    def: Math.round(baseCell.def * Math.pow(1.10, level - 1)),
    spd: Math.round(baseCell.spd * Math.pow(1.05, level - 1)),
    sup: Math.round(baseCell.sup * Math.pow(1.10, level - 1)),
    hp: 0,
    shield: 0,
    cooldowns: { skill: 0, support: 0 },
    buffs: {}
  };
}

function resetCombatState(target, stats) {
  target.hp = stats.maxHp || stats.hp;
  target.maxHp = stats.maxHp || stats.hp;
  target.atk = stats.atk;
  target.def = stats.def;
  target.spd = stats.spd;
  target.sup = stats.sup;
  target.shield = 0;
  target.cooldowns = { skill: 0, support: 0 };
  target.buffs = {
    defending: 0,
    speed_up: 0,
    atk_up: 0,
    morale_boost: 0,
    poisoned: 0,
    slowed: 0,
    atk_down: 0
  };
}

function calcDamage(atk, def, multiplier = 1.0) {
  let dmg = Math.round(atk * multiplier * (1 - def / 200));
  return Math.max(5, dmg);
}

function runBattle(playerBase, enemyBase, playerLevel) {
  const p = getPlayerStatsAtLevel(playerBase, playerLevel);
  resetCombatState(p, p);
  
  const e = { ...enemyBase };
  resetCombatState(e, e);

  let round = 1;
  let turn = p.spd >= e.spd ? 'player' : 'enemy';
  let isFighting = true;

  const baseSpd = p.spd;
  const enemyBaseSpd = e.spd;
  const enemyBaseAtk = e.atk;
  const enemyBaseDef = e.def;

  while (isFighting && round < 100) {
    if (turn === 'player') {
      if (p.buffs.poisoned > 0) {
        p.hp -= 15;
        if (p.hp <= 0) { isFighting = false; break; }
      }

      // Smarter Human-Like AI Strategy:
      let action = 'attack';
      
      // 1. Healing logic (only if HP < 75%)
      if (p.hp < p.maxHp * 0.75) {
        if (p.cooldowns.skill === 0 && p.id === 'red_cell') {
          action = 'skill'; // heal
        } else if (p.cooldowns.support === 0 && p.id === 'macrophage') {
          action = 'support'; // heals 15%
        } else if (p.cooldowns.support === 0 && p.id === 'nk_cell') {
          action = 'support'; // heals 25%
        } else if (p.cooldowns.support === 0 && p.id === 'platelet') {
          action = 'support'; // heals 30%
        } else if (p.cooldowns.skill === 0 && p.id === 'macrophage') {
          action = 'skill'; // lifesteal slash
        }
      }

      // 2. Cooldown usage (if not healing)
      if (action === 'attack') {
        if (p.cooldowns.skill === 0) {
          // Platelet always uses shield if off CD to absorb damage!
          // Neutrophil, T-cell, Macrophage, NK use their damage skills.
          if (p.id !== 'red_cell') {
            action = 'skill';
          }
        } else if (p.cooldowns.support === 0) {
          // RBC support calls WBC (offensive & defensive)
          // Neutrophil, T-cell, Macrophage use their supports
          // Platelet does NOT use support if health is full
          if (p.id === 'platelet') {
            // Keep attacking
          } else {
            action = 'support';
          }
        }
      }

      // Execute player action
      if (action === 'attack') {
        let dmg = 0;
        if (p.id === 'platelet') {
          dmg = 30 + p.level * 6; // Summon damage: ignores defense
        } else {
          let multiplier = 1.0;
          if (p.id === 'neutrophil' && Math.random() < 0.15) multiplier = 2.0; // crit
          if (p.buffs.atk_up > 0) multiplier *= 1.25;
          if (p.buffs.morale_boost > 0) multiplier *= 1.15;
          if (p.buffs.atk_down > 0) multiplier *= 0.8;
          dmg = calcDamage(p.atk, e.def, multiplier);
        }
        applyDamage(e, dmg);
      } 
      else if (action === 'defend') {
        p.buffs.defending = 2;
      } 
      else if (action === 'skill') {
        p.cooldowns.skill = 3;
        if (p.id === 'red_cell') {
          p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.4));
        } else if (p.id === 'neutrophil') {
          let isCrit = Math.random() < 0.45;
          let mult = isCrit ? 3.0 : 1.5;
          if (p.buffs.atk_up > 0) mult *= 1.25;
          if (p.buffs.atk_down > 0) mult *= 0.8;
          let dmg = calcDamage(p.atk, e.def, mult);
          applyDamage(e, dmg);
        } else if (p.id === 'killer_t') {
          let mult = 1.8;
          if (p.buffs.morale_boost > 0) mult *= 1.15;
          if (p.buffs.atk_down > 0) mult *= 0.8;
          let dmg = calcDamage(p.atk, Math.round(e.def * 0.5), mult);
          applyDamage(e, dmg);
        } else if (p.id === 'macrophage') {
          let dmg = calcDamage(p.atk, e.def, 1.4);
          let heal = Math.round(dmg * 0.5);
          applyDamage(e, dmg);
          p.hp = Math.min(p.maxHp, p.hp + heal);
        } else if (p.id === 'nk_cell') {
          let mult = p.hp < p.maxHp * 0.5 ? 3.2 : 2.0;
          let dmg = calcDamage(p.atk, e.def, mult);
          applyDamage(e, dmg);
        } else if (p.id === 'platelet') {
          p.shield += p.sup * 1.2; // NERFED shield: 1.2x sup
        }
      } 
      else if (action === 'support') {
        p.cooldowns.support = 4;
        if (p.id === 'red_cell') {
          // RBC support calls WBC: deals 1.5x ATK damage, and shields RBC (reduces next damage by 50%)
          let dmg = calcDamage(p.atk, e.def, 1.5);
          applyDamage(e, dmg);
          p.buffs.defending = 2; // block next hit
        } else if (p.id === 'neutrophil') {
          p.buffs.atk_up = 3;
        } else if (p.id === 'killer_t') {
          p.buffs.morale_boost = 4;
        } else if (p.id === 'macrophage') {
          p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.15));
          e.buffs.atk_down = 4;
        } else if (p.id === 'nk_cell') {
          p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.25));
          p.buffs.speed_up = 3;
          p.spd = Math.round(baseSpd * 1.2);
        } else if (p.id === 'platelet') {
          p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.3));
          p.shield += p.sup * 0.6; // NERFED support shield: 0.6x sup
        }
      }

      if (e.hp <= 0) { isFighting = false; break; }

      turn = 'enemy';
      if (p.cooldowns.skill > 0) p.cooldowns.skill--;
      if (p.cooldowns.support > 0) p.cooldowns.support--;
      decayBuffs(p, baseSpd);
    } 
    else {
      let action = 'attack';
      if (e.hp < e.maxHp * 0.4 && enemyBase.healName) {
        if (Math.random() < 0.6) action = 'heal';
      } else {
        if (Math.random() < 0.4) action = 'special';
      }

      if (action === 'attack') {
        let dmg = calcDamage(e.atk, p.def, 1.0);
        applyDamagePlayer(p, dmg);
      } 
      else if (action === 'special') {
        if (e.name === '绿脓杆菌') {
          let dmg = calcDamage(e.atk, p.def, 1.3);
          applyDamagePlayer(p, dmg);
        } else if (e.name === '肺炎链球菌') {
          let dmg = calcDamage(e.atk, p.def, 1.2);
          p.buffs.slowed = 3;
          p.spd = Math.round(baseSpd * 0.8);
          applyDamagePlayer(p, dmg);
        } else if (e.name === '金黄色葡萄球菌') {
          let dmg = calcDamage(e.atk, p.def, 1.4);
          applyDamagePlayer(p, dmg);
        } else if (e.name === '脑膜炎球菌') {
          let dmg = calcDamage(e.atk, p.def, 1.3);
          p.buffs.atk_down = 3;
          applyDamagePlayer(p, dmg);
        } else if (e.name === '幽门螺杆菌') {
          let dmg = calcDamage(e.atk, p.def, 1.6);
          applyDamagePlayer(p, dmg);
        } else if (e.name === '癌细胞') {
          let dmg = calcDamage(e.atk, p.def, 1.8);
          p.buffs.poisoned = 4;
          applyDamagePlayer(p, dmg);
        }
      } 
      else if (action === 'heal') {
        if (e.name === '肺炎链球菌') {
          e.hp = Math.min(e.maxHp, e.hp + 35);
        } else if (e.name === '金黄色葡萄球菌') {
          e.buffs.morale_boost = 3;
          e.def = Math.round(enemyBaseDef * 1.3);
        } else if (e.name === '脑膜炎球菌') {
          e.shield += 50;
          e.hp = Math.min(e.maxHp, e.hp + 20);
        } else if (e.name === '幽门螺杆菌') {
          e.shield += 70;
        } else if (e.name === '癌细胞') {
          e.hp = Math.min(e.maxHp, e.hp + 60);
          e.atk = Math.round(e.atk * 1.1);
        }
      }

      if (p.hp <= 0) { isFighting = false; break; }

      turn = 'player';
      round++;
      decayBuffsEnemy(e, enemyBaseSpd, enemyBaseAtk, enemyBaseDef);
    }
  }

  return p.hp > 0 ? 'player' : 'enemy';
}

function applyDamage(target, amount) {
  if (target.shield > 0) {
    if (target.shield >= amount) {
      target.shield -= amount;
    } else {
      let left = amount - target.shield;
      target.shield = 0;
      target.hp = Math.max(0, target.hp - left);
    }
  } else {
    target.hp = Math.max(0, target.hp - amount);
  }
}

function applyDamagePlayer(p, amount) {
  if (p.buffs.defending > 0) amount = Math.round(amount * 0.5);
  applyDamage(p, amount);
}

function decayBuffs(p, baseSpd) {
  Object.keys(p.buffs).forEach(k => {
    if (p.buffs[k] > 0) {
      p.buffs[k]--;
      if (p.buffs[k] === 0) {
        if (k === 'speed_up' || k === 'slowed') p.spd = baseSpd;
      }
    }
  });
}

function decayBuffsEnemy(e, baseSpd, baseAtk, baseDef) {
  Object.keys(e.buffs).forEach(k => {
    if (e.buffs[k] > 0) {
      e.buffs[k]--;
      if (e.buffs[k] === 0) {
        if (k === 'morale_boost') e.def = baseDef;
      }
    }
  });
}

const RUNS = 1000;
console.log(`=== STARTING REFINED SIMULATION (${RUNS} runs per stage) ===\n`);

const StagePlayerLevels = [1, 2, 2, 3, 3, 4]; // level of player at each stage

PlayerCells.forEach(cell => {
  console.log(`守护细胞: ${cell.name}`);
  console.log(`--------------------------------------------------`);
  
  EnemyBacteria.forEach((enemy, stageIdx) => {
    let pLevel = StagePlayerLevels[stageIdx];
    let playerWins = 0;
    
    for (let i = 0; i < RUNS; i++) {
      let result = runBattle(cell, enemy, pLevel);
      if (result === 'player') playerWins++;
    }
    
    let winRate = (playerWins / RUNS * 100).toFixed(1);
    console.log(`第 ${stageIdx + 1} 关 [LV.${pLevel} ${cell.name} vs ${enemy.name}]: 玩家胜率 = ${winRate}%`);
  });
  console.log(`\n`);
});
