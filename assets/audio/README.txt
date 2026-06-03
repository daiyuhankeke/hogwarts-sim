环境音文件（可选）

将 mp3 放入此目录，文件名须与下表一致，游戏会根据场景 location 自动切换。
无文件时静默运行，不影响玩法。点击工具栏「环境音」按钮开关。

┌─────────────────┬──────────────────────┬─────────────────────────────┐
│ 文件名          │ 触发场景             │ 听感参考                    │
├─────────────────┼──────────────────────┼─────────────────────────────┤
│ great-hall.mp3  │ 大礼堂 / 宴会        │ 大厅混响、低语、杯盘轻响    │
│ common-room.mp3 │ 公共休息室           │ 壁炉噼啪、室内温暖          │
│ library.mp3     │ 图书馆               │ 安静、翻页、偶尔脚步        │
│ dungeon.mp3     │ 地牢 / 魔药课        │ 滴水、低频、阴冷回声        │
│ castle.mp3      │ 城堡走廊 / 教室      │ 石质空间、远处脚步          │
│ hogsmeade.mp3   │ 霍格莫德             │ 小镇街景、人声、风声        │
│ quidditch.mp3   │ 魁地奇球场           │ 户外风声、开阔草地          │
│ outdoor.mp3     │ 禁林 / 黑湖 / 场地   │ 自然户外、鸟鸣（可选）      │
│ train.mp3       │ 霍格沃茨特快 / 站台  │ 火车节奏、轨道、蒸汽        │
└─────────────────┴──────────────────────┴─────────────────────────────┘

建议：单文件 30 秒～3 分钟、可无缝循环；音量适中（游戏内默认 25%）。

═══════════════════════════════════════════════════════════════
推荐免费素材（CC0 / 公有领域，可商用，下载后重命名为上表文件名）
═══════════════════════════════════════════════════════════════

【common-room.mp3】公共休息室 · 壁炉
  BigSoundBank CC0 · Fireplace #1（约 1 分钟，可循环）
  https://bigsoundbank.com/fireplace-1-s0030.html
  Freesound CC0 · Fireplace Burning（42 秒）
  https://freesound.org/people/AugustSandberg/sounds/508844/

【great-hall.mp3】大礼堂 · 大厅氛围
  BigSoundBank CC0 · Chambord Castle #3（城堡拱顶室内，约 3 分钟）
  https://bigsoundbank.com/chambord-castle-france-3-s3433.html
  （若链接失效，在 BigSoundBank 搜 "castle hall ambience" 或 "Chambord"）
  Pixabay 搜：medieval hall ambience / banquet hall crowd murmur

【library.mp3】图书馆 · 安静室内
  Freesound 搜：library ambience quiet page turn
  https://freesound.org/search/?q=library+ambience&f=license:%22Creative+Commons+0%22
  Pixabay 搜：library ambient quiet study

【dungeon.mp3】地牢 · 魔药课
  OpenGameArt · Loopable Dungeon Ambience（OGG，需转 MP3）
  https://opengameart.org/content/loopable-dungeon-ambience
  Freesound CC0 搜：dungeon drip cave ambient loop

【castle.mp3】城堡走廊
  BigSoundBank CC0 · Chambord Castle #1 / #2（石质走廊脚步感）
  https://bigsoundbank.com/chambord-castle-france-1-s3431.html
  Freesound 搜：stone corridor footsteps reverb CC0

【hogsmeade.mp3】霍格莫德 · 小镇
  Freesound · Medieval City SAMPLE（街市人声，28 秒样本，可循环）
  https://freesound.org/people/OGsoundFX/sounds/423119/
  Pixabay 搜：village street ambience winter / small town crowd

【quidditch.mp3】魁地奇 · 户外风
  Pixabay 搜：wind grass field open air loop
  https://pixabay.com/sound-effects/search/field%20wind/
  Freesound CC0 搜：meadow wind open field

【outdoor.mp3】城堡场地 / 禁林边缘
  Pixabay 搜：forest birds nature ambient loop
  https://pixabay.com/sound-effects/search/forest%20ambient/
  可与 quidditch.mp3 使用同一文件（复制一份即可）

【train.mp3】霍格沃茨特快
  Freesound CC0 搜：train interior rhythm loop
  https://freesound.org/search/?q=train+interior+loop&f=license:%22Creative+Commons+0%22
  Pixabay 搜：train moving railway steam

═══════════════════════════════════════════════════════════════
批量包（一次下齐多种 fantasy 环境音，再自行挑选重命名）
═══════════════════════════════════════════════════════════════
  Fantasy Ambient SFX Pack (CC0) · 2GB 免费包
  https://kmontesdev.itch.io/fantasy-ambient-sound-effects-pack-cc0

  Pixabay 音效库（免费可商用，需注册）
  https://pixabay.com/sound-effects/

  Freesound（筛选 CC0 许可证）
  https://freesound.org/search/?f=license:%22Creative+Commons+0%22

═══════════════════════════════════════════════════════════════
格式转换（若下载到的是 wav / ogg）
═══════════════════════════════════════════════════════════════
  使用 ffmpeg 转为 mp3（在项目根目录执行）：

  ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 4 great-hall.mp3

  批量：把 wav 放入 assets/audio/raw/ 后：
  for %f in (raw\*.wav) do ffmpeg -i "%f" -codec:a libmp3lame -qscale:a 4 "%~nf.mp3"

下载完成后重启或刷新页面，进入对应场景并开启「环境音」即可试听。
