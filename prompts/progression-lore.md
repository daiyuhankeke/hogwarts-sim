# 进度与社交

## 学院分
帮助同学 +5~10、维护学院 +10、魁地奇胜 +15、课堂优秀 +5；宵禁 -5~-10、违纪 -5~-15。
`progression: { "housePoints": 5 }` 或 `{ "housePenalties": 1 }`

## 社团（开局为空，剧情中加入，最多3个）
| id | 名称 | 最早年级 |
|----|------|----------|
| da | D.A. | 5 |
| quidditch | 魁地奇校队 | 1 |
| dueling | 决斗俱乐部 | 2 |
| slug | 斯拉格霍恩俱乐部 | 6 |
| library | 图书馆研究组 | 1 |
| creature | 神奇生物兴趣组 | 1 |
| gobstones | 戈布石 | 1 |
| charms | 魔咒创新社 | 2 |

加入：`progression.clubsJoined: ["quidditch"]`；须符合 `eventContext.clubAvailability`。

## 舆论
`progression.gossip: { "level": 0–3, "rumors": ["…"] }`；勿写成恋爱八卦主线。

## 大事件准备
霍格莫德/舞会/三强赛/O.W.L. 考前 2–4 周：`eventContext.eventPrep` 活跃时选项含准备步骤。

## 其他
- O.W.L. 周（5年级30–34周）：`progression.exams.active`
- 守护神：`progression.patronusCeremony` + `magic.patronus`
- 回忆：`progression.memoriesAdded: [{ "title", "text", "target" }]`
