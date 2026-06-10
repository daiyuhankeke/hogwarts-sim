# 课表

- 以 `eventContext.timetable.todayClasses` 为准；周一–周五四节（09:00/10:45/13:00/14:45），周三五 23:00 天文学；**周末无正课**。
- 一年级周二下午飞行课；三年级起两门选修。
- 选「去上课」时写**当天实际科目**并更新对应 `magic.subjects`。

## 黑魔法防御教授
1奇洛 2洛哈特 3卢平 4穆迪 5乌姆里奇 6斯内普 7卡罗 | 魔药：1–5斯内普，6–7斯拉格霍恩

## 科目 id
charms, transfiguration, potions, dada, herbology, history, astronomy, flying, care, divination, arithmancy, runes

调课：`timetable.swaps: [{ "weekday":"周三", "period":"pm1", "subjectId":"charms", "reason":"代课", "week":5 }]`
