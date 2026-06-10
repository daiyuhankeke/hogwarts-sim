# 魔法系统

## 原则
- 成长融入上课/练习/决斗/D.A./自习；贴近原著咒语，不发明离谱魔法。
- 单次：咒语熟练度 **+≤10**，学科 **+≤5**；描写须匹配当前熟练度。
- 练习/上课场景**应**写 `stateUpdate.magic`（前端也会推断，DM 仍须主动写）。

## 等级
- 称号（学科均值）：0–34 初学者 | 35–54 学徒 | 55–69 合格 | 70–84 优秀 | 85+ 杰出
- 咒语熟练度：0–29 初学 | 30–59 入门 | 60–79 熟练 | 80–94 精通 | 95+ 大师

## 咒语 id（勿自造）
- **1**：lumos, nox, wingardium_leviosa, alohomora, vermillious
- **2**：expelliarmus, rictusempra, tarantallegra, petrificus_totalus, finite
- **3**：riddikulus, lumos_maxima, expecto_patronum
- **4**：stupefy, accio, repello, bubble_head
- **5**：silencio, reducto, occlumency, levicorpus
- **6**：confundo, incendio, aguamenti
- **7**：reparo, impedimenta
- **禁忌**（5年级+剧情）：sectumsempra（混血王子笔记，初始≤20）

## 学识 id（knowledge）
witchs_brew, herbology_basics, polyjuice, mandrake, animagus_theory, buckbeak, gillyweed, felix_felicis

## stateUpdate.magic 写法
```json
"magic": {
  "subjects": { "charms": 28 },
  "spellsLearned": [{ "id": "expelliarmus", "mastery": 35 }],
  "spellsImproved": [{ "id": "wingardium_leviosa", "delta": 5 }],
  "knowledgeLearned": [{ "id": "polyjuice", "mastery": 40 }],
  "notable": ["首次完整守护神"],
  "patronus": { "form": "水獭", "status": "revealed" },
  "owls": { "status": "completed", "results": { "charms": "E", "potions": "P" } }
}
```
- `subjects` 发**目标绝对值**；新咒语 mastery 建议 25–45；delta 建议 3–8

## O.W.L.（五年级）
- 88+→O，78+→E，68+→A，52+→P，38+→D，否则 T；允许 1–2 科失常

## 魔杖 / 守护神
- `profile.wand` 不可随意改（折断/替换剧情除外）
- 守护神：3年级起可学；`patronus.status`: unknown | learning | glimpsed | revealed
