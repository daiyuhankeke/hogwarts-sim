# 魔法系统与咒语规则

## 总体原则
- 魔法成长应**自然融入日常**：上课、练习、决斗俱乐部、图书馆自习、与赫敏/纳威等一起复习均可触发。
- 贴近**原著咒语体系**，不发明离谱魔法；高阶/禁忌咒语需对应年级或特殊剧情才能习得。
- 禁止「一回合成大师」；单次咒语熟练度提升不超过 **+10**，学科能力不超过 **+5**。
- 叙事中描写施咒时，应参考 `state.magic` 中的熟练度——初学会失败或微弱，精通则稳定有效。

## 魔法等级（由学科均值决定，前端自动计算）
| 均值 | 称号 |
|------|------|
| 0-34 | 魔法初学者 |
| 35-54 | 魔法学徒 |
| 55-69 | 合格巫师 |
| 70-84 | 优秀巫师 |
| 85+ | 杰出女巫 |

## 咒语熟练度
| 数值 | 阶段 |
|------|------|
| 0-29 | 初学 |
| 30-59 | 入门 |
| 60-79 | 熟练 |
| 80-94 | 精通 |
| 95-100 | 大师 |

## 咒语 id 参考（stateUpdate.magic 中使用 id，勿自造 id）

### 一年级
| id | 名称 | 咒语 | 学科 |
|----|------|------|------|
| lumos | 荧光闪烁 | Lumos | 魔咒 |
| nox | 熄灭如初 | Nox | 魔咒 |
| wingardium_leviosa | 漂浮咒 | Wingardium Leviosa | 魔咒 |
| alohomora | 开锁咒 | Alohomora | 魔咒 |
| vermillious | 红色火花 | Vermillious | 魔咒 |

### 二年级
| id | 名称 | 咒语 | 学科 |
|----|------|------|------|
| expelliarmus | 除你武器 | Expelliarmus | 黑魔法防御 |
| rictusempra | 痒痒咒 | Rictusempra | 魔咒 |
| tarantallegra | 锁腿咒 | Tarantallegra | 魔咒 |
| petrificus_totalus | 石化咒 | Petrificus Totalus | 黑魔法防御 |
| finite | 通用反咒 | Finite Incantatem | 魔咒 |

### 三年级
| id | 名称 | 咒语 | 学科 |
|----|------|------|------|
| riddikulus | 滑稽咒 | Riddikulus | 黑魔法防御 |
| lumos_maxima | 强光闪烁 | Lumos Maxima | 魔咒 |
| expecto_patronum | 守护神咒 | Expecto Patronum | 黑魔法防御 |

### 四年级
| id | 名称 | 咒语 | 学科 |
|----|------|------|------|
| stupefy | 昏迷咒 | Stupefy | 黑魔法防御 |
| accio | 召唤咒 | Accio | 魔咒 |
| repello | 铁甲咒 | Protego | 黑魔法防御 |
| bubble_head | 泡头咒 | Bubble-Head Charm | 魔咒 |

### 五年级
| id | 名称 | 咒语 | 学科 |
|----|------|------|------|
| silencio | 无声咒 | Silencio | 魔咒 |
| reducto | 粉碎咒 | Reducto | 黑魔法防御 |
| occlumency | 大脑封闭术 | — | 黑魔法防御 |
| levicorpus | 倒挂金钟 | Levicorpus | 魔咒 |

### 六年级
| id | 名称 | 咒语 | 学科 |
|----|------|------|------|
| confundo | 混淆咒 | Confundo | 魔咒 |
| incendio | 烈火咒 | Incendio | 魔咒 |
| aguamenti | 清水如泉 | Aguamenti | 魔咒 |

### 七年级
| id | 名称 | 咒语 | 学科 |
|----|------|------|------|
| reparo | 修复咒 | Reparo | 魔咒 |
| impedimenta | 障碍咒 | Impedimenta | 黑魔法防御 |

### 禁忌（需特殊剧情，五年级+）
| id | 名称 | 说明 |
|----|------|------|
| sectumsempra | 神锋无影 | 仅当剧情涉及混血王子笔记时可学，初始熟练度 ≤20 |

### 魔药/学识（knowledge，非咒语）
| id | 名称 | 最低年级 |
|----|------|----------|
| witchs_brew | 疥疮药水 | 1 |
| herbology_basics | 白鲜与曼德拉草 | 1 |
| polyjuice | 复方汤剂 | 2 |
| mandrake | 曼德拉草处理 | 2 |
| animagus_theory | 阿尼马格斯理论 | 3 |
| buckbeak | 鹰头马身有翼兽 | 3 |
| gillyweed | 鳃囊草 | 4 |
| felix_felicis | 福灵剂 | 6 |

## stateUpdate.magic 写法

只在**本回合有魔法相关变化**时包含 `magic` 字段：

```json
"magic": {
  "subjects": { "charms": 28, "dada": 22 },
  "spellsLearned": [{ "id": "expelliarmus", "mastery": 35 }],
  "spellsImproved": [{ "id": "wingardium_leviosa", "delta": 5 }],
  "knowledgeLearned": [{ "id": "polyjuice", "mastery": 40 }],
  "notable": ["首次成功召唤守护神"]
}
```

- `subjects`：发送**目标绝对值**（前端会限制单回合变化幅度）
- `spellsLearned`：新学会的咒语，mastery 建议 25-45
- `spellsImproved`：已有咒语练习进步，delta 建议 3-8
- `knowledgeLearned`：魔药/ Herbology 等学识条目
- `notable`：魔法里程碑（最多保留 6 条，前端合并）

## 叙事建议
- 上课选项（E）应明确科目，并在课后适当更新对应 `subjects`
- 弗立维的魔咒课、麦格的变形术、斯内普/斯拉格霍恩的魔药、黑魔法防御（奇洛/洛哈特/卢平/穆迪/乌姆里奇/斯内普）各年级不同，可据此安排可学咒语
- 决斗俱乐部、D.A. 集会、三强赛准备等是提升咒语熟练度的好机会
- 变形失败、魔药炸锅、咒语反弹是合理的「七分现实」细节，但不应过度惩罚

## 魔杖（profile.wand）
- 创建角色时已在奥利凡德选定，**不可随意更换**（除非剧情折断/替换）
- 叙事中可偶尔呼应魔杖相性（如 `affinity`、木材特性）
- 不要在 stateUpdate 中修改 wand，除非剧情事件（折断、替换）

## 守护神（magic.patronus）
- `status`: unknown | learning | glimpsed | revealed
- 三年级起可在黑魔法防御课学习；成功时设置 `form`（动物中文名，如「水獭」「牝鹿」）
- 示例：`"patronus": { "form": "猞猁", "status": "revealed", "note": "在摄魂怪前完整显现" }`

## O.W.L. 考试（magic.owls）
- 五年级期末进行；五年级时 `status: preparing`
- 成绩与 `magic.subjects` 相关：88+→O，78+→E，68+→A，52+→P，38+→D，否则 T
- **允许考试意外**：约 1-2 科发挥失常（降一级），也可有超常发挥
- 考试剧情回合示例：
```json
"owls": {
  "status": "completed",
  "results": { "charms": "E", "potions": "P", "dada": "A" },
  "accidents": 1,
  "takenYear": 5
}
```
- 六年级以上角色开局已有 O.W.L. 成绩，叙事可提及但不必每回合更新
