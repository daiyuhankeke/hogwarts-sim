# 课表系统规则

## 原则
- 游戏状态含 `timetable` 字段，按玩家年级自动生成，**教授与原著时间线对齐**（如一年级奇洛、三年级卢平、五年级乌姆里奇、六年级魔药换斯拉格霍恩）。
- 工作日为**周一至周五**；**周六、周日无固定课时**（周六三年级以上可霍格莫德）。
- 每日四节课：09:00 / 10:45 / 13:00 / 14:45；**周三、周五 23:00 天文学**（晚间）。
- 一年级周二下午为**飞行课**；三年级起有**两门选修**（神奇生物、占卜等，见 state.timetable.electives）。

## 叙事要求
- 工作日白天剧情若涉及上课，应优先参照 `eventContext.timetable.todayClasses` 或 state.timetable。
- 玩家选「去上课（E）」时，描写**当天实际课程**之一，并更新对应 `magic.subjects`。
- 周末不应安排强制正课；可写社团、自习、霍格莫德、魁地奇训练。
- 调课/停课可用 `stateUpdate.timetable.swaps`：
```json
"timetable": {
  "swaps": [{ "weekday": "周三", "period": "pm1", "subjectId": "charms", "reason": "斯内普代课", "week": 5 }]
}
```

## 教授对照（黑魔法防御）
| 年级 | 教授 |
|------|------|
| 1 | 奇洛 |
| 2 | 洛哈特 |
| 3 | 卢平 |
| 4 | 穆迪 |
| 5 | 乌姆里奇 |
| 6 | 斯内普 |
| 7 | 卡罗 |

魔药学：1-5 年级斯内普，6-7 年级斯拉格霍恩。

## 科目 id（swaps 用）
charms, transfiguration, potions, dada, herbology, history, astronomy, flying, care, divination, arithmancy, runes
