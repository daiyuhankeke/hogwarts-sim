# 进度与社交系统规则

## 学院分（progression.housePoints / housePenalties）
- 正面：帮助同学 +5~10、公开维护学院 +10、赢得魁地奇 +15、优秀课堂表现 +5
- 负面：宵禁外出 -5~-10、破坏校规 -5~-15、关禁闭记 housePenalties +1
- 在 `stateUpdate.progression` 中更新：`{ "housePoints": 5 }` 或 `{ "housePenalties": 1 }`
- 叙事中应偶尔提及学院分（「格兰芬多加了十分」）

## 关系里程碑与回忆
- 好感跨越 21/41/61/76/91 时系统会自动记录里程碑；DM 应在 narrative 中写**标志性场景**
- 可主动添加回忆：`progression.memoriesAdded: [{ "title": "...", "text": "...", "target": "哈利" }]`
- 里程碑场景示例：41 第一次单独聊天、61 误会与和解、76 确认关系

## 舆论（progression.gossip）
- level 0-3：安静 → 有点议论 → 议论纷纷 → 全校话题
- 麻瓜出身 + 德拉科线、多人暧昧、公开亲密会提升流言
- 更新：`progression.gossip: { "level": 2, "rumors": ["有人说你在和级长约会"] }`
- 流言应影响 NPC 反应但**不可 BE**

## 社团（progression.clubs）
- **创建角色时不预选社团**；开局 `progression.clubs` 为空
- 玩家最多同时加入 **3 个**社团；须在剧情中通过报名/选拔/邀请加入
- 加入时更新：`progression.clubsJoined: ["quidditch"]`（可一次多个 id，勿超过上限）
- 参考 `eventContext.clubAvailability`：
  - **D.A.**（`da`）：**五年级起**才可加入（乌姆里奇掌权、哈利与赫敏组建之后）
  - **魁地奇校队**（`quidditch`）：每年开学前后选拔，赛季中有训练与比赛
  - **决斗俱乐部**（`dueling`）：二年级洛哈特曾办；之后可有自发练习小组
  - **斯拉格霍恩俱乐部**（`slug`）：**六年级**斯拉格霍恩返校后
  - **图书馆研究组 / 神奇生物兴趣组 / 戈布石 / 魔咒创新社**：见 `canJoin` 列表，须符合 minYear
- 未到年级或原著事件未发生时，**不可**提前让玩家加入（见 `notYetAvailable`）
- 已加入社团后，每 3-5 回合应出现至少一次相关选项或活动；未加入时可在合适时机提供**报名/选拔**选项
- 社团 id：`da` | `quidditch` | `dueling` | `slug` | `library` | `creature` | `gobstones` | `charms`

## 大事件准备期（eventContext.eventPrep）
- 霍格莫德 / 圣诞舞会 / 三强赛 / O.W.L. 考前 2-4 周进入准备期
- 选项应包含准备步骤（邀舞伴、复习、采购、打听情报）
- 完成步骤可更新：`progression.eventPrep: { "completed": ["物色舞伴"] }`

## O.W.L. 考试周（五年级第 30-34 周）
- `progression.exams.active: true` 时叙事聚焦考试压力
- 复习提升 magic.subjects；熬夜升高 exams.stress
- 考后写入 `magic.owls.results`，允许 1-2 科发挥失常

## 守护神仪式（progression.patronusCeremony）
- 三年级+可修习；progress 达 100 或 narrative 成功召唤时 `patronusCeremony.revealed: true`
- 同时更新 `magic.patronus: { "form": "水獭", "status": "revealed" }`
- 揭晓应有**独立长场景**（博格特/摄魂怪/练习）

## 魔杖相性（eventContext.wandAffinity）
- 偶尔在施咒、魔药、变形剧情中呼应玩家魔杖（木材/杖芯）
- 例：黑胡桃木在变形课上更稳、龙心弦魔咒威力大但易走火

## 多周目主线（eventContext.playthroughHook）
- 1 年级：入学与分院；4 年级：三强赛与舞会；5 年级：O.W.L. 与 D.A.；7 年级：N.E.W.T.
- 开局 3 回合内应点题本局 hook

## DM 进度驱动（必遵）
- **每 5 回合**至少推进一项：学业 / 感情 / 学院分 / 魔法 / 社团 / 大事件准备
- 禁止连续 3 回合纯闲聊无进展
- 参考 eventContext.npcSchedule：玩家去对应地点应提高遇见概率

## stateUpdate 示例
```json
"progression": {
  "housePoints": 5,
  "clubsJoined": ["quidditch"],
  "memoriesAdded": [{ "title": "第一次变形", "text": "餐巾纸只变成纸团，但佩内洛耐心指导", "target": null }],
  "gossip": { "rumors": ["拉文克劳有人在议论你和某格兰芬多"] },
  "patronusProgress": 8,
  "clubActivity": true
}
```
