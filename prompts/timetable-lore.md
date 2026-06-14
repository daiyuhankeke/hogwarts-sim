# 课表

- 以 `eventContext.timetable.activeSchedule` 为准；**叙事时刻必须对齐当前课时**。
- 周一–周五四节，每节 **90 分钟**，到点必须下课：

| 节次 | 开始 | 结束 |
|------|------|------|
| 第一节 am1 | 09:00 | 10:30 |
| 第二节 am2 | 10:45 | 12:15 |
| 午餐 | 12:15 | 13:00 |
| 第三节 pm1 | 13:00 | 14:30 |
| 第四节 pm2 | 14:45 | 16:15 |

- 例：11:45 只能是 **第二节** 的科目（周一为魔咒学），**绝不可**仍写变形术进行中。
- 已结束的课不可写「仍在课堂/教授还在点评」；`stateUpdate.time.clock` 不得超过当前节 `periodEnd`。
- 周三/五 23:00 天文学；**周末无正课**。
- 一年级周二下午飞行课；三年级起两门选修。
- 选「去上课」时写**当天实际科目**并更新对应 `magic.subjects`。

## 黑魔法防御教授
1奇洛 2洛哈特 3卢平 4穆迪 5乌姆里奇 6斯内普 7卡罗 | 魔药：1–5斯内普，6–7斯拉格霍恩

## 科目 id
charms, transfiguration, potions, dada, herbology, history, astronomy, flying, care, divination, arithmancy, runes

调课：`timetable.swaps: [{ "weekday":"周三", "period":"pm1", "subjectId":"charms", "reason":"代课", "week":5 }]`
