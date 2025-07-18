import type { GameEvent } from '../eventTypes';

export const castleEvents: GameEvent[] = 
[
  {
    "id": "castle_rumors_start",
    "type": "custom",
    "name": "神秘古堡的传闻",
    "description": "酒馆里流传着关于附近一座神秘古堡的传闻，据说那里藏有巨大的财富，但进去的人很少有能回来的...",
    "isChainStart": true,
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "attributeChange",
        "key": "intelligence",
        "value": 1
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_approach",
        "delay": 1
      }
    ],
    "probability": 1.0,
    "weight": 10
  },
  {
    "id": "castle_approach",
    "type": "custom",
    "name": "接近古堡",
    "description": "你来到了古堡外围，高大的城墙和紧闭的大门给人一种不祥的预感。你需要决定如何进入...",
    "chainId": "mystery_castle",
    "outcomes": [],
    "nextEvents": [
      {
        "eventId": "castle_force_gate",
        "delay": 1,
      },
      {
        "eventId": "castle_find_secret_path",
        "delay": 1,
      },
      {
        "eventId": "castle_sneak_in",
        "delay": 1,
      },
      {
        "eventId": "castle_give_up",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_force_gate",
    "type": "battle",
    "name": "强行破门",
    "description": "你决定用蛮力打开古堡大门。沉重的铁门发出刺耳的摩擦声，惊动了里面的守卫！",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "attributeChange",
        "key": "stamina",
        "value": -3
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_guard_battle",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_guard_battle",
    "type": "battle",
    "name": "古堡守卫",
    "description": "两个全副武装的守卫向你冲来，他们装备精良，看起来训练有素！",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "randomOutcome",
        "key": "guard_battle_result",
        "possibleOutcomes": [
          {
            "outcome": {
              "type": "attributeChange",
              "key": "strength",
              "value": 2
            },
            "weight": 3
          },
          {
            "outcome": {
              "type": "itemGain",
              "key": "guard_sword",
              "value": 1
            },
            "weight": 2
          },
          {
            "outcome": {
              "type": "attributeChange",
              "key": "stamina",
              "value": -5
            },
            "weight": 1
          }
        ]
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_main_hall",
        "delay": 1,
      },
      {
        "eventId": "castle_defeated",
        "delay": 1,
      }
    ]
  },
  {
    "id": "castle_find_secret_path",
    "type": "custom",
    "name": "寻找密道",
    "description": "你仔细观察古堡外墙，寻找可能的秘密入口。在一处藤蔓覆盖的地方，你发现了一个隐蔽的小门...",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "attributeChange",
        "key": "intelligence",
        "value": 1
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_secret_passage",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_secret_passage",
    "type": "custom",
    "name": "秘密通道",
    "description": "狭窄的通道内布满了灰尘和蜘蛛网。墙上刻着一些古老的文字，似乎是一个谜题...",
    "chainId": "mystery_castle",
    "outcomes": [],
    "nextEvents": [
      {
        "eventId": "castle_solve_riddle_success",
        "delay": 1,
      },
      {
        "eventId": "castle_solve_riddle_fail",
        "delay": 1,
      }
    ]
  },
  {
    "id": "castle_solve_riddle_success",
    "type": "custom",
    "name": "解开谜题",
    "description": "你成功解读了墙上的文字，通道尽头的石门缓缓打开，露出一个隐藏的宝箱！",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "itemGain",
        "key": "ancient_scroll",
        "value": 1
      },
      {
        "type": "attributeChange",
        "key": "intelligence",
        "value": 2
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_library",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_sneak_in",
    "type": "custom",
    "name": "潜行进入",
    "description": "你等待守卫换岗的间隙，悄无声息地翻越城墙，成功潜入了古堡内部...",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "attributeChange",
        "key": "agility",
        "value": 1
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_shadows",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_shadows",
    "type": "custom",
    "name": "阴影中的选择",
    "description": "在黑暗中，你发现两个守卫正在交谈。你可以选择暗杀他们，或者等待他们离开...",
    "chainId": "mystery_castle",
    "outcomes": [],
    "nextEvents": [
      {
        "eventId": "castle_assassinate",
        "delay": 1,
      },
      {
        "eventId": "castle_wait",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_assassinate",
    "type": "custom",
    "name": "暗杀守卫",
    "description": "你悄无声息地接近，迅速解决了两个守卫，没有发出任何声响。",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "itemGain",
        "key": "guard_key",
        "value": 1
      },
      {
        "type": "attributeChange",
        "key": "stamina",
        "value": -2
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_armory",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_main_hall",
    "type": "custom",
    "name": "古堡大厅",
    "description": "你来到了古堡的中央大厅。华丽的装饰已经破败，但仍能看出昔日的辉煌。三条走廊分别通向不同的方向...",
    "chainId": "mystery_castle",
    "outcomes": [],
    "nextEvents": [
      {
        "eventId": "castle_east_wing",
        "delay": 1
      },
      {
        "eventId": "castle_west_wing",
        "delay": 1
      },
      {
        "eventId": "castle_upstairs",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_east_wing",
    "type": "custom",
    "name": "东翼厨房",
    "description": "这里似乎是古堡的厨房。一个肥胖的厨师正在准备食物，他发现了你！",
    "chainId": "mystery_castle",
    "outcomes": [],
    "nextEvents": [
      {
        "eventId": "castle_chef_battle",
        "delay": 1
      },
      {
        "eventId": "castle_negotiate_chef",
        "delay": 1,
      }
    ]
  },
  {
    "id": "castle_west_wing",
    "type": "custom",
    "name": "西翼图书馆",
    "description": "满是灰尘的书架上摆满了古老的书籍。其中一本特别的书引起了你的注意...",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "randomOutcome",
        "key": "library_discovery",
        "possibleOutcomes": [
          {
            "outcome": {
              "type": "itemGain",
              "key": "spell_book",
              "value": 1
            },
            "weight": 3
          },
          {
            "outcome": {
              "type": "attributeChange",
              "key": "intelligence",
              "value": 3
            },
            "weight": 2
          },
          {
            "outcome": {
              "type": "attributeChange",
              "key": "stamina",
              "value": -1
            },
            "weight": 1
          }
        ]
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_library_secret",
        "delay": 1,
      },
      {
        "eventId": "castle_return_hall",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_upstairs",
    "type": "custom",
    "name": "主人卧室",
    "description": "豪华的卧室中央放着一个华丽的棺材。当你靠近时，棺材盖突然打开！",
    "chainId": "mystery_castle",
    "outcomes": [],
    "nextEvents": [
      {
        "eventId": "castle_vampire_battle",
        "delay": 1
      },
      {
        "eventId": "castle_vampire_negotiate",
        "delay": 1,
      }
    ]
  },
  {
    "id": "castle_vampire_battle",
    "type": "battle",
    "name": "吸血鬼领主",
    "description": "一个面色苍白的贵族从棺材中站起，露出尖锐的獠牙！",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "randomOutcome",
        "key": "vampire_battle_result",
        "possibleOutcomes": [
          {
            "outcome": {
              "type": "itemGain",
              "key": "vampire_ring",
              "value": 1
            },
            "weight": 2
          },
          {
            "outcome": {
              "type": "attributeChange",
              "key": "stamina",
              "value": -10
            },
            "weight": 1
          }
        ]
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_treasure_room",
        "delay": 1,
      },
      {
        "eventId": "castle_defeated",
        "delay": 1,
      }
    ]
  },
  {
    "id": "castle_treasure_room",
    "type": "findItem",
    "name": "宝藏室",
    "description": "你发现了古堡的宝藏室！金光闪闪的财宝堆满了整个房间。",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "randomOutcome",
        "key": "gold",
        "value": 500,
        "random": {
          "type": "range",
          "min": 200,
          "max": 1000
        }
      },
      {
        "type": "randomOutcome",
        "key": "special_treasure",
        "possibleOutcomes": [
          {
            "outcome": {
              "type": "itemGain",
              "key": "crystal_sword",
              "value": 1
            },
            "weight": 3
          },
          {
            "outcome": {
              "type": "itemGain",
              "key": "ancient_amulet",
              "value": 1
            },
            "weight": 2
          },
          {
            "outcome": {
              "type": "attributeChange",
              "key": "all",
              "value": 5
            },
            "weight": 1
          }
        ]
      }
    ],
    "isChainEnd": true
  },
  {
    "id": "castle_defeated",
    "type": "custom",
    "name": "探险失败",
    "description": "你被古堡的守卫发现并击败，被扔出了古堡。至少你还活着...",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "itemLoss",
        "key": "gold",
        "value": 100
      },
      {
        "type": "attributeChange",
        "key": "stamina",
        "value": 1
      }
    ],
    "isChainEnd": true
  },
  {
    "id": "castle_give_up",
    "type": "custom",
    "name": "放弃探险",
    "description": "古堡的阴森气氛让你感到不安，你决定放弃这次冒险。",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "attributeChange",
        "key": "stamina",
        "value": 2
      }
    ],
    "isChainEnd": true
  },
  {
    "id": "castle_library_secret",
    "type": "custom",
    "name": "隐藏的秘密",
    "description": "你发现了一本隐藏的日记，记载着古堡主人的秘密。原来他是一位被诅咒的学者...",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "itemGain",
        "key": "scholar_diary",
        "value": 1
      },
      {
        "type": "attributeChange",
        "key": "intelligence",
        "value": 5
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_treasure_room",
        "delay": 1
      }
    ]
  },
  {
    "id": "castle_vampire_negotiate",
    "type": "custom",
    "name": "与吸血鬼谈判",
    "description": "你用渊博的知识打动了吸血鬼领主，他同意让你带走部分财宝作为不打扰他休息的回报。",
    "chainId": "mystery_castle",
    "outcomes": [
      {
        "type": "itemGain",
        "key": "gold",
        "value": 300
      },
      {
        "type": "attributeChange",
        "key": "intelligence",
        "value": 3
      }
    ],
    "nextEvents": [
      {
        "eventId": "castle_treasure_room",
        "delay": 1
      }
    ]
  }
]