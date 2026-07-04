var TextIdleCombat = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // frontend/src/game/serverCombatCycle.js
  var serverCombatCycle_exports = {};
  __export(serverCombatCycle_exports, {
    mergeCombatStateIntoSquad: () => mergeCombatStateIntoSquad,
    runServerCombatCycle: () => runServerCombatCycle,
    runServerCombatCycleFromJSON: () => runServerCombatCycleFromJSON
  });

  // frontend/src/data/itemBases.js
  var BASE_ITEMS = {
    Helm: {
      normal: [
        { name: "\u4FBF\u5E3D", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [2, 3], physAtk: 0, spellPower: 0 },
        { name: "\u9AB7\u9AC5\u5E3D", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
        { name: "\u5934\u76D4", levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
        { name: "\u5168\u76D4", levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [4, 7], physAtk: 0, spellPower: 0 },
        { name: "\u5DE8\u76D4", levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
        { name: "\u738B\u51A0", levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [7, 11], physAtk: 0, spellPower: 0 }
      ],
      exceptional: [
        { name: "\u6218\u5E3D", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [8, 13], physAtk: 0, spellPower: 0 },
        { name: "\u8F7B\u76D4", levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [10, 16], physAtk: 0, spellPower: 0 },
        { name: "\u62A4\u9762\u76D4", levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [13, 20], physAtk: 0, spellPower: 0 },
        { name: "\u8F7B\u94A2\u76D4", levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [16, 25], physAtk: 0, spellPower: 0 },
        { name: "\u7FFC\u76D4", levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [20, 31], physAtk: 0, spellPower: 0 },
        { name: "\u5927\u7687\u51A0", levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [25, 39], physAtk: 0, spellPower: 0 }
      ],
      elite: [
        { name: "\u519B\u5E3D", levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [16, 26], physAtk: 0, spellPower: 0 },
        { name: "\u4E5D\u5934\u86C7\u76D4", levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [20, 32], physAtk: 0, spellPower: 0 },
        { name: "\u62A4\u76D4", levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [26, 40], physAtk: 0, spellPower: 0 },
        { name: "\u5DE8\u8D1D\u76D4", levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [32, 50], physAtk: 0, spellPower: 0 },
        { name: "\u5C16\u76D4", levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [40, 62], physAtk: 0, spellPower: 0 },
        { name: "\u5B9D\u51A0", levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [50, 78], physAtk: 0, spellPower: 0 }
      ]
    },
    Armor: {
      normal: [
        { name: "\u5E03\u7532", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
        { name: "\u76AE\u7532", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
        { name: "\u786C\u76AE\u7532", levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
        { name: "\u9489\u76AE\u7532", levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [7, 11], physAtk: 0, spellPower: 0 },
        { name: "\u9501\u5B50\u7532", levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [9, 14], physAtk: 0, spellPower: 0 },
        { name: "\u80F8\u7532", levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [12, 18], physAtk: 0, spellPower: 0 }
      ],
      exceptional: [
        { name: "\u9B3C\u9B42\u7532", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [14, 22], physAtk: 0, spellPower: 0 },
        { name: "\u86C7\u76AE\u7532", levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [17, 26], physAtk: 0, spellPower: 0 },
        { name: "\u9B54\u76AE\u7532", levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [22, 34], physAtk: 0, spellPower: 0 },
        { name: "\u683C\u6805\u7532", levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [27, 42], physAtk: 0, spellPower: 0 },
        { name: "\u73AF\u7532", levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [34, 52], physAtk: 0, spellPower: 0 },
        { name: "\u62A4\u80F8", levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [42, 65], physAtk: 0, spellPower: 0 }
      ],
      elite: [
        { name: "\u66AE\u5149\u7532", levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [28, 44], physAtk: 0, spellPower: 0 },
        { name: "\u9F99\u76AE\u7532", levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [34, 52], physAtk: 0, spellPower: 0 },
        { name: "\u5723\u7532\u866B\u58F3", levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [44, 68], physAtk: 0, spellPower: 0 },
        { name: "\u7EBF\u6BDB\u7532", levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [54, 84], physAtk: 0, spellPower: 0 },
        { name: "\u94BB\u77F3\u7532", levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [68, 104], physAtk: 0, spellPower: 0 },
        { name: "\u6267\u653F\u5B98\u7532", levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [84, 130], physAtk: 0, spellPower: 0 }
      ]
    },
    Gloves: {
      normal: [
        { name: "\u76AE\u624B\u5957", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [2, 3], physAtk: 0, spellPower: 0 },
        { name: "\u91CD\u624B\u5957", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
        { name: "\u94FE\u7532\u624B\u5957", levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
        { name: "\u8F7B\u62A4\u624B", levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [4, 6], physAtk: 0, spellPower: 0 },
        { name: "\u62A4\u624B", levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
        { name: "\u677F\u7532\u62A4\u624B", levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 10], physAtk: 0, spellPower: 0 }
      ],
      exceptional: [
        { name: "\u9B54\u76AE\u624B\u5957", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 9], physAtk: 0, spellPower: 0 },
        { name: "\u9CA8\u76AE\u624B\u5957", levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [7, 10], physAtk: 0, spellPower: 0 },
        { name: "\u91CD\u62A4\u8155", levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [9, 14], physAtk: 0, spellPower: 0 },
        { name: "\u6218\u62A4\u624B", levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [11, 17], physAtk: 0, spellPower: 0 },
        { name: "\u6218\u4E89\u62A4\u624B", levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [14, 21], physAtk: 0, spellPower: 0 },
        { name: "\u94A2\u62A4\u624B", levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [17, 26], physAtk: 0, spellPower: 0 }
      ],
      elite: [
        { name: "\u8346\u68D8\u62A4\u624B", levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [12, 18], physAtk: 0, spellPower: 0 },
        { name: "\u5438\u8840\u9B3C\u9AA8\u624B\u5957", levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [14, 20], physAtk: 0, spellPower: 0 },
        { name: "\u81C2\u7532", levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [18, 28], physAtk: 0, spellPower: 0 },
        { name: "\u5341\u5B57\u519B\u62A4\u624B", levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [22, 34], physAtk: 0, spellPower: 0 },
        { name: "\u98DF\u4EBA\u9B54\u62A4\u624B", levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [28, 42], physAtk: 0, spellPower: 0 },
        { name: "\u6CF0\u5766\u62A4\u624B", levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [34, 52], physAtk: 0, spellPower: 0 }
      ]
    },
    Boots: {
      normal: [
        { name: "\u9774\u5B50", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [2, 3], physAtk: 0, spellPower: 0 },
        { name: "\u91CD\u9774", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
        { name: "\u94FE\u7532\u9774", levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 6], physAtk: 0, spellPower: 0 },
        { name: "\u8F7B\u677F\u9774", levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [4, 8], physAtk: 0, spellPower: 0 },
        { name: "\u62A4\u80EB", levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 10], physAtk: 0, spellPower: 0 },
        { name: "\u94A2\u62A4\u80EB", levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 12], physAtk: 0, spellPower: 0 }
      ],
      exceptional: [
        { name: "\u9B54\u76AE\u9774", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 10], physAtk: 0, spellPower: 0 },
        { name: "\u9CA8\u76AE\u9774", levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [8, 12], physAtk: 0, spellPower: 0 },
        { name: "\u7F51\u9774", levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [10, 15], physAtk: 0, spellPower: 0 },
        { name: "\u6218\u9774", levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [12, 19], physAtk: 0, spellPower: 0 },
        { name: "\u6218\u4E89\u4E4B\u9774", levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [15, 23], physAtk: 0, spellPower: 0 },
        { name: "\u5341\u5B57\u519B\u9774", levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [19, 29], physAtk: 0, spellPower: 0 }
      ],
      elite: [
        { name: "\u9F99\u76AE\u9774", levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [12, 20], physAtk: 0, spellPower: 0 },
        { name: "\u5723\u7532\u866B\u58F3\u9774", levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [16, 24], physAtk: 0, spellPower: 0 },
        { name: "\u9AA8\u7EC7\u9774", levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [20, 30], physAtk: 0, spellPower: 0 },
        { name: "\u955C\u9762\u9774", levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [24, 38], physAtk: 0, spellPower: 0 },
        { name: "\u52C7\u58EB\u62A4\u80EB", levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [30, 46], physAtk: 0, spellPower: 0 },
        { name: "\u6CF0\u5766\u62A4\u80EB", levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [38, 58], physAtk: 0, spellPower: 0 }
      ]
    },
    Belt: {
      normal: [
        { name: "\u9970\u5E26", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [2, 2], physAtk: 0, spellPower: 0 },
        { name: "\u8F7B\u8170\u5E26", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 4], physAtk: 0, spellPower: 0 },
        { name: "\u8170\u5E26", levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
        { name: "\u91CD\u8170\u5E26", levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 6], physAtk: 0, spellPower: 0 },
        { name: "\u677F\u7532\u8170\u5E26", levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [4, 8], physAtk: 0, spellPower: 0 },
        { name: "\u94FE\u7532\u8170\u5E26", levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 10], physAtk: 0, spellPower: 0 }
      ],
      exceptional: [
        { name: "\u9B54\u76AE\u9970\u5E26", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
        { name: "\u9CA8\u76AE\u8170\u5E26", levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 9], physAtk: 0, spellPower: 0 },
        { name: "\u7F51\u8170\u5E26", levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [8, 12], physAtk: 0, spellPower: 0 },
        { name: "\u6218\u8170\u5E26", levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [9, 14], physAtk: 0, spellPower: 0 },
        { name: "\u6218\u4E89\u8170\u5E26", levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [12, 18], physAtk: 0, spellPower: 0 },
        { name: "\u73AF\u6263\u8170\u5E26", levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [15, 23], physAtk: 0, spellPower: 0 }
      ],
      elite: [
        { name: "\u86DB\u7F51\u9970\u5E26", levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [10, 16], physAtk: 0, spellPower: 0 },
        { name: "\u5438\u8840\u9B3C\u7259\u8170\u5E26", levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [12, 18], physAtk: 0, spellPower: 0 },
        { name: "\u79D8\u94F6\u8170\u5E26", levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [16, 24], physAtk: 0, spellPower: 0 },
        { name: "\u5DE8\u9B54\u8170\u5E26", levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [18, 28], physAtk: 0, spellPower: 0 },
        { name: "\u5DE8\u795E\u8170\u5E26", levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [24, 36], physAtk: 0, spellPower: 0 },
        { name: "\u6CF0\u5766\u8170\u5E26", levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [30, 46], physAtk: 0, spellPower: 0 }
      ]
    },
    MainHand: {
      normal: [
        { name: "\u5315\u9996", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [1, 5], spellPower: 0 },
        { name: "\u77ED\u5251", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [2, 7], spellPower: 0 },
        { name: "\u77ED\u5200", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: 0 },
        { name: "\u5F2F\u5200", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [3, 8], spellPower: 0 }
      ],
      exceptional: [
        { name: "\u523A\u5251", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [5, 18], spellPower: 0 },
        { name: "\u5706\u5203\u5315\u9996", levelReq: 24, str: 0, agi: 8, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [7, 21], spellPower: 0 },
        { name: "\u624B\u5251", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [7, 22], spellPower: 0 },
        { name: "\u5F2F\u5203\u5200", levelReq: 24, str: 10, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [10, 26], spellPower: 0 }
      ],
      elite: [
        { name: "\u9AA8\u5200", levelReq: 41, str: 0, agi: 12, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [17, 45], spellPower: 0 },
        { name: "\u79D8\u94F6\u5C16\u523A", levelReq: 44, str: 0, agi: 26, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [23, 54], spellPower: 0 },
        { name: "\u571F\u8033\u5176\u5F2F\u5200", levelReq: 41, str: 14, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [23, 54], spellPower: 0 },
        { name: "\u5E7B\u5316\u4E4B\u5203", levelReq: 44, str: 30, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [31, 67], spellPower: 0 }
      ]
    },
    Shield: {
      normal: [
        { name: "\u5706\u76FE", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: [1, 2], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [4, 6] },
        { name: "\u5C0F\u76FE", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: [2, 4], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [5, 8] },
        { name: "\u5927\u76FE", levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armor: [3, 5], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [6, 9] },
        { name: "\u9E22\u76FE", levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armor: [4, 6], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [7, 10] },
        { name: "\u5854\u76FE", levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armor: [5, 8], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [8, 11] },
        { name: "\u54E5\u7279\u76FE", levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armor: [7, 10], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [9, 13] }
      ],
      exceptional: [
        { name: "\u9632\u5FA1\u8005", levelReq: 21, str: 5, agi: 0, int: 0, spi: 0, armor: [9, 14], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [10, 15] },
        { name: "\u5706\u76FE", levelReq: 24, str: 12, agi: 0, int: 0, spi: 0, armor: [11, 17], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [11, 17] },
        { name: "\u7F57\u9A6C\u76FE", levelReq: 28, str: 22, agi: 0, int: 0, spi: 0, armor: [14, 22], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [12, 19] },
        { name: "\u9F99\u76FE", levelReq: 32, str: 34, agi: 0, int: 0, spi: 0, armor: [18, 28], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [13, 20] },
        { name: "\u5927\u76FE", levelReq: 36, str: 50, agi: 0, int: 0, spi: 0, armor: [22, 34], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [14, 22] },
        { name: "\u53E4\u76FE", levelReq: 40, str: 68, agi: 0, int: 0, spi: 0, armor: [28, 42], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [15, 24] }
      ],
      elite: [
        { name: "\u6247\u5F62\u76FE", levelReq: 41, str: 14, agi: 0, int: 0, spi: 0, armor: [26, 40], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [15, 23] },
        { name: "\u6708\u795E\u76FE", levelReq: 44, str: 26, agi: 0, int: 0, spi: 0, armor: [32, 50], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [17, 26] },
        { name: "\u4EA5\u4F2F\u9F99\u76FE", levelReq: 48, str: 42, agi: 0, int: 0, spi: 0, armor: [40, 62], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [19, 29] },
        { name: "\u541B\u4E3B\u76FE", levelReq: 52, str: 60, agi: 0, int: 0, spi: 0, armor: [50, 78], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [21, 32] },
        { name: "\u795E\u76FE", levelReq: 56, str: 82, agi: 0, int: 0, spi: 0, armor: [62, 96], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [23, 35] },
        { name: "\u5B88\u62A4\u76FE", levelReq: 60, str: 106, agi: 0, int: 0, spi: 0, armor: [78, 120], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [25, 38] }
      ]
    },
    OffHand: {
      normal: [
        { name: "\u9E70\u4E4B\u6CD5\u7403", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [1, 2], spellCrit: [1, 2] },
        { name: "\u795E\u5723\u4E4B\u7403", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 4], spellCrit: [2, 4] },
        { name: "\u70DF\u7403", levelReq: 8, str: 0, agi: 0, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 3], spellCrit: [2, 3] },
        { name: "\u6263\u73AF\u4E4B\u7403", levelReq: 12, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 4], spellCrit: [2, 4] },
        { name: "\u6770\u745E\u5FB7\u4E4B\u77F3", levelReq: 16, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [3, 5], spellCrit: [3, 5] },
        { name: "\u5965\u672F\u788E\u7247", levelReq: 20, str: 0, agi: 0, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [4, 6], spellCrit: [4, 6] }
      ],
      exceptional: [
        { name: "\u53D1\u5149\u4E4B\u7403", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [5, 8], spellCrit: [5, 8] },
        { name: "\u6C34\u6676\u4E4B\u7403", levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [6, 9], spellCrit: [6, 9] },
        { name: "\u4E91\u96FE\u4E4B\u7403", levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [7, 11], spellCrit: [7, 11] },
        { name: "\u95EA\u8000\u4E4B\u7403", levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [9, 14], spellCrit: [9, 14] },
        { name: "\u6F29\u6DA1\u6C34\u6676", levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [11, 16], spellCrit: [11, 16] },
        { name: "\u6C38\u6052\u4E4B\u7403", levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [13, 19], spellCrit: [13, 19] }
      ],
      elite: [
        { name: "\u5929\u754C\u4E4B\u77F3", levelReq: 41, str: 0, agi: 0, int: 5, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [12, 18], spellCrit: [12, 18] },
        { name: "\u8BE1\u5F02\u4E4B\u7403", levelReq: 44, str: 0, agi: 0, int: 12, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [15, 22], spellCrit: [15, 22] },
        { name: "\u6076\u9B54\u4E4B\u5FC3", levelReq: 48, str: 0, agi: 0, int: 22, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [18, 26], spellCrit: [18, 26] },
        { name: "\u6F29\u6DA1\u4E4B\u7403", levelReq: 52, str: 0, agi: 0, int: 34, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [22, 32], spellCrit: [22, 32] },
        { name: "\u6B21\u5143\u788E\u7247", levelReq: 56, str: 0, agi: 0, int: 48, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [26, 38], spellCrit: [26, 38] },
        { name: "\u865A\u7A7A\u4E4B\u7403", levelReq: 60, str: 0, agi: 0, int: 64, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [30, 44], spellCrit: [30, 44] }
      ]
    },
    Amulet: {
      normal: [{ name: "\u62A4\u8EAB\u7B26", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
      exceptional: [{ name: "\u62A4\u8EAB\u7B26", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
      elite: [{ name: "\u62A4\u8EAB\u7B26", levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }]
    },
    Ring: {
      normal: [{ name: "\u6212\u6307", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
      exceptional: [{ name: "\u6212\u6307", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
      elite: [{ name: "\u6212\u6307", levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }]
    },
    MainHand2H: {
      normal: [
        { name: "\u53CC\u624B\u5251", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [4, 9], spellPower: 0 },
        { name: "\u5927\u5251", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [5, 12], spellPower: 0 },
        { name: "\u5DE8\u5251", levelReq: 8, str: 12, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [5, 13], spellPower: 0 },
        { name: "\u6DF7\u79CD\u5251", levelReq: 12, str: 20, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [8, 16], spellPower: 0 },
        { name: "\u7130\u5F62\u5251", levelReq: 16, str: 28, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [10, 19], spellPower: 0 },
        { name: "\u5DE8\u5203", levelReq: 20, str: 38, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [13, 22], spellPower: 0 }
      ],
      exceptional: [
        { name: "\u957F\u5251", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [13, 31], spellPower: 0 },
        { name: "\u54E5\u7279\u5251", levelReq: 24, str: 14, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [17, 37], spellPower: 0 },
        { name: "\u8C61\u7259\u5251", levelReq: 28, str: 30, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [22, 45], spellPower: 0 },
        { name: "\u53CC\u624B\u5927\u5251", levelReq: 32, str: 50, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [28, 54], spellPower: 0 },
        { name: "\u65A9\u9996\u5251", levelReq: 36, str: 72, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [36, 66], spellPower: 0 },
        { name: "\u8FBE\u5951\u4E9A\u9570\u5200", levelReq: 40, str: 98, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [45, 81], spellPower: 0 }
      ],
      elite: [
        { name: "\u4F20\u8BF4\u4E4B\u5251", levelReq: 41, str: 20, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [38, 78], spellPower: 0 },
        { name: "\u9AD8\u5730\u4E4B\u5203", levelReq: 44, str: 44, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [50, 97], spellPower: 0 },
        { name: "\u5DE8\u795E\u4E4B\u5203", levelReq: 48, str: 72, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [65, 120], spellPower: 0 },
        { name: "\u51A0\u519B\u4E4B\u5251", levelReq: 52, str: 104, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [83, 148], spellPower: 0 },
        { name: "\u5DE8\u795E\u4E4B\u5251", levelReq: 56, str: 140, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [106, 184], spellPower: 0 },
        { name: "\u6F29\u6DA1\u4E4B\u5203", levelReq: 60, str: 178, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [134, 229], spellPower: 0 }
      ]
    },
    MainHand2HBow: {
      normal: [
        { name: "\u77ED\u5F13", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: 0 },
        { name: "\u730E\u4EBA\u4E4B\u5F13", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [3, 8], spellPower: 0 },
        { name: "\u957F\u5F13", levelReq: 8, str: 0, agi: 8, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [3, 9], spellPower: 0 },
        { name: "\u590D\u5408\u5F13", levelReq: 12, str: 0, agi: 14, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [5, 11], spellPower: 0 },
        { name: "\u957F\u6218\u5F13", levelReq: 16, str: 0, agi: 20, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [6, 13], spellPower: 0 },
        { name: "\u957F\u6218\u4E89\u5F13", levelReq: 20, str: 0, agi: 26, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [8, 15], spellPower: 0 }
      ],
      exceptional: [
        { name: "\u5203\u5F13", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [7, 22], spellPower: 0 },
        { name: "\u5243\u5200\u5F13", levelReq: 24, str: 0, agi: 10, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [10, 26], spellPower: 0 },
        { name: "\u96EA\u677E\u5F13", levelReq: 28, str: 0, agi: 22, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [13, 31], spellPower: 0 },
        { name: "\u53CC\u5F13", levelReq: 32, str: 0, agi: 36, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [17, 37], spellPower: 0 },
        { name: "\u957F\u810A\u5F13", levelReq: 36, str: 0, agi: 52, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [22, 45], spellPower: 0 },
        { name: "\u7EA2\u5F13", levelReq: 40, str: 0, agi: 70, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [28, 55], spellPower: 0 }
      ],
      elite: [
        { name: "\u86DB\u7F51\u5F13", levelReq: 41, str: 0, agi: 14, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [23, 54], spellPower: 0 },
        { name: "\u5203\u4E4B\u5F13", levelReq: 44, str: 0, agi: 30, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [31, 67], spellPower: 0 },
        { name: "\u6697\u5F71\u5F13", levelReq: 48, str: 0, agi: 50, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [41, 82], spellPower: 0 },
        { name: "\u5DE8\u5F13", levelReq: 52, str: 0, agi: 72, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [53, 101], spellPower: 0 },
        { name: "\u4E5D\u5934\u86C7\u5F13", levelReq: 56, str: 0, agi: 98, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [68, 125], spellPower: 0 },
        { name: "\u5341\u5B57\u519B\u5F13", levelReq: 60, str: 0, agi: 126, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [87, 155], spellPower: 0 }
      ]
    },
    MainHandWand: {
      normal: [
        { name: "\u6743\u6756", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 6] },
        { name: "\u5927\u6743\u6756", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [3, 8] },
        { name: "\u6218\u6743\u6756", levelReq: 8, str: 0, agi: 0, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [3, 9] },
        { name: "\u6CD5\u6756", levelReq: 12, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [5, 11] },
        { name: "\u7D2B\u6749\u6CD5\u6756", levelReq: 16, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [6, 13] },
        { name: "\u6050\u6016\u6CD5\u6756", levelReq: 20, str: 0, agi: 0, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [8, 15] }
      ],
      exceptional: [
        { name: "\u7B26\u6587\u6743\u6756", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [7, 22] },
        { name: "\u5723\u6C34\u6D12", levelReq: 24, str: 0, agi: 0, int: 10, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [10, 26] },
        { name: "\u795E\u5723\u6743\u6756", levelReq: 28, str: 0, agi: 0, int: 22, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [13, 31] },
        { name: "\u7126\u707C\u6CD5\u6756", levelReq: 32, str: 0, agi: 0, int: 36, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [17, 37] },
        { name: "\u77F3\u5316\u6CD5\u6756", levelReq: 36, str: 0, agi: 0, int: 52, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [22, 45] },
        { name: "\u5DEB\u5996\u6CD5\u6756", levelReq: 40, str: 0, agi: 0, int: 70, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [28, 55] }
      ],
      elite: [
        { name: "\u5F3A\u529B\u6743\u6756", levelReq: 41, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [23, 54] },
        { name: "\u70BD\u5929\u4F7F\u4E4B\u6756", levelReq: 44, str: 0, agi: 0, int: 30, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [31, 67] },
        { name: "\u795E\u4F7F\u4E4B\u6756", levelReq: 48, str: 0, agi: 0, int: 50, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [41, 82] },
        { name: "\u629B\u5149\u6CD5\u6756", levelReq: 52, str: 0, agi: 0, int: 72, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [53, 101] },
        { name: "\u5893\u7A74\u6CD5\u6756", levelReq: 56, str: 0, agi: 0, int: 98, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [68, 125] },
        { name: "\u6076\u9B54\u6CD5\u6756", levelReq: 60, str: 0, agi: 0, int: 126, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [87, 155] }
      ]
    },
    MainHandHybrid: {
      normal: [
        { name: "\u81EA\u7136\u9489\u9524", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [1, 4], spellPower: [1, 4] },
        { name: "\u91CE\u6027\u9524", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [1, 5], spellPower: [2, 6] },
        { name: "\u6708\u5203\u9524", levelReq: 8, str: 0, agi: 8, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: [1, 4], spellPower: [2, 6] },
        { name: "\u6A61\u6728\u6218\u9524", levelReq: 12, str: 0, agi: 14, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: [4, 8] },
        { name: "\u751F\u547D\u6CD5\u9524", levelReq: 16, str: 0, agi: 20, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: [4, 9] },
        { name: "\u4E16\u754C\u6811\u9524", levelReq: 20, str: 0, agi: 26, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: [6, 11] }
      ],
      exceptional: [
        { name: "\u81EA\u7136\u7B26\u6587\u9524", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [4, 13], spellPower: [5, 15] },
        { name: "\u91CE\u6027\u5C16\u9524", levelReq: 24, str: 0, agi: 10, int: 10, spi: 0, armor: 0, resistance: 0, physAtk: [5, 15], spellPower: [7, 18] },
        { name: "\u6708\u76F8\u6218\u9524", levelReq: 28, str: 0, agi: 22, int: 22, spi: 0, armor: 0, resistance: 0, physAtk: [5, 15], spellPower: [9, 22] },
        { name: "\u53E4\u6811\u9524", levelReq: 32, str: 0, agi: 36, int: 36, spi: 0, armor: 0, resistance: 0, physAtk: [7, 18], spellPower: [12, 26] },
        { name: "\u751F\u547D\u6012\u9524", levelReq: 36, str: 0, agi: 52, int: 52, spi: 0, armor: 0, resistance: 0, physAtk: [9, 22], spellPower: [15, 32] },
        { name: "\u4E16\u754C\u6811\u679D\u9524", levelReq: 40, str: 0, agi: 70, int: 70, spi: 0, armor: 0, resistance: 0, physAtk: [11, 28], spellPower: [20, 39] }
      ],
      elite: [
        { name: "\u539F\u59CB\u4E4B\u9524", levelReq: 41, str: 0, agi: 14, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: [12, 32], spellPower: [16, 38] },
        { name: "\u8352\u91CE\u795E\u9524", levelReq: 44, str: 0, agi: 30, int: 30, spi: 0, armor: 0, resistance: 0, physAtk: [16, 38], spellPower: [22, 47] },
        { name: "\u6708\u795E\u9489\u9524", levelReq: 48, str: 0, agi: 50, int: 50, spi: 0, armor: 0, resistance: 0, physAtk: [16, 38], spellPower: [29, 57] },
        { name: "\u6C38\u6052\u6A61\u9524", levelReq: 52, str: 0, agi: 72, int: 72, spi: 0, armor: 0, resistance: 0, physAtk: [22, 47], spellPower: [37, 71] },
        { name: "\u751F\u547D\u5DE8\u9524", levelReq: 56, str: 0, agi: 98, int: 98, spi: 0, armor: 0, resistance: 0, physAtk: [29, 57], spellPower: [48, 88] },
        { name: "\u8BFA\u8FBE\u5E0C\u5C14\u9524", levelReq: 60, str: 0, agi: 126, int: 126, spi: 0, armor: 0, resistance: 0, physAtk: [37, 71], spellPower: [61, 109] }
      ]
    },
    MainHandHybridStr: {
      normal: [
        { name: "\u5723\u5149\u9489\u9524", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [1, 4], spellPower: [1, 4] },
        { name: "\u5BA1\u5224\u9524", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [1, 5], spellPower: [2, 6] },
        { name: "\u94F6\u7FFC\u6218\u9524", levelReq: 8, str: 8, agi: 0, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: [1, 4], spellPower: [2, 6] },
        { name: "\u4FE1\u4EF0\u6218\u9524", levelReq: 12, str: 14, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: [4, 8] },
        { name: "\u5723\u5370\u6CD5\u9524", levelReq: 16, str: 20, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: [4, 9] },
        { name: "\u5149\u660E\u6218\u9524", levelReq: 20, str: 26, agi: 0, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: [6, 11] }
      ],
      exceptional: [
        { name: "\u7B26\u6587\u5723\u9524", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [4, 13], spellPower: [5, 15] },
        { name: "\u795E\u5723\u5C16\u9524", levelReq: 24, str: 10, agi: 0, int: 10, spi: 0, armor: 0, resistance: 0, physAtk: [5, 15], spellPower: [7, 18] },
        { name: "\u5BA1\u5224\u6218\u9524", levelReq: 28, str: 22, agi: 0, int: 22, spi: 0, armor: 0, resistance: 0, physAtk: [5, 15], spellPower: [9, 22] },
        { name: "\u5723\u6811\u9524", levelReq: 32, str: 36, agi: 0, int: 36, spi: 0, armor: 0, resistance: 0, physAtk: [7, 18], spellPower: [12, 26] },
        { name: "\u6124\u6012\u5723\u9524", levelReq: 36, str: 52, agi: 0, int: 52, spi: 0, armor: 0, resistance: 0, physAtk: [9, 22], spellPower: [15, 32] },
        { name: "\u5149\u660E\u679D\u9524", levelReq: 40, str: 70, agi: 0, int: 70, spi: 0, armor: 0, resistance: 0, physAtk: [11, 28], spellPower: [20, 39] }
      ],
      elite: [
        { name: "\u539F\u59CB\u5723\u9524", levelReq: 41, str: 14, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: [12, 32], spellPower: [16, 38] },
        { name: "\u795E\u7F5A\u9524", levelReq: 44, str: 30, agi: 0, int: 30, spi: 0, armor: 0, resistance: 0, physAtk: [16, 38], spellPower: [22, 47] },
        { name: "\u708E\u5929\u4F7F\u9524", levelReq: 48, str: 50, agi: 0, int: 50, spi: 0, armor: 0, resistance: 0, physAtk: [16, 38], spellPower: [29, 57] },
        { name: "\u6C38\u6052\u5723\u9524", levelReq: 52, str: 72, agi: 0, int: 72, spi: 0, armor: 0, resistance: 0, physAtk: [22, 47], spellPower: [37, 71] },
        { name: "\u5723\u5149\u5DE8\u9524", levelReq: 56, str: 98, agi: 0, int: 98, spi: 0, armor: 0, resistance: 0, physAtk: [29, 57], spellPower: [48, 88] },
        { name: "\u4F20\u8BF4\u5723\u9524", levelReq: 60, str: 126, agi: 0, int: 126, spi: 0, armor: 0, resistance: 0, physAtk: [37, 71], spellPower: [61, 109] }
      ]
    },
    MainHand2HStaff: {
      normal: [
        { name: "\u77ED\u6756", levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [4, 9] },
        { name: "\u9F50\u7709\u68CD", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [5, 12] },
        { name: "\u626D\u66F2\u4E4B\u6756", levelReq: 8, str: 0, agi: 0, int: 12, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [5, 13] },
        { name: "\u6218\u6756", levelReq: 12, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [8, 16] },
        { name: "\u6697\u5F71\u4E4B\u6756", levelReq: 16, str: 0, agi: 0, int: 28, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [10, 19] },
        { name: "\u795E\u5723\u4E4B\u6756", levelReq: 20, str: 0, agi: 0, int: 38, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [13, 22] }
      ],
      exceptional: [
        { name: "\u96EA\u677E\u6756", levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [13, 31] },
        { name: "\u54E5\u7279\u6756", levelReq: 24, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [17, 37] },
        { name: "\u7B26\u6587\u6756", levelReq: 28, str: 0, agi: 0, int: 30, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [22, 45] },
        { name: "\u6218\u4E89\u4E4B\u6756", levelReq: 32, str: 0, agi: 0, int: 50, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [28, 54] },
        { name: "\u7075\u9B42\u4E4B\u6756", levelReq: 36, str: 0, agi: 0, int: 72, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [36, 66] },
        { name: "\u6C38\u6052\u4E4B\u6756", levelReq: 40, str: 0, agi: 0, int: 98, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [45, 81] }
      ],
      elite: [
        { name: "\u957F\u8001\u4E4B\u6756", levelReq: 41, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [38, 78] },
        { name: "\u6A61\u6728\u68CD", levelReq: 44, str: 0, agi: 0, int: 44, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [50, 97] },
        { name: "\u6267\u653F\u5B98\u4E4B\u6756", levelReq: 48, str: 0, agi: 0, int: 72, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [65, 120] },
        { name: "\u8FDC\u53E4\u4E4B\u6756", levelReq: 52, str: 0, agi: 0, int: 104, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [83, 148] },
        { name: "\u6F29\u6DA1\u4E4B\u6756", levelReq: 56, str: 0, agi: 0, int: 140, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [106, 184] },
        { name: "\u795E\u5723\u4E4B\u6756", levelReq: 60, str: 0, agi: 0, int: 178, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [134, 229] }
      ]
    }
  };
  var SLOT_TO_BASE_KEY = {
    MainHand: "MainHand",
    OffHand: "OffHand",
    TwoHand: "MainHand",
    Helm: "Helm",
    Armor: "Armor",
    Gloves: "Gloves",
    Boots: "Boots",
    Belt: "Belt",
    Amulet: "Amulet",
    Ring1: "Ring",
    Ring2: "Ring",
    Ring: "Ring",
    Shield: "Shield",
    MainHand2H: "MainHand2H",
    MainHand2HBow: "MainHand2HBow",
    MainHandWand: "MainHandWand",
    MainHandHybrid: "MainHandHybrid",
    MainHandHybridStr: "MainHandHybridStr",
    MainHand2HStaff: "MainHand2HStaff"
  };
  function getBaseItemsForSlot(slotOrBaseKey) {
    const key = SLOT_TO_BASE_KEY[slotOrBaseKey] ?? slotOrBaseKey;
    return BASE_ITEMS[key] || null;
  }
  function getItemTierByMonsterLevel(monsterLevel) {
    if (monsterLevel >= 41) return "elite";
    if (monsterLevel >= 21) return "exceptional";
    return "normal";
  }

  // frontend/src/game/weaponAffixPools.js
  var PHYS_WEAPON_AFFIX_POOL = [
    { id: "phys-fierce-n", name: "\u731B\u5217", type: "prefix", tier: "normal", baseMin: 2, baseMax: 6, stat: "physWeaponFlat" },
    { id: "phys-fierce-e", name: "\u51F6\u731B", type: "prefix", tier: "exceptional", baseMin: 8, baseMax: 20, stat: "physWeaponFlat" },
    { id: "phys-fierce-l", name: "\u6B8B\u66B4", type: "prefix", tier: "elite", baseMin: 20, baseMax: 45, stat: "physWeaponFlat" },
    { id: "phys-sharp-n", name: "\u9510\u5229", type: "prefix", tier: "normal", baseMin: 2, baseMax: 4, stat: "physCritPct" },
    { id: "phys-sharp-e", name: "\u9510\u9510", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 8, stat: "physCritPct" },
    { id: "phys-sharp-l", name: "\u5251\u5203", type: "prefix", tier: "elite", baseMin: 8, baseMax: 15, stat: "physCritPct" },
    { id: "phys-crushing-n", name: "\u538B\u788E", type: "prefix", tier: "normal", baseMin: 4, baseMax: 10, stat: "physCritDmgPct" },
    { id: "phys-crushing-e", name: "\u6BC1\u706D", type: "prefix", tier: "exceptional", baseMin: 10, baseMax: 22, stat: "physCritDmgPct" },
    { id: "phys-crushing-l", name: "\u6BC1\u7CBE", type: "prefix", tier: "elite", baseMin: 22, baseMax: 40, stat: "physCritDmgPct" },
    { id: "phys-vamp-n", name: "\u5438\u8840", type: "prefix", tier: "normal", baseMin: 2, baseMax: 4, stat: "lifeStealPct" },
    { id: "phys-vamp-e", name: "\u9965\u6E34", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 8, stat: "lifeStealPct" },
    { id: "phys-vamp-l", name: "\u55DC\u9B42", type: "prefix", tier: "elite", baseMin: 8, baseMax: 14, stat: "lifeStealPct" },
    { id: "phys-siphon-n", name: "\u6D41\u8F6C", type: "prefix", tier: "normal", baseMin: 3, baseMax: 8, stat: "lifeOnHit" },
    { id: "phys-siphon-e", name: "\u7F1D\u5408", type: "prefix", tier: "exceptional", baseMin: 8, baseMax: 18, stat: "lifeOnHit" },
    { id: "phys-siphon-l", name: "\u6ECB\u517B", type: "prefix", tier: "elite", baseMin: 18, baseMax: 35, stat: "lifeOnHit" },
    { id: "phys-imbue-n", name: "\u9644\u9B54", type: "prefix", tier: "normal", baseMin: 4, baseMax: 10, stat: "addedMagicDmg" },
    { id: "phys-imbue-e", name: "\u5143\u7D20", type: "prefix", tier: "exceptional", baseMin: 10, baseMax: 22, stat: "addedMagicDmg" },
    { id: "phys-imbue-l", name: "\u4F4D\u9762", type: "prefix", tier: "elite", baseMin: 22, baseMax: 45, stat: "addedMagicDmg" },
    { id: "phys-penet-n", name: "\u7A7F\u900F", type: "prefix", tier: "normal", baseMin: 3, baseMax: 8, stat: "armorPen" },
    { id: "phys-penet-e", name: "\u7834\u7532", type: "prefix", tier: "exceptional", baseMin: 8, baseMax: 18, stat: "armorPen" },
    { id: "phys-penet-l", name: "\u865A\u7A7A", type: "prefix", tier: "elite", baseMin: 18, baseMax: 35, stat: "armorPen" },
    { id: "phys-hit-n", name: "\u731C\u51C6", type: "prefix", tier: "normal", baseMin: 2, baseMax: 4, stat: "hitPct" },
    { id: "phys-hit-e", name: "\u767E\u53D1", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 7, stat: "hitPct" },
    { id: "phys-hit-l", name: "\u767E\u6B65", type: "prefix", tier: "elite", baseMin: 7, baseMax: 12, stat: "hitPct" },
    { id: "phys-strike-suf-n", name: "\u6253\u51FB\u4E4B", type: "suffix", tier: "normal", baseMin: 4, baseMax: 10, stat: "physDmgPct" },
    { id: "phys-strike-suf-e", name: "\u529B\u91CF\u4E4B", type: "suffix", tier: "exceptional", baseMin: 10, baseMax: 22, stat: "physDmgPct" },
    { id: "phys-strike-suf-l", name: "\u6BC1\u706D\u4E4B", type: "suffix", tier: "elite", baseMin: 22, baseMax: 40, stat: "physDmgPct" },
    { id: "phys-punct-suf-n", name: "\u7A7F\u523A\u4E4B", type: "suffix", tier: "normal", baseMin: 5, baseMax: 10, stat: "ignoreArmorPct" },
    { id: "phys-punct-suf-e", name: "\u6495\u88C2\u4E4B", type: "suffix", tier: "exceptional", baseMin: 10, baseMax: 18, stat: "ignoreArmorPct" },
    { id: "phys-punct-suf-l", name: "\u5904\u51B3\u4EBA\u4E4B", type: "suffix", tier: "elite", baseMin: 18, baseMax: 28, stat: "ignoreArmorPct" }
  ];
  var SPELL_WEAPON_AFFIX_POOL = [
    { id: "spell-glow-n", name: "\u5FAE\u5149", type: "prefix", tier: "normal", baseMin: 2, baseMax: 6, stat: "spellWeaponFlat" },
    { id: "spell-glow-e", name: "\u8000\u773C", type: "prefix", tier: "exceptional", baseMin: 8, baseMax: 20, stat: "spellWeaponFlat" },
    { id: "spell-glow-l", name: "\u8D85\u51E1", type: "prefix", tier: "elite", baseMin: 20, baseMax: 45, stat: "spellWeaponFlat" },
    { id: "spell-focus-n", name: "\u4E13\u6CE8", type: "prefix", tier: "normal", baseMin: 2, baseMax: 4, stat: "spellCritPct" },
    { id: "spell-focus-e", name: "\u5171\u9E23", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 8, stat: "spellCritPct" },
    { id: "spell-focus-l", name: "\u539F\u521D", type: "prefix", tier: "elite", baseMin: 8, baseMax: 15, stat: "spellCritPct" },
    { id: "spell-over-n", name: "\u8FC7\u8F7D", type: "prefix", tier: "normal", baseMin: 4, baseMax: 10, stat: "spellCritDmgPct" },
    { id: "spell-over-e", name: "\u66B4\u98CE", type: "prefix", tier: "exceptional", baseMin: 10, baseMax: 22, stat: "spellCritDmgPct" },
    { id: "spell-over-l", name: "\u5929\u542F", type: "prefix", tier: "elite", baseMin: 22, baseMax: 40, stat: "spellCritDmgPct" },
    { id: "spell-confl-n", name: "\u6C47\u6D41", type: "prefix", tier: "normal", baseMin: 2, baseMax: 4, stat: "manaRefluxPct" },
    { id: "spell-confl-e", name: "\u548C\u58F0", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 8, stat: "manaRefluxPct" },
    { id: "spell-confl-l", name: "\u7ECF\u7EBF", type: "prefix", tier: "elite", baseMin: 8, baseMax: 14, stat: "manaRefluxPct" },
    { id: "spell-chan-n", name: "\u5F15\u5BFC", type: "prefix", tier: "normal", baseMin: 2, baseMax: 6, stat: "manaOnCast" },
    { id: "spell-chan-e", name: "\u6062\u590D", type: "prefix", tier: "exceptional", baseMin: 5, baseMax: 12, stat: "manaOnCast" },
    { id: "spell-chan-l", name: "\u660E\u5F7C", type: "prefix", tier: "elite", baseMin: 12, baseMax: 22, stat: "manaOnCast" },
    { id: "spell-star-n", name: "\u661F\u953B", type: "prefix", tier: "normal", baseMin: 4, baseMax: 10, stat: "arcaneFollowup" },
    { id: "spell-star-e", name: "\u6B8B\u50CF", type: "prefix", tier: "exceptional", baseMin: 10, baseMax: 22, stat: "arcaneFollowup" },
    { id: "spell-star-l", name: "\u65E5\u8680", type: "prefix", tier: "elite", baseMin: 22, baseMax: 45, stat: "arcaneFollowup" },
    { id: "spell-null-n", name: "\u65E0\u6548", type: "prefix", tier: "normal", baseMin: 3, baseMax: 8, stat: "spellPen" },
    { id: "spell-null-e", name: "\u7A7F\u900F", type: "prefix", tier: "exceptional", baseMin: 8, baseMax: 18, stat: "spellPen" },
    { id: "spell-null-l", name: "\u6DF7\u6C79", type: "prefix", tier: "elite", baseMin: 18, baseMax: 35, stat: "spellPen" },
    { id: "spell-hit-n", name: "\u51C6\u661F", type: "prefix", tier: "normal", baseMin: 2, baseMax: 4, stat: "hitPct" },
    { id: "spell-hit-e", name: "\u7F25\u7F07", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 7, stat: "hitPct" },
    { id: "spell-hit-l", name: "\u771F\u6CD5", type: "prefix", tier: "elite", baseMin: 7, baseMax: 12, stat: "hitPct" },
    { id: "spell-arc-suf-n", name: "\u5965\u672F\u4E4B", type: "suffix", tier: "normal", baseMin: 4, baseMax: 10, stat: "spellDmgPct" },
    { id: "spell-arc-suf-e", name: "\u6CD5\u672F\u4E4B", type: "suffix", tier: "exceptional", baseMin: 10, baseMax: 22, stat: "spellDmgPct" },
    { id: "spell-arc-suf-l", name: "\u6BC1\u706D\u4E4B", type: "suffix", tier: "elite", baseMin: 22, baseMax: 40, stat: "spellDmgPct" },
    { id: "spell-diss-suf-n", name: "\u6EB6\u89E3\u4E4B", type: "suffix", tier: "normal", baseMin: 5, baseMax: 10, stat: "ignoreResistPct" },
    { id: "spell-diss-suf-e", name: "\u8150\u5316\u4E4B", type: "suffix", tier: "exceptional", baseMin: 10, baseMax: 18, stat: "ignoreResistPct" },
    { id: "spell-diss-suf-l", name: "\u7834\u9635\u4E4B", type: "suffix", tier: "elite", baseMin: 18, baseMax: 28, stat: "ignoreResistPct" }
  ];

  // frontend/src/game/slotAffixPools.js
  var ARMOR_AFFIX_POOL = [
    // Iron / Steel / Adamant — +物理减伤%，仅头盔、胸甲
    { id: "armor-iron-n", name: "\u94C1\u76AE", type: "prefix", tier: "normal", baseMin: 2, baseMax: 5, stat: "physDrPct", slots: ["Helm", "Armor"] },
    { id: "armor-iron-e", name: "\u94A2\u94C1", type: "prefix", tier: "exceptional", baseMin: 5, baseMax: 11, stat: "physDrPct", slots: ["Helm", "Armor"] },
    { id: "armor-iron-l", name: "\u4E9A\u5F53", type: "prefix", tier: "elite", baseMin: 11, baseMax: 20, stat: "physDrPct", slots: ["Helm", "Armor"] },
    // Guarded / Bulwark / Citadel — 单件护甲%
    { id: "armor-guard-n", name: "\u536B\u9632", type: "prefix", tier: "normal", baseMin: 12, baseMax: 20, stat: "armorPct", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-guard-e", name: "\u5807\u5792", type: "prefix", tier: "exceptional", baseMin: 20, baseMax: 35, stat: "armorPct", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-guard-l", name: "\u57CE\u5821", type: "prefix", tier: "elite", baseMin: 35, baseMax: 55, stat: "armorPct", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    // Warded / Sanctified / Aegis — 单件抗性%
    { id: "armor-wardp-n", name: "\u62A4\u7B26", type: "prefix", tier: "normal", baseMin: 12, baseMax: 20, stat: "resistancePct", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-wardp-e", name: "\u5723\u5316", type: "prefix", tier: "exceptional", baseMin: 20, baseMax: 35, stat: "resistancePct", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-wardp-l", name: "\u795E\u5C4D", type: "prefix", tier: "elite", baseMin: 35, baseMax: 55, stat: "resistancePct", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    // Healthy / Hardy / Eternal — +最大生命（仅防具）
    { id: "armor-hp-n", name: "\u5065\u5EB7", type: "prefix", tier: "normal", baseMin: 4, baseMax: 8, stat: "maxHpFlat", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-hp-e", name: "\u5F3A\u5065", type: "prefix", tier: "exceptional", baseMin: 8, baseMax: 16, stat: "maxHpFlat", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-hp-l", name: "\u6C38\u6052", type: "prefix", tier: "elite", baseMin: 16, baseMax: 30, stat: "maxHpFlat", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    // Evasive / Windstep / Phantom — 闪避%
    { id: "armor-dodge-n", name: "\u8F7B\u5F71", type: "prefix", tier: "normal", baseMin: 2, baseMax: 4, stat: "dodgePct", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-dodge-e", name: "\u5FA1\u98CE", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 7, stat: "dodgePct", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-dodge-l", name: "\u5E7D\u5F71", type: "prefix", tier: "elite", baseMin: 7, baseMax: 12, stat: "dodgePct", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    // of Life — 击杀回复生命（战斗中击杀敌人时触发）
    { id: "armor-lok-n", name: "\u751F\u547D\u4E4B", type: "suffix", tier: "normal", baseMin: 2, baseMax: 5, stat: "lifeOnKill", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-lok-e", name: "\u6D3B\u529B\u4E4B", type: "suffix", tier: "exceptional", baseMin: 5, baseMax: 12, stat: "lifeOnKill", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    { id: "armor-lok-l", name: "\u6C38\u751F\u4E4B", type: "suffix", tier: "elite", baseMin: 12, baseMax: 22, stat: "lifeOnKill", slots: ["Helm", "Armor", "Gloves", "Boots", "Belt"] },
    // Thorns — 胸甲、手套
    { id: "armor-thorn-n", name: "\u523A\u4E4B", type: "suffix", tier: "normal", baseMin: 1, baseMax: 3, stat: "thorns", slots: ["Armor", "Gloves"] },
    { id: "armor-thorn-e", name: "\u590D\u4EC7\u4E4B", type: "suffix", tier: "exceptional", baseMin: 3, baseMax: 8, stat: "thorns", slots: ["Armor", "Gloves"] },
    { id: "armor-thorn-l", name: "\u62A5\u590D\u4E4B", type: "suffix", tier: "elite", baseMin: 8, baseMax: 15, stat: "thorns", slots: ["Armor", "Gloves"] }
  ];
  var SHIELD_AFFIX_POOL = [
    { id: "sh-block-n", name: "\u5B88\u536B", type: "prefix", tier: "normal", baseMin: 2, baseMax: 5, stat: "blockPct" },
    { id: "sh-block-e", name: "\u9632\u5FA1", type: "prefix", tier: "exceptional", baseMin: 5, baseMax: 12, stat: "blockPct" },
    { id: "sh-block-l", name: "\u51A0\u519B", type: "prefix", tier: "elite", baseMin: 12, baseMax: 22, stat: "blockPct" },
    { id: "sh-bdr-n", name: "\u575A\u5B9E", type: "prefix", tier: "normal", baseMin: 5, baseMax: 12, stat: "blockDrPct" },
    { id: "sh-bdr-e", name: "\u575A\u6BC5", type: "prefix", tier: "exceptional", baseMin: 12, baseMax: 25, stat: "blockDrPct" },
    { id: "sh-bdr-l", name: "\u4E0D\u7834", type: "prefix", tier: "elite", baseMin: 25, baseMax: 45, stat: "blockDrPct" },
    { id: "sh-bcnt-n", name: "\u8FD8\u51FB\u4E4B", type: "suffix", tier: "normal", baseMin: 2, baseMax: 5, stat: "blockCounter" },
    { id: "sh-bcnt-e", name: "\u53CD\u5236\u4E4B", type: "suffix", tier: "exceptional", baseMin: 5, baseMax: 12, stat: "blockCounter" },
    { id: "sh-bcnt-l", name: "\u5316\u8EAB\u4E4B", type: "suffix", tier: "elite", baseMin: 12, baseMax: 22, stat: "blockCounter" }
  ];
  var ORB_AFFIX_POOL = [
    { id: "orb-lum-n", name: "\u5FAE\u5149", type: "prefix", tier: "normal", baseMin: 3, baseMax: 8, stat: "spellPowerFlat" },
    { id: "orb-lum-e", name: "\u95EA\u8000", type: "prefix", tier: "exceptional", baseMin: 10, baseMax: 24, stat: "spellPowerFlat" },
    { id: "orb-lum-l", name: "\u5929\u754C", type: "prefix", tier: "elite", baseMin: 24, baseMax: 50, stat: "spellPowerFlat" },
    { id: "orb-bal-n", name: "\u5747\u8861", type: "prefix", tier: "normal", baseMin: 2, baseMax: 4, stat: "orbBalanced" },
    { id: "orb-bal-e", name: "\u548C\u8C10", type: "prefix", tier: "exceptional", baseMin: 5, baseMax: 10, stat: "orbBalanced" },
    { id: "orb-bal-l", name: "\u5171\u9E23", type: "prefix", tier: "elite", baseMin: 10, baseMax: 18, stat: "orbBalanced" },
    { id: "orb-ins-n", name: "\u6D1E\u5BDF", type: "prefix", tier: "normal", baseMin: 1, baseMax: 3, stat: "intellect" },
    { id: "orb-ins-e", name: "\u6E05\u9192", type: "prefix", tier: "exceptional", baseMin: 3, baseMax: 7, stat: "intellect" },
    { id: "orb-ins-l", name: "\u5FC3\u667A", type: "prefix", tier: "elite", baseMin: 7, baseMax: 14, stat: "intellect" },
    { id: "orb-mp-n", name: "\u6D1E\u5BDF\u4E4B", type: "suffix", tier: "normal", baseMin: 4, baseMax: 8, stat: "maxManaPct" },
    { id: "orb-mp-e", name: "\u6E05\u660E\u4E4B", type: "suffix", tier: "exceptional", baseMin: 8, baseMax: 18, stat: "maxManaPct" },
    { id: "orb-mp-l", name: "\u65E0\u5C3D\u4E4B", type: "suffix", tier: "elite", baseMin: 18, baseMax: 30, stat: "maxManaPct" },
    { id: "orb-mreg-n", name: "\u56DE\u6D8C\u4E4B", type: "suffix", tier: "normal", baseMin: 1, baseMax: 3, stat: "manaRegen" },
    { id: "orb-mreg-e", name: "\u8865\u7ED9\u4E4B", type: "suffix", tier: "exceptional", baseMin: 3, baseMax: 8, stat: "manaRegen" },
    { id: "orb-mreg-l", name: "\u6DF1\u6E90\u4E4B", type: "suffix", tier: "elite", baseMin: 8, baseMax: 15, stat: "manaRegen" },
    { id: "orb-sc-n", name: "\u805A\u7126\u4E4B", type: "suffix", tier: "normal", baseMin: 1, baseMax: 3, stat: "spellCritPct" },
    { id: "orb-sc-e", name: "\u7CBE\u51C6\u4E4B", type: "suffix", tier: "exceptional", baseMin: 3, baseMax: 6, stat: "spellCritPct" },
    { id: "orb-sc-l", name: "\u8282\u70B9\u4E4B", type: "suffix", tier: "elite", baseMin: 6, baseMax: 12, stat: "spellCritPct" }
  ];
  var RING_AFFIX_POOL = [
    { id: "ring-pug-n", name: "\u597D\u6597", type: "prefix", tier: "normal", baseMin: 3, baseMax: 8, stat: "physAtk" },
    { id: "ring-pug-e", name: "\u5F81\u6218", type: "prefix", tier: "exceptional", baseMin: 10, baseMax: 24, stat: "physAtk" },
    { id: "ring-pug-l", name: "\u597D\u6218", type: "prefix", tier: "elite", baseMin: 24, baseMax: 50, stat: "physAtk" },
    { id: "ring-vit-n", name: "\u5143\u6C14", type: "prefix", tier: "normal", baseMin: 2, baseMax: 4, stat: "stamina" },
    { id: "ring-vit-e", name: "\u5F3A\u58EE", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 9, stat: "stamina" },
    { id: "ring-vit-l", name: "\u5065\u58EE", type: "prefix", tier: "elite", baseMin: 9, baseMax: 18, stat: "stamina" },
    { id: "ring-rage-n", name: "\u72C2\u6012\u4E4B", type: "suffix", tier: "normal", baseMin: 5, baseMax: 10, stat: "rageGenPct" },
    { id: "ring-rage-e", name: "\u6218\u610F\u4E4B", type: "suffix", tier: "exceptional", baseMin: 10, baseMax: 22, stat: "rageGenPct" },
    { id: "ring-rage-l", name: "\u72C2\u6218\u4E4B", type: "suffix", tier: "elite", baseMin: 22, baseMax: 40, stat: "rageGenPct" },
    { id: "ring-hpp-n", name: "\u65E0\u754F\u4E4B", type: "suffix", tier: "normal", baseMin: 4, baseMax: 8, stat: "maxHpPct" },
    { id: "ring-hpp-e", name: "\u52C7\u58EB\u4E4B", type: "suffix", tier: "exceptional", baseMin: 8, baseMax: 18, stat: "maxHpPct" },
    { id: "ring-hpp-l", name: "\u80DC\u8005\u4E4B", type: "suffix", tier: "elite", baseMin: 18, baseMax: 30, stat: "maxHpPct" }
  ];
  var AMULET_AFFIX_POOL = [
    { id: "amu-hero-n", name: "\u82F1\u96C4", type: "prefix", tier: "normal", baseMin: 1, baseMax: 1, stat: "allPrimary" },
    { id: "amu-hero-e", name: "\u4F20\u8BF4", type: "prefix", tier: "exceptional", baseMin: 1, baseMax: 2, stat: "allPrimary" },
    { id: "amu-hero-l", name: "\u795E\u8BDD", type: "prefix", tier: "elite", baseMin: 3, baseMax: 5, stat: "allPrimary" },
    { id: "amu-pdr-n", name: "\u52C7\u6562", type: "prefix", tier: "normal", baseMin: 3, baseMax: 7, stat: "physDrPct" },
    { id: "amu-pdr-e", name: "\u65E0\u754F", type: "prefix", tier: "exceptional", baseMin: 7, baseMax: 15, stat: "physDrPct" },
    { id: "amu-pdr-l", name: "\u4E0D\u5C48", type: "prefix", tier: "elite", baseMin: 15, baseMax: 26, stat: "physDrPct" },
    { id: "amu-rk-n", name: "\u5341\u5B57\u519B\u4E4B", type: "suffix", tier: "normal", baseMin: 5, baseMax: 10, stat: "rageOnKill" },
    { id: "amu-rk-e", name: "\u6218\u72C2\u4E4B", type: "suffix", tier: "exceptional", baseMin: 10, baseMax: 20, stat: "rageOnKill" },
    { id: "amu-rk-l", name: "\u6C38\u6052\u4E4B", type: "suffix", tier: "elite", baseMin: 20, baseMax: 35, stat: "rageOnKill" },
    { id: "amu-ds-n", name: "\u7C89\u788E\u4E4B", type: "suffix", tier: "normal", baseMin: 3, baseMax: 6, stat: "doubleStrikePct" },
    { id: "amu-ds-e", name: "\u5C60\u6740\u4E4B", type: "suffix", tier: "exceptional", baseMin: 6, baseMax: 14, stat: "doubleStrikePct" },
    { id: "amu-ds-l", name: "\u6BC1\u706D\u4E4B", type: "suffix", tier: "elite", baseMin: 14, baseMax: 24, stat: "doubleStrikePct" }
  ];
  function affixAllowedOnSlot(affixDef, resolvedSlot, baseKey) {
    const slots = affixDef.slots;
    if (Array.isArray(slots) && slots.length > 0) {
      return slots.includes(resolvedSlot);
    }
    return true;
  }

  // frontend/src/game/equipment.js
  var QUALITY_NORMAL = "normal";
  var QUALITY_MAGIC = "magic";
  var QUALITY_RARE = "rare";
  var QUALITY_UNIQUE = "unique";
  var DROP_BASE_CHANCE = 0.08;
  var DROP_ELITE_MULT = 1.8;
  var DROP_BOSS_MULT = 2.5;
  var QUALITY_NORMAL_CHANCE = 0.92;
  var QUALITY_MAGIC_CHANCE = 0.07;
  var QUALITY_RARE_CHANCE = 0.01;
  var QUALITY_ELITE_NORMAL = 0.75;
  var QUALITY_ELITE_MAGIC = 0.2;
  var QUALITY_ELITE_RARE = 0.05;
  var QUALITY_BOSS_NORMAL = 0.5;
  var QUALITY_BOSS_MAGIC = 0.35;
  var QUALITY_BOSS_RARE = 0.15;
  var QUALITY_SHOP_NORMAL = 0.5;
  var QUALITY_SHOP_MAGIC = 0.35;
  var QUALITY_SHOP_RARE = 0.15;
  var SHOP_QUALITY_ODDS = Object.freeze({
    normal: QUALITY_SHOP_NORMAL,
    magic: QUALITY_SHOP_MAGIC,
    rare: QUALITY_SHOP_RARE
  });
  var AFFIX_POOL = [
    { id: "sturdy", name: "\u575A\u56FA", type: "prefix", tier: "normal", baseMin: 2, baseMax: 5, stat: "armor" },
    { id: "fortified", name: "\u5F3A\u5316", type: "prefix", tier: "exceptional", baseMin: 5, baseMax: 12, stat: "armor" },
    { id: "armored", name: "\u91CD\u7532", type: "prefix", tier: "elite", baseMin: 12, baseMax: 24, stat: "armor" },
    { id: "warding", name: "\u9632\u62A4", type: "prefix", tier: "normal", baseMin: 2, baseMax: 5, stat: "resistance" },
    { id: "shielding", name: "\u5C4F\u969C", type: "prefix", tier: "exceptional", baseMin: 5, baseMax: 12, stat: "resistance" },
    { id: "warded", name: "\u7ED3\u754C", type: "prefix", tier: "elite", baseMin: 12, baseMax: 24, stat: "resistance" },
    { id: "mighty", name: "\u5F3A\u529B", type: "prefix", tier: "normal", baseMin: 1, baseMax: 3, stat: "strength" },
    { id: "strong", name: "\u5F3A\u5065", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 8, stat: "strength" },
    { id: "titan", name: "\u6CF0\u5766", type: "prefix", tier: "elite", baseMin: 9, baseMax: 15, stat: "strength" },
    { id: "swift", name: "\u8FC5\u6377", type: "prefix", tier: "normal", baseMin: 1, baseMax: 3, stat: "agility" },
    { id: "nimble", name: "\u7075\u5DE7", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 8, stat: "agility" },
    { id: "eagle", name: "\u9E70\u96BC", type: "prefix", tier: "elite", baseMin: 9, baseMax: 15, stat: "agility" },
    { id: "sage", name: "\u667A\u8005", type: "prefix", tier: "normal", baseMin: 1, baseMax: 3, stat: "intellect" },
    { id: "scholar", name: "\u5B66\u8005", type: "prefix", tier: "exceptional", baseMin: 4, baseMax: 8, stat: "intellect" },
    { id: "archmage", name: "\u5927\u6CD5\u5E08", type: "prefix", tier: "elite", baseMin: 9, baseMax: 15, stat: "intellect" },
    { id: "of-the-bear", name: "\u718A\u4E4B", type: "suffix", tier: "normal", baseMin: 1, baseMax: 3, stat: "strength" },
    { id: "of-the-titan", name: "\u6CF0\u5766\u4E4B", type: "suffix", tier: "elite", baseMin: 9, baseMax: 15, stat: "strength" },
    { id: "of-striking", name: "\u6253\u51FB\u4E4B", type: "suffix", tier: "normal", baseMin: 1, baseMax: 3, stat: "agility" },
    { id: "of-the-tiger", name: "\u864E\u4E4B", type: "suffix", tier: "elite", baseMin: 9, baseMax: 15, stat: "agility" },
    { id: "of-the-owl", name: "\u67AD\u4E4B", type: "suffix", tier: "normal", baseMin: 1, baseMax: 3, stat: "intellect" },
    { id: "of-the-mage", name: "\u6CD5\u5E08\u4E4B", type: "suffix", tier: "elite", baseMin: 9, baseMax: 15, stat: "intellect" },
    { id: "of-stamina", name: "\u8010\u529B", type: "suffix", tier: "normal", baseMin: 1, baseMax: 4, stat: "stamina" },
    { id: "of-vitality", name: "\u6D3B\u529B", type: "suffix", tier: "exceptional", baseMin: 4, baseMax: 10, stat: "stamina" },
    { id: "of-spirit", name: "\u7CBE\u795E", type: "suffix", tier: "normal", baseMin: 1, baseMax: 3, stat: "spirit" },
    { id: "phys-crit-n", name: "\u731B\u88AD", type: "prefix", tier: "normal", baseMin: 1, baseMax: 2, stat: "physCritPct" },
    { id: "phys-crit-e", name: "\u8001\u7EC3", type: "prefix", tier: "exceptional", baseMin: 2, baseMax: 4, stat: "physCritPct" },
    { id: "phys-crit-l", name: "\u6218\u610F", type: "prefix", tier: "elite", baseMin: 4, baseMax: 7, stat: "physCritPct" },
    { id: "phys-critdmg-n", name: "\u7834\u52BF", type: "suffix", tier: "normal", baseMin: 4, baseMax: 8, stat: "physCritDmgPct" },
    { id: "phys-critdmg-e", name: "\u51CC\u5389", type: "suffix", tier: "exceptional", baseMin: 8, baseMax: 14, stat: "physCritDmgPct" },
    { id: "phys-critdmg-l", name: "\u88C1\u51B3", type: "suffix", tier: "elite", baseMin: 14, baseMax: 24, stat: "physCritDmgPct" },
    { id: "spell-crit-n", name: "\u5492\u950B", type: "prefix", tier: "normal", baseMin: 1, baseMax: 2, stat: "spellCritPct" },
    { id: "spell-crit-e", name: "\u5965\u609F", type: "prefix", tier: "exceptional", baseMin: 2, baseMax: 4, stat: "spellCritPct" },
    { id: "spell-crit-l", name: "\u661F\u8F89", type: "prefix", tier: "elite", baseMin: 4, baseMax: 7, stat: "spellCritPct" },
    { id: "spell-critdmg-n", name: "\u88C2\u5492", type: "suffix", tier: "normal", baseMin: 4, baseMax: 8, stat: "spellCritDmgPct" },
    { id: "spell-critdmg-e", name: "\u7EC8\u7130", type: "suffix", tier: "exceptional", baseMin: 8, baseMax: 14, stat: "spellCritDmgPct" },
    { id: "spell-critdmg-l", name: "\u5929\u542F", type: "suffix", tier: "elite", baseMin: 14, baseMax: 24, stat: "spellCritDmgPct" },
    { id: "mana-regen-n", name: "\u542F\u8FEA", type: "prefix", tier: "normal", baseMin: 1, baseMax: 2, stat: "manaRegen" },
    { id: "mana-regen-e", name: "\u51A5\u60F3", type: "prefix", tier: "exceptional", baseMin: 2, baseMax: 4, stat: "manaRegen" },
    { id: "mana-regen-l", name: "\u8D24\u54F2", type: "prefix", tier: "elite", baseMin: 4, baseMax: 7, stat: "manaRegen" },
    { id: "hp-regen-n", name: "\u575A\u5FCD", type: "suffix", tier: "normal", baseMin: 1, baseMax: 2, stat: "hpRegen" },
    { id: "hp-regen-e", name: "\u6052\u5FC3", type: "suffix", tier: "exceptional", baseMin: 2, baseMax: 4, stat: "hpRegen" },
    { id: "hp-regen-l", name: "\u5B88\u9B42", type: "suffix", tier: "elite", baseMin: 4, baseMax: 7, stat: "hpRegen" },
    { id: "gold-find-n", name: "\u8D2A\u6B32", type: "suffix", tier: "normal", baseMin: 6, baseMax: 12, stat: "goldFindPct" },
    { id: "gold-find-e", name: "\u5546\u8D3E", type: "suffix", tier: "exceptional", baseMin: 12, baseMax: 20, stat: "goldFindPct" },
    { id: "gold-find-l", name: "\u5DE8\u8D3E", type: "suffix", tier: "elite", baseMin: 20, baseMax: 35, stat: "goldFindPct" },
    { id: "magic-find-n", name: "\u5E78\u8FD0", type: "suffix", tier: "normal", baseMin: 5, baseMax: 10, stat: "magicFindPct" },
    { id: "magic-find-e", name: "\u5BFB\u5B9D", type: "suffix", tier: "exceptional", baseMin: 10, baseMax: 18, stat: "magicFindPct" },
    { id: "magic-find-l", name: "\u5929\u7737", type: "suffix", tier: "elite", baseMin: 18, baseMax: 30, stat: "magicFindPct" }
  ];
  var WEAPON_AFFIX_STATS = /* @__PURE__ */ new Set([
    "physWeaponFlat",
    "lifeStealPct",
    "lifeOnHit",
    "addedMagicDmg",
    "armorPen",
    "physDmgPct",
    "ignoreArmorPct",
    "spellWeaponFlat",
    "manaRefluxPct",
    "manaOnCast",
    "arcaneFollowup",
    "spellPen",
    "spellDmgPct",
    "ignoreResistPct",
    "hitPct"
  ]);
  function applyMagicFindToQualityWeights(normal, magic, rare, magicFindPct = 0) {
    const mf = Math.max(0, Number(magicFindPct) || 0);
    if (mf <= 0) return { normal, magic, rare };
    const effectiveMf = Math.min(300, mf);
    const normalWeight = normal;
    const magicWeight = magic * (1 + effectiveMf / 200);
    const rareWeight = rare * (1 + effectiveMf / 120);
    const sum = normalWeight + magicWeight + rareWeight;
    if (sum <= 0) return { normal, magic, rare };
    return {
      normal: normalWeight / sum,
      magic: magicWeight / sum,
      rare: rareWeight / sum
    };
  }
  var EPITHET_POOL = [
    "\u8001\u5175",
    "\u51A0\u519B",
    "\u8363\u5149",
    "\u707E\u5384",
    "\u6069\u60E0",
    "\u5B88\u5FA1",
    "\u8D24\u8005",
    "\u98CE\u66B4",
    "\u70C8\u7130",
    "\u5BD2\u971C"
  ];
  function pickRandom(list, rng) {
    if (!list.length) return null;
    return list[Math.floor(rng() * list.length)];
  }
  function randomInRange(min, max, rng) {
    return min + Math.floor(rng() * (max - min + 1));
  }
  function weaponDamageRanges(arr) {
    if (!Array.isArray(arr) || arr.length < 2) return null;
    const [a, b] = arr;
    const mid = (a + b) / 2;
    const minLow = a;
    const minHigh = Math.floor(mid);
    const maxLow = Math.ceil(mid);
    const maxHigh = b;
    return { minLow, minHigh, maxLow, maxHigh };
  }
  function rollWeaponDamageRange(arr, rng) {
    const r = weaponDamageRanges(arr);
    if (!r) return null;
    let min = randomInRange(r.minLow, r.minHigh, rng);
    let max = randomInRange(r.maxLow, r.maxHigh, rng);
    if (min > max) [min, max] = [max, min];
    return { min, max };
  }
  function rollInRange(baseMin, baseMax, quality, rng) {
    if (quality === QUALITY_MAGIC || quality === QUALITY_RARE) {
      const low = Math.max(1, Math.floor(baseMin * 0.7));
      const high = Math.ceil(baseMax * 1.3);
      return randomInRange(low, high, rng);
    }
    return randomInRange(baseMin, baseMax, rng);
  }
  function getAffixRange(baseMin, baseMax, quality) {
    if (quality === QUALITY_MAGIC || quality === QUALITY_RARE) {
      const low = Math.max(1, Math.floor(baseMin * 0.7));
      const high = Math.ceil(baseMax * 1.3);
      return { min: low, max: high };
    }
    return { min: baseMin, max: baseMax };
  }
  function filterAffixesByTier(pool, itemTier) {
    return pool.filter((a) => {
      if (itemTier === "normal") return a.tier === "normal";
      if (itemTier === "exceptional") return a.tier === "normal" || a.tier === "exceptional";
      if (itemTier === "elite") return true;
      return a.tier === itemTier;
    });
  }
  function getWeaponAffixMode(baseKey, baseDef) {
    const weaponKeys = ["MainHand", "MainHand2H", "MainHand2HBow", "MainHandWand", "MainHandHybrid", "MainHandHybridStr", "MainHand2HStaff"];
    if (!weaponKeys.includes(baseKey) || !baseDef) return null;
    const hasPhys = Array.isArray(baseDef.physAtk) || (baseDef.physAtk || 0) > 0;
    const hasSpell = Array.isArray(baseDef.spellPower) || (baseDef.spellPower || 0) > 0;
    if (hasPhys && hasSpell) return "hybrid";
    if (hasPhys && !hasSpell) return "physical";
    if (hasSpell && !hasPhys) return "spell";
    return null;
  }
  function getMergedAffixPool(itemTier, baseKey, baseDef, resolvedSlot) {
    let pool = filterAffixesByTier(AFFIX_POOL, itemTier);
    const armorSlots = ["Helm", "Armor", "Gloves", "Boots", "Belt"];
    if (armorSlots.includes(resolvedSlot)) {
      pool = pool.concat(filterAffixesByTier(ARMOR_AFFIX_POOL, itemTier));
    }
    if (baseKey === "Shield") {
      pool = pool.concat(filterAffixesByTier(SHIELD_AFFIX_POOL, itemTier));
    }
    if (baseKey === "OffHand") {
      pool = pool.concat(filterAffixesByTier(ORB_AFFIX_POOL, itemTier));
    }
    if (resolvedSlot === "Ring") {
      pool = pool.concat(filterAffixesByTier(RING_AFFIX_POOL, itemTier));
    }
    if (resolvedSlot === "Amulet") {
      pool = pool.concat(filterAffixesByTier(AMULET_AFFIX_POOL, itemTier));
    }
    const mode = getWeaponAffixMode(baseKey, baseDef);
    if (mode === "physical") pool = pool.concat(filterAffixesByTier(PHYS_WEAPON_AFFIX_POOL, itemTier));
    if (mode === "spell") pool = pool.concat(filterAffixesByTier(SPELL_WEAPON_AFFIX_POOL, itemTier));
    if (mode === "hybrid") {
      pool = pool.concat(filterAffixesByTier(PHYS_WEAPON_AFFIX_POOL, itemTier));
      pool = pool.concat(filterAffixesByTier(SPELL_WEAPON_AFFIX_POOL, itemTier));
    }
    return pool.filter((a) => affixAllowedOnSlot(a, resolvedSlot, baseKey));
  }
  function makeAffixEntry(def, quality, rng) {
    const range = getAffixRange(def.baseMin, def.baseMax, quality);
    const val = rollInRange(def.baseMin, def.baseMax, quality, rng);
    return {
      id: def.id,
      name: def.name,
      stat: def.stat,
      value: val,
      min: range.min,
      max: range.max
    };
  }
  function pickAffixNoDup(pool, type, usedIds, rng) {
    const candidates = pool.filter((a) => a.type === type && !usedIds.has(a.id));
    const def = pickRandom(candidates, rng);
    if (def) usedIds.add(def.id);
    return def;
  }
  function resolveBaseKeyForItem(item) {
    if (!item?.baseName || !item.itemTier) return null;
    const candidates = [
      "Helm",
      "Armor",
      "Gloves",
      "Boots",
      "Belt",
      "Amulet",
      "Ring",
      "Shield",
      "OffHand",
      "MainHand",
      "MainHand2H",
      "MainHand2HBow",
      "MainHandWand",
      "MainHandHybrid",
      "MainHandHybridStr",
      "MainHand2HStaff"
    ];
    for (const k of candidates) {
      const bases = getBaseItemsForSlot(k);
      const row = bases?.[item.itemTier]?.find((b) => b.name === item.baseName);
      if (row) return k;
    }
    return null;
  }
  function getDroppableSlots(itemTier) {
    const slots = ["Helm", "Armor", "Gloves", "Boots", "Belt", "Amulet", "Ring"];
    slots.push("MainHand");
    slots.push("TwoHand");
    slots.push("OffHand");
    return slots;
  }
  function resolveSlotForDrop(slot, rng) {
    if (slot === "OffHand") {
      return rng() < 0.5 ? "Shield" : "OffHand";
    }
    if (slot === "TwoHand") {
      const r = rng();
      if (r < 1 / 3) return "MainHand2H";
      if (r < 2 / 3) return "MainHand2HStaff";
      return "MainHand2HBow";
    }
    if (slot === "MainHand") {
      const r = rng();
      if (r < 1 / 3) return "MainHand";
      if (r < 2 / 3) return "MainHandWand";
      return rng() < 0.5 ? "MainHandHybrid" : "MainHandHybridStr";
    }
    return slot;
  }
  function generateOneItem(monsterLevel, monsterTier, rng, slotOverride = null, baseKeyOverride = null, dropModifiers = {}) {
    const itemTier = getItemTierByMonsterLevel(monsterLevel);
    const slots = getDroppableSlots(itemTier);
    const slot = slotOverride != null ? slotOverride : pickRandom(slots, rng);
    const baseKey = baseKeyOverride != null ? baseKeyOverride : resolveSlotForDrop(slot, rng);
    const bases = getBaseItemsForSlot(baseKey === "Shield" ? "Shield" : baseKey);
    if (!bases || !bases[itemTier]) return null;
    const tierBases = bases[itemTier];
    const eligibleBases = tierBases.filter((b) => b.levelReq <= monsterLevel);
    const pool = eligibleBases.length ? eligibleBases : tierBases;
    const baseDef = pickRandom(pool, rng);
    if (!baseDef) return null;
    const resolvedSlot = baseKey === "Shield" ? "OffHand" : slot;
    let quality = QUALITY_NORMAL;
    const mfAdjusted = monsterTier === "boss" ? applyMagicFindToQualityWeights(QUALITY_BOSS_NORMAL, QUALITY_BOSS_MAGIC, QUALITY_BOSS_RARE, dropModifiers.magicFindPct) : monsterTier === "shop" ? applyMagicFindToQualityWeights(QUALITY_SHOP_NORMAL, QUALITY_SHOP_MAGIC, QUALITY_SHOP_RARE, dropModifiers.magicFindPct) : monsterTier === "elite" ? applyMagicFindToQualityWeights(QUALITY_ELITE_NORMAL, QUALITY_ELITE_MAGIC, QUALITY_ELITE_RARE, dropModifiers.magicFindPct) : applyMagicFindToQualityWeights(QUALITY_NORMAL_CHANCE, QUALITY_MAGIC_CHANCE, QUALITY_RARE_CHANCE, dropModifiers.magicFindPct);
    if (monsterTier === "boss") {
      const q = rng();
      if (q < mfAdjusted.rare) quality = QUALITY_RARE;
      else if (q < mfAdjusted.rare + mfAdjusted.magic) quality = QUALITY_MAGIC;
      else quality = QUALITY_NORMAL;
    } else if (monsterTier === "shop") {
      const q = rng();
      if (q < mfAdjusted.rare) quality = QUALITY_RARE;
      else if (q < mfAdjusted.rare + mfAdjusted.magic) quality = QUALITY_MAGIC;
      else quality = QUALITY_NORMAL;
    } else if (monsterTier === "elite") {
      const q = rng();
      if (q < mfAdjusted.rare) quality = QUALITY_RARE;
      else if (q < mfAdjusted.rare + mfAdjusted.magic) quality = QUALITY_MAGIC;
      else quality = QUALITY_NORMAL;
    } else {
      const q = rng();
      if (q < mfAdjusted.rare) quality = QUALITY_RARE;
      else if (q < mfAdjusted.rare + mfAdjusted.magic) quality = QUALITY_MAGIC;
      else quality = QUALITY_NORMAL;
    }
    const noBaseStatSlots = ["Amulet", "Ring"];
    if (noBaseStatSlots.includes(resolvedSlot) && quality === QUALITY_NORMAL) {
      quality = QUALITY_MAGIC;
    }
    const item = {
      id: `item-${Date.now()}-${Math.floor(rng() * 1e5)}`,
      slot: resolvedSlot,
      baseName: baseDef.name,
      itemTier,
      quality,
      levelReq: baseDef.levelReq,
      strReq: baseDef.str || 0,
      agiReq: baseDef.agi || 0,
      intReq: baseDef.int || 0,
      spiReq: baseDef.spi || 0,
      armor: 0,
      resistance: 0,
      physAtk: 0,
      spellPower: 0,
      prefixes: [],
      suffixes: [],
      epithet: null
    };
    const rollBaseStat = (arr) => {
      if (Array.isArray(arr)) {
        const [a, b] = arr;
        return randomInRange(a, b, rng);
      }
      return arr || 0;
    };
    const armorSlots = ["Helm", "Armor", "Gloves", "Boots", "Belt"];
    if (armorSlots.includes(resolvedSlot) && baseDef.armorResistTotal) {
      const [tMin, tMax] = baseDef.armorResistTotal;
      const total = randomInRange(tMin, tMax, rng);
      const armor = total >= 2 ? randomInRange(1, total - 1, rng) : 1;
      item.armor = armor;
      item.resistance = total - armor;
    } else {
      item.armor = rollBaseStat(baseDef.armor);
      item.resistance = rollBaseStat(baseDef.resistance);
    }
    item._armorBase = item.armor;
    item._resBase = item.resistance;
    item._armorFlatAffix = 0;
    item._resFlatAffix = 0;
    if (baseKey === "Shield" && baseDef.blockPct != null) {
      const bp = baseDef.blockPct;
      item.blockPct = Array.isArray(bp) ? randomInRange(bp[0], bp[1], rng) : Number(bp) || 0;
    }
    const isWeaponBase = ["MainHand", "MainHand2H", "MainHand2HBow", "MainHandWand", "MainHandHybrid", "MainHandHybridStr", "MainHand2HStaff"].includes(baseKey);
    const physAtkRange = isWeaponBase && Array.isArray(baseDef.physAtk) ? rollWeaponDamageRange(baseDef.physAtk, rng) : null;
    if (physAtkRange) {
      item.physAtkMin = physAtkRange.min;
      item.physAtkMax = physAtkRange.max;
    } else {
      item.physAtk = rollBaseStat(baseDef.physAtk);
    }
    const spellPowerRange = isWeaponBase && Array.isArray(baseDef.spellPower) ? rollWeaponDamageRange(baseDef.spellPower, rng) : null;
    if (spellPowerRange) {
      item.spellPowerMin = spellPowerRange.min;
      item.spellPowerMax = spellPowerRange.max;
    } else {
      item.spellPower = rollBaseStat(baseDef.spellPower);
    }
    const allowedAffixes = getMergedAffixPool(itemTier, baseKey, baseDef, resolvedSlot);
    if (quality === QUALITY_MAGIC) {
      const count = rng() < 0.5 ? 1 : 2;
      const usedIds = /* @__PURE__ */ new Set();
      const prefixes = allowedAffixes.filter((a) => a.type === "prefix");
      const suffixes = allowedAffixes.filter((a) => a.type === "suffix");
      if (count >= 1) {
        const p = pickAffixNoDup(allowedAffixes, "prefix", usedIds, rng);
        if (p) item.prefixes.push(makeAffixEntry(p, quality, rng));
      }
      if (count >= 2) {
        const s = pickAffixNoDup(allowedAffixes, "suffix", usedIds, rng);
        if (s) item.suffixes.push(makeAffixEntry(s, quality, rng));
      }
    } else if (quality === QUALITY_RARE) {
      const count = 3 + Math.floor(rng() * 3);
      const usedIds = /* @__PURE__ */ new Set();
      const numPrefix = Math.min(Math.ceil(count / 2), 3);
      const numSuffix = count - numPrefix;
      for (let i = 0; i < numPrefix; i++) {
        const p = pickAffixNoDup(allowedAffixes, "prefix", usedIds, rng);
        if (p) item.prefixes.push(makeAffixEntry(p, quality, rng));
      }
      for (let i = 0; i < numSuffix; i++) {
        const s = pickAffixNoDup(allowedAffixes, "suffix", usedIds, rng);
        if (s) item.suffixes.push(makeAffixEntry(s, quality, rng));
      }
      item.epithet = pickRandom(EPITHET_POOL, rng);
    }
    for (const p of item.prefixes) {
      applyAffixToItem(item, p);
    }
    for (const s of item.suffixes) {
      applyAffixToItem(item, s);
    }
    finalizeItemDefenseStats(item);
    return item;
  }
  function finalizeItemDefenseStats(item) {
    if (item._armorBase == null) return;
    const ab = item._armorBase + (item._armorFlatAffix || 0);
    const rb = item._resBase + (item._resFlatAffix || 0);
    const ap = (item.armorPct || 0) / 100;
    const rp = (item.resistancePct || 0) / 100;
    item.armor = Math.floor(ab * (1 + ap));
    item.resistance = Math.floor(rb * (1 + rp));
  }
  function applyAffixToItem(item, affix) {
    const stat = affix.stat;
    const val = affix.value;
    if (WEAPON_AFFIX_STATS.has(stat)) return;
    if (stat === "armor") item._armorFlatAffix = (item._armorFlatAffix || 0) + val;
    else if (stat === "resistance") item._resFlatAffix = (item._resFlatAffix || 0) + val;
    else if (stat === "strength") item.strBonus = (item.strBonus || 0) + val;
    else if (stat === "agility") item.agiBonus = (item.agiBonus || 0) + val;
    else if (stat === "intellect") item.intBonus = (item.intBonus || 0) + val;
    else if (stat === "stamina") item.staBonus = (item.staBonus || 0) + val;
    else if (stat === "spirit") item.spiBonus = (item.spiBonus || 0) + val;
    else if (stat === "physCritPct") item.physCritPct = (item.physCritPct || 0) + val;
    else if (stat === "physCritDmgPct") item.physCritDmgPct = (item.physCritDmgPct || 0) + val;
    else if (stat === "spellCritPct") item.spellCritPct = (item.spellCritPct || 0) + val;
    else if (stat === "spellCritDmgPct") item.spellCritDmgPct = (item.spellCritDmgPct || 0) + val;
    else if (stat === "hitPct") item.hitPct = (item.hitPct || 0) + val;
    else if (stat === "dodgePct") item.dodgePct = (item.dodgePct || 0) + val;
    else if (stat === "manaRegen") item.manaRegen = (item.manaRegen || 0) + val;
    else if (stat === "hpRegen") item.hpRegen = (item.hpRegen || 0) + val;
    else if (stat === "goldFindPct") item.goldFindPct = (item.goldFindPct || 0) + val;
    else if (stat === "magicFindPct") item.magicFindPct = (item.magicFindPct || 0) + val;
    else if (stat === "physDrPct") item.physDrPct = (item.physDrPct || 0) + val;
    else if (stat === "armorPct") item.armorPct = (item.armorPct || 0) + val;
    else if (stat === "resistancePct") item.resistancePct = (item.resistancePct || 0) + val;
    else if (stat === "maxHpFlat") item.maxHpFlat = (item.maxHpFlat || 0) + val;
    else if (stat === "lifeOnKill") item.lifeOnKill = (item.lifeOnKill || 0) + val;
    else if (stat === "thorns") item.thorns = (item.thorns || 0) + val;
    else if (stat === "blockPct") item.blockPct = (item.blockPct || 0) + val;
    else if (stat === "blockDrPct") item.blockDrPct = (item.blockDrPct || 0) + val;
    else if (stat === "blockCounter") item.blockCounter = (item.blockCounter || 0) + val;
    else if (stat === "rageGenPct") item.rageGenPct = (item.rageGenPct || 0) + val;
    else if (stat === "maxHpPct") item.maxHpPct = (item.maxHpPct || 0) + val;
    else if (stat === "maxManaPct") item.maxManaPct = (item.maxManaPct || 0) + val;
    else if (stat === "spellPowerFlat") item.spellPower = (item.spellPower || 0) + val;
    else if (stat === "orbBalanced") {
      const half = Math.floor(val / 2);
      item._armorFlatAffix = (item._armorFlatAffix || 0) + half;
      item._resFlatAffix = (item._resFlatAffix || 0) + (val - half);
    } else if (stat === "allPrimary") {
      item.strBonus = (item.strBonus || 0) + val;
      item.agiBonus = (item.agiBonus || 0) + val;
      item.intBonus = (item.intBonus || 0) + val;
      item.staBonus = (item.staBonus || 0) + val;
      item.spiBonus = (item.spiBonus || 0) + val;
    } else if (stat === "rageOnKill") item.rageOnKill = (item.rageOnKill || 0) + val;
    else if (stat === "doubleStrikePct") item.doubleStrikePct = (item.doubleStrikePct || 0) + val;
    else if (stat === "physAtk") item.physAtk = (item.physAtk || 0) + val;
  }
  function generateEquipmentDrop(monsters, rng = Math.random, dropModifiers = {}) {
    if (!monsters || !monsters.length) return [];
    const hasBoss = monsters.some((m) => m.tier === "boss");
    const hasElite = monsters.some((m) => m.tier === "elite");
    const maxLevel = Math.max(...monsters.map((m) => m.level ?? 1), 1);
    let baseChance = DROP_BASE_CHANCE;
    if (hasBoss) baseChance *= DROP_BOSS_MULT;
    else if (hasElite) baseChance *= DROP_ELITE_MULT;
    const drops = [];
    const rollDrop = (monster) => {
      if (rng() < baseChance) {
        const item = generateOneItem(monster.level ?? 1, monster.tier ?? "normal", rng, null, null, dropModifiers);
        if (item) drops.push(item);
      }
    };
    for (const m of monsters) {
      rollDrop(m);
    }
    if (hasBoss && !drops.some((d) => d.quality === QUALITY_MAGIC || d.quality === QUALITY_RARE || d.quality === QUALITY_UNIQUE)) {
      const bossMonster = monsters.find((m) => m.tier === "boss") || monsters[0];
      const guaranteed = generateOneItem(bossMonster.level ?? 1, "boss", rng, null, null, dropModifiers);
      if (guaranteed) {
        if (guaranteed.quality === QUALITY_NORMAL) {
          guaranteed.quality = QUALITY_MAGIC;
          const baseKeyG = resolveBaseKeyForItem(guaranteed) ?? "MainHand";
          const basesG = getBaseItemsForSlot(baseKeyG);
          const tierG = guaranteed.itemTier;
          const baseRowG = basesG?.[tierG]?.find((b) => b.name === guaranteed.baseName) ?? {};
          const allowedAffixes = getMergedAffixPool(tierG, baseKeyG, baseRowG, guaranteed.slot || "MainHand");
          const usedIds = /* @__PURE__ */ new Set();
          const p = pickAffixNoDup(allowedAffixes, "prefix", usedIds, rng);
          if (p) {
            guaranteed.prefixes = [makeAffixEntry(p, QUALITY_MAGIC, rng)];
            applyAffixToItem(guaranteed, guaranteed.prefixes[0]);
            finalizeItemDefenseStats(guaranteed);
          }
        }
        drops.push(guaranteed);
      }
    }
    return drops;
  }
  var MAINHAND_SLOT = "MainHand";
  var TWOHAND_SLOT = "TwoHand";
  var WEAPON_SLOTS = [MAINHAND_SLOT, TWOHAND_SLOT];
  function sumWeaponAffixStatsFromItem(item) {
    const o = {
      physWeaponFlat: 0,
      physCritPct: 0,
      physCritDmgPct: 0,
      lifeStealPct: 0,
      lifeOnHit: 0,
      addedMagicDmgMin: 0,
      addedMagicDmgMax: 0,
      armorPen: 0,
      physDmgPct: 0,
      ignoreArmorPct: 0,
      spellWeaponFlat: 0,
      spellCritPct: 0,
      spellCritDmgPct: 0,
      manaRefluxPct: 0,
      manaOnCast: 0,
      arcaneFollowupMin: 0,
      arcaneFollowupMax: 0,
      spellPen: 0,
      spellDmgPct: 0,
      ignoreResistPct: 0,
      hitPct: 0,
      dodgePct: 0,
      manaRegen: 0,
      hpRegen: 0,
      goldFindPct: 0,
      magicFindPct: 0
    };
    if (!item) return o;
    for (const a of [...item.prefixes || [], ...item.suffixes || []]) {
      const st = a.stat;
      if (!WEAPON_AFFIX_STATS.has(st)) continue;
      if (st === "addedMagicDmg") {
        o.addedMagicDmgMin += a.min ?? 0;
        o.addedMagicDmgMax += a.max ?? 0;
      } else if (st === "arcaneFollowup") {
        o.arcaneFollowupMin += a.min ?? 0;
        o.arcaneFollowupMax += a.max ?? 0;
      } else if (o[st] !== void 0) {
        o[st] += a.value ?? 0;
      }
    }
    return o;
  }
  function mergeWeaponAffixTotals(dst, src) {
    for (const k of Object.keys(dst)) {
      dst[k] += src[k] || 0;
    }
  }
  function getEquipmentBonuses(equipment) {
    const out = {
      armor: 0,
      resistance: 0,
      physAtk: 0,
      spellPower: 0,
      physAtkMin: null,
      physAtkMax: null,
      spellPowerMin: null,
      spellPowerMax: null,
      strength: 0,
      agility: 0,
      intellect: 0,
      stamina: 0,
      spirit: 0,
      physWeaponFlat: 0,
      physCritPct: 0,
      physCritDmgPct: 0,
      lifeStealPct: 0,
      lifeOnHit: 0,
      addedMagicDmgMin: 0,
      addedMagicDmgMax: 0,
      armorPen: 0,
      physDmgPct: 0,
      ignoreArmorPct: 0,
      spellWeaponFlat: 0,
      spellCritPct: 0,
      spellCritDmgPct: 0,
      manaRefluxPct: 0,
      manaOnCast: 0,
      arcaneFollowupMin: 0,
      arcaneFollowupMax: 0,
      spellPen: 0,
      spellDmgPct: 0,
      ignoreResistPct: 0,
      hitPct: 0,
      dodgePct: 0,
      manaRegen: 0,
      hpRegen: 0,
      goldFindPct: 0,
      magicFindPct: 0,
      physDrPct: 0,
      maxHpFlat: 0,
      lifeOnKill: 0,
      thorns: 0,
      blockPct: 0,
      blockDrPct: 0,
      blockCounter: 0,
      rageGenPct: 0,
      maxHpPct: 0,
      maxManaPct: 0,
      rageOnKill: 0,
      doubleStrikePct: 0
    };
    if (!equipment || typeof equipment !== "object") return out;
    for (const [slot, item] of Object.entries(equipment)) {
      if (!item) continue;
      out.armor += item.armor || 0;
      out.resistance += item.resistance || 0;
      out.strength += item.strBonus || 0;
      out.agility += item.agiBonus || 0;
      out.intellect += item.intBonus || 0;
      out.stamina += item.staBonus || 0;
      out.spirit += item.spiBonus || 0;
      out.physCritPct += item.physCritPct || 0;
      out.physCritDmgPct += item.physCritDmgPct || 0;
      out.spellCritPct += item.spellCritPct || 0;
      out.spellCritDmgPct += item.spellCritDmgPct || 0;
      out.hitPct += item.hitPct || 0;
      out.dodgePct += item.dodgePct || 0;
      out.manaRegen += item.manaRegen || 0;
      out.hpRegen += item.hpRegen || 0;
      out.goldFindPct += item.goldFindPct || 0;
      out.magicFindPct += item.magicFindPct || 0;
      out.physDrPct += item.physDrPct || 0;
      out.maxHpFlat += item.maxHpFlat || 0;
      out.lifeOnKill += item.lifeOnKill || 0;
      out.thorns += item.thorns || 0;
      out.blockPct += item.blockPct || 0;
      out.blockDrPct += item.blockDrPct || 0;
      out.blockCounter += item.blockCounter || 0;
      out.rageGenPct += item.rageGenPct || 0;
      out.maxHpPct += item.maxHpPct || 0;
      out.maxManaPct += item.maxManaPct || 0;
      out.rageOnKill += item.rageOnKill || 0;
      out.doubleStrikePct += item.doubleStrikePct || 0;
      if (WEAPON_SLOTS.includes(slot)) {
        mergeWeaponAffixTotals(out, sumWeaponAffixStatsFromItem(item));
        if (item.physAtkMin != null && item.physAtkMax != null) {
          out.physAtkMin = item.physAtkMin;
          out.physAtkMax = item.physAtkMax;
        } else {
          out.physAtk += item.physAtk || 0;
        }
        if (item.spellPowerMin != null && item.spellPowerMax != null) {
          out.spellPowerMin = item.spellPowerMin;
          out.spellPowerMax = item.spellPowerMax;
        } else {
          out.spellPower += item.spellPower || 0;
        }
      } else {
        out.physAtk += item.physAtk || 0;
        out.spellPower += item.spellPower || 0;
      }
    }
    return out;
  }

  // frontend/src/game/playerStatsWinRate.js
  function normalizeBattleOutcome(raw, goldGained = 0) {
    const s = raw != null ? String(raw) : "";
    if (s === "victory" || s === "defeat" || s === "draw") return s;
    if (Math.max(0, Math.floor(Number(goldGained) || 0)) > 0) return "victory";
    return void 0;
  }

  // frontend/src/game/playerStatistics.js
  var MAX_BATTLE_TIMELINE_ENTRIES = 250;
  function createEmptyPlayerStats() {
    return {
      combatActionSteps: 0,
      restSteps: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      displayScaleN: 100,
      battleCount: 0,
      victoryCount: 0,
      battleTimeline: [],
      damageByHero: {},
      injuryByHero: {}
    };
  }
  function normalizeSkillById(raw) {
    if (!raw || typeof raw !== "object") return void 0;
    const out = {};
    for (const [sid, val] of Object.entries(
      /** @type {Record<string, unknown>} */
      raw
    )) {
      const n = Math.max(0, Math.floor(Number(val) || 0));
      if (n > 0) out[String(sid)] = n;
    }
    return Object.keys(out).length ? out : void 0;
  }
  function mergeSkillByIdMaps(a, b) {
    if (!a && !b) return void 0;
    const o = { ...a || {} };
    for (const [k, v] of Object.entries(b || {})) {
      const add = Math.max(0, Math.floor(Number(v) || 0));
      o[String(k)] = (o[String(k)] || 0) + add;
    }
    for (const k of Object.keys(o)) {
      if (o[k] <= 0) delete o[k];
    }
    return Object.keys(o).length ? o : void 0;
  }
  function normalizeHeroDamageBook(raw) {
    if (!raw || typeof raw !== "object") return {};
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!v || typeof v !== "object") continue;
      const vo = (
        /** @type {Record<string, unknown>} */
        v
      );
      const basic = Math.max(0, Math.floor(Number(vo.basic) || 0));
      const skill = Math.max(0, Math.floor(Number(vo.skill) || 0));
      const skillById = normalizeSkillById(vo.skillById);
      const row = { basic, skill };
      if (skillById) row.skillById = skillById;
      out[String(k)] = row;
    }
    return out;
  }
  function normalizeInjuryByHero(raw) {
    if (!raw || typeof raw !== "object") return {};
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!v || typeof v !== "object") continue;
      const vo = (
        /** @type {Record<string, unknown>} */
        v
      );
      const basic = Math.max(0, Math.floor(Number(vo.basic) || 0));
      const basicPhysical = Math.max(0, Math.floor(Number(vo.basicPhysical) || 0));
      const basicMagic = Math.max(0, Math.floor(Number(vo.basicMagic) || 0));
      const skill = Math.max(0, Math.floor(Number(vo.skill) || 0));
      const skillById = normalizeSkillById(vo.skillById);
      const row = { basic, skill };
      if (basicPhysical > 0 || basicMagic > 0) {
        row.basicPhysical = basicPhysical;
        row.basicMagic = basicMagic;
      }
      if (skillById) row.skillById = skillById;
      out[String(k)] = row;
    }
    return out;
  }
  function mergeInjuryByHeroBooks(baseRaw, deltaRaw) {
    const out = normalizeInjuryByHero(baseRaw);
    for (const [id, v] of Object.entries(normalizeInjuryByHero(deltaRaw))) {
      const p = out[id] || { basic: 0, skill: 0 };
      const mergedById = mergeSkillByIdMaps(p.skillById, v.skillById);
      const basicPhysical = (p.basicPhysical || 0) + (v.basicPhysical || 0);
      const basicMagic = (p.basicMagic || 0) + (v.basicMagic || 0);
      const row = {
        basic: p.basic + v.basic,
        skill: p.skill + v.skill
      };
      if (basicPhysical > 0 || basicMagic > 0) {
        row.basicPhysical = basicPhysical;
        row.basicMagic = basicMagic;
      }
      if (mergedById) row.skillById = mergedById;
      out[id] = row;
    }
    return out;
  }
  function mergeHeroDamageBooks(baseRaw, deltaRaw) {
    const out = normalizeHeroDamageBook(baseRaw);
    for (const [id, v] of Object.entries(normalizeHeroDamageBook(deltaRaw))) {
      const p = out[id] || { basic: 0, skill: 0 };
      const mergedById = mergeSkillByIdMaps(p.skillById, v.skillById);
      const row = {
        basic: p.basic + v.basic,
        skill: p.skill + v.skill
      };
      if (mergedById) row.skillById = mergedById;
      out[id] = row;
    }
    return out;
  }
  function normalizeBattleTimeline(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const e of raw) {
      if (!e || typeof e !== "object") continue;
      const endedAtMs = Number(
        /** @type {{ endedAtMs?: unknown }} */
        e.endedAtMs
      );
      if (!Number.isFinite(endedAtMs)) continue;
      const eo = (
        /** @type {{ steps?: unknown, rounds?: unknown }} */
        e
      );
      const stepsRaw = eo.steps ?? eo.rounds;
      const steps = Math.max(0, Math.floor(Number(stepsRaw) || 0));
      const goldGained = Math.max(0, Math.floor(Number(
        /** @type {{ goldGained?: unknown }} */
        e.goldGained
      ) || 0));
      const xpGained = Math.max(0, Math.floor(Number(
        /** @type {{ xpGained?: unknown }} */
        e.xpGained
      ) || 0));
      const outcome = normalizeBattleOutcome(
        /** @type {{ outcome?: unknown }} */
        e.outcome,
        goldGained
      );
      const row = { endedAtMs, steps, goldGained, xpGained };
      if (outcome) row.outcome = outcome;
      out.push(row);
    }
    while (out.length > MAX_BATTLE_TIMELINE_ENTRIES) out.shift();
    return out;
  }
  function explorationSteps(stats) {
    if (!stats || typeof stats !== "object") return 0;
    return Math.max(0, (stats.combatActionSteps || 0) + (stats.restSteps || 0));
  }
  function applyBattleToPlayerStats(stats, battle) {
    const base = stats && typeof stats === "object" ? { ...createEmptyPlayerStats(), ...stats } : createEmptyPlayerStats();
    const damageByHero = mergeHeroDamageBooks(base.damageByHero, battle.damageByHeroDelta ?? {});
    const injuryByHero = mergeInjuryByHeroBooks(base.injuryByHero, battle.injuryByHeroDelta ?? {});
    const prevTimeline = normalizeBattleTimeline(base.battleTimeline);
    const endedRaw = battle.endedAtMs;
    const endedAtMs = Number.isFinite(Number(endedRaw)) ? Number(endedRaw) : Date.now();
    const goldGained = Math.max(0, Math.floor(Number(battle.goldGained) || 0));
    const outcome = normalizeBattleOutcome(battle.outcome, goldGained);
    const stepsRaw = battle.steps ?? battle.combatActionSteps;
    const entry = {
      endedAtMs,
      steps: Math.max(0, Math.floor(Number(stepsRaw) || 0)),
      goldGained,
      xpGained: Math.max(0, Math.floor(Number(battle.xpGained) || 0))
    };
    if (outcome) entry.outcome = outcome;
    const battleTimeline = [...prevTimeline, entry];
    while (battleTimeline.length > MAX_BATTLE_TIMELINE_ENTRIES) battleTimeline.shift();
    const prevBattleCount = Math.max(0, Math.floor(Number(base.battleCount) || 0));
    const prevVictoryCount = Math.max(0, Math.floor(Number(base.victoryCount) || 0));
    const isVictory = outcome === "victory";
    return {
      ...base,
      combatActionSteps: base.combatActionSteps + (battle.combatActionSteps || 0),
      cumulativeGold: base.cumulativeGold + (battle.goldGained || 0),
      cumulativeXp: base.cumulativeXp + (battle.xpGained || 0),
      battleCount: prevBattleCount + 1,
      victoryCount: prevVictoryCount + (isVictory ? 1 : 0),
      battleTimeline,
      damageByHero,
      injuryByHero
    };
  }
  function applyRestToPlayerStats(stats, restStepsAdded) {
    const base = stats && typeof stats === "object" ? { ...createEmptyPlayerStats(), ...stats } : createEmptyPlayerStats();
    const add = Number(restStepsAdded);
    return {
      ...base,
      restSteps: base.restSteps + (Number.isFinite(add) && add > 0 ? Math.floor(add) : 0)
    };
  }
  function normalizePlayerStats(raw) {
    const empty = createEmptyPlayerStats();
    if (!raw || typeof raw !== "object") return empty;
    let displayScaleN = Number(raw.displayScaleN);
    if (displayScaleN !== 1 && displayScaleN !== 10 && displayScaleN !== 100) displayScaleN = 100;
    const battleTimeline = normalizeBattleTimeline(raw.battleTimeline);
    let battleCount = Math.max(0, Math.floor(Number(raw.battleCount) || 0));
    let victoryCount = Math.max(0, Math.floor(Number(raw.victoryCount) || 0));
    if (battleCount <= 0 && battleTimeline.length > 0) {
      battleCount = battleTimeline.length;
      victoryCount = battleTimeline.filter((e) => e.outcome === "victory").length;
    }
    if (victoryCount > battleCount) victoryCount = battleCount;
    return {
      ...empty,
      ...raw,
      combatActionSteps: Math.max(0, Math.floor(Number(raw.combatActionSteps) || 0)),
      restSteps: Math.max(0, Math.floor(Number(raw.restSteps) || 0)),
      cumulativeGold: Math.max(0, Math.floor(Number(raw.cumulativeGold) || 0)),
      cumulativeXp: Math.max(0, Math.floor(Number(raw.cumulativeXp) || 0)),
      displayScaleN,
      battleCount,
      victoryCount,
      battleTimeline,
      damageByHero: normalizeHeroDamageBook(raw.damageByHero),
      injuryByHero: normalizeInjuryByHero(raw.injuryByHero)
    };
  }

  // frontend/src/game/leaderboardTrack.js
  var LEADERBOARD_WINDOW_STEPS = 1e3;
  function createEmptyLeaderboardTrack() {
    return { lifetimeSteps: 0, segments: [] };
  }
  function normalizeLeaderboardTrack(raw) {
    const empty = createEmptyLeaderboardTrack();
    if (!raw || typeof raw !== "object") return empty;
    const o = (
      /** @type {Record<string, unknown>} */
      raw
    );
    const segments = [];
    if (Array.isArray(o.segments)) {
      for (const seg of o.segments) {
        if (!seg || typeof seg !== "object") continue;
        const s = (
          /** @type {Record<string, unknown>} */
          seg
        );
        const steps = Math.max(0, Math.floor(Number(s.steps) || 0));
        if (steps <= 0) continue;
        segments.push({
          steps,
          gold: Math.max(0, Number(s.gold) || 0),
          xp: Math.max(0, Number(s.xp) || 0)
        });
      }
    }
    let lifetimeSteps = Math.max(0, Math.floor(Number(o.lifetimeSteps) || 0));
    if (lifetimeSteps <= 0 && segments.length > 0) {
      lifetimeSteps = segments.reduce((sum, seg) => sum + seg.steps, 0);
    }
    return trimWindow({ lifetimeSteps, segments });
  }
  function appendLeaderboardTrackSegment(track, delta) {
    const base = normalizeLeaderboardTrack(track);
    const steps = Math.max(0, Math.floor(Number(delta?.steps) || 0));
    if (steps <= 0) return base;
    const segments = [
      ...base.segments,
      {
        steps,
        gold: Math.max(0, Number(delta?.gold) || 0),
        xp: Math.max(0, Number(delta?.xp) || 0)
      }
    ];
    return trimWindow({
      lifetimeSteps: base.lifetimeSteps + steps,
      segments
    });
  }
  function applyBattleToLeaderboardTrack(track, battle) {
    return appendLeaderboardTrackSegment(track, {
      steps: battle?.combatActionSteps,
      gold: battle?.goldGained,
      xp: battle?.xpGained
    });
  }
  function applyRestToLeaderboardTrack(track, restStepsAdded) {
    return appendLeaderboardTrackSegment(track, {
      steps: restStepsAdded,
      gold: 0,
      xp: 0
    });
  }
  function migrateLeaderboardTrackFromPlayerStats(track, playerStats) {
    const normalized = normalizeLeaderboardTrack(track);
    if (normalized.lifetimeSteps > 0) return normalized;
    const steps = explorationSteps(playerStats);
    if (steps <= 0) return normalized;
    return appendLeaderboardTrackSegment(createEmptyLeaderboardTrack(), {
      steps,
      gold: playerStats?.cumulativeGold,
      xp: playerStats?.cumulativeXp
    });
  }
  function trimWindow(track) {
    const segments = track.segments.map((seg) => ({ ...seg }));
    let windowSteps = segments.reduce((sum, seg) => sum + seg.steps, 0);
    while (windowSteps > LEADERBOARD_WINDOW_STEPS && segments.length > 0) {
      const first = segments[0];
      const excess = windowSteps - LEADERBOARD_WINDOW_STEPS;
      if (first.steps <= excess) {
        windowSteps -= first.steps;
        segments.shift();
        continue;
      }
      const keep = first.steps - excess;
      const ratio = keep / first.steps;
      segments[0] = {
        steps: keep,
        gold: first.gold * ratio,
        xp: first.xp * ratio
      };
      windowSteps = LEADERBOARD_WINDOW_STEPS;
    }
    return {
      lifetimeSteps: Math.max(0, Math.floor(Number(track.lifetimeSteps) || 0)),
      segments
    };
  }

  // frontend/src/game/playerSave.js
  var LEGACY_SAVE_KEYS = [
    "teamName",
    "squad",
    "combatProgress",
    "playerGold",
    "playerInventory",
    "textIdlePlayerStats"
  ];
  function createEmptyPlayerSave() {
    return {
      teamName: "",
      squad: [],
      combatProgress: createInitialProgress(),
      gold: 0,
      inventory: [],
      playerStats: createEmptyPlayerStats(),
      leaderboardTrack: createEmptyLeaderboardTrack()
    };
  }
  function apiBase() {
    return false ? "/api" : "";
  }
  function authHeaders() {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }
  function normalizePlayerSave(raw) {
    const base = createEmptyPlayerSave();
    if (!raw || typeof raw !== "object") return base;
    const o = (
      /** @type {Record<string, unknown>} */
      raw
    );
    if (typeof o.teamName === "string") base.teamName = o.teamName;
    if (Array.isArray(o.squad)) base.squad = o.squad;
    if (o.combatProgress && typeof o.combatProgress === "object") {
      base.combatProgress = { ...base.combatProgress, .../** @type {object} */
      o.combatProgress };
    }
    const gold = Math.max(0, Math.floor(Number(o.gold) || 0));
    base.gold = Number.isNaN(gold) ? 0 : gold;
    if (Array.isArray(o.inventory)) base.inventory = o.inventory;
    if (o.playerStats && typeof o.playerStats === "object") {
      base.playerStats = normalizePlayerStats(o.playerStats);
    }
    if (o.leaderboardTrack && typeof o.leaderboardTrack === "object") {
      base.leaderboardTrack = normalizeLeaderboardTrack(o.leaderboardTrack);
    } else {
      base.leaderboardTrack = migrateLeaderboardTrackFromPlayerStats(
        createEmptyLeaderboardTrack(),
        base.playerStats
      );
    }
    if (o.pendingExpansionRecruit && typeof o.pendingExpansionRecruit === "object") {
      base.pendingExpansionRecruit = o.pendingExpansionRecruit;
    }
    if (o.combatState && typeof o.combatState === "object") {
      base.combatState = o.combatState;
    }
    return base;
  }
  function isSaveEmpty(save) {
    return !save.teamName && (!save.squad || save.squad.length === 0) && save.gold === 0 && (!save.inventory || save.inventory.length === 0);
  }
  function readLegacyLocalSave() {
    if (typeof localStorage === "undefined") return null;
    try {
      const teamName = localStorage.getItem("teamName") || "";
      const squadRaw = localStorage.getItem("squad");
      const squad = squadRaw ? JSON.parse(squadRaw) : [];
      const progressRaw = localStorage.getItem("combatProgress");
      const combatProgress = progressRaw ? JSON.parse(progressRaw) : createInitialProgress();
      const goldRaw = localStorage.getItem("playerGold");
      const gold = goldRaw != null ? Math.max(0, parseInt(goldRaw, 10) || 0) : 0;
      const invRaw = localStorage.getItem("playerInventory");
      const inventory = invRaw ? JSON.parse(invRaw) : [];
      const statsRaw = localStorage.getItem("textIdlePlayerStats");
      const playerStats = statsRaw ? normalizePlayerStats(JSON.parse(statsRaw)) : createEmptyPlayerStats();
      const hasLegacy = teamName || Array.isArray(squad) && squad.length > 0 || gold > 0 || Array.isArray(inventory) && inventory.length > 0 || statsRaw;
      if (!hasLegacy) return null;
      return normalizePlayerSave({ teamName, squad, combatProgress, gold, inventory, playerStats });
    } catch {
      return null;
    }
  }
  function clearLegacyLocalSaveKeys() {
    if (typeof localStorage === "undefined") return;
    for (const k of LEGACY_SAVE_KEYS) localStorage.removeItem(k);
  }
  var cache = null;
  var loaded = false;
  var loadPromise = null;
  var persistTimer = null;
  var memoryOnly = false;
  function getCache() {
    if (!cache) cache = createEmptyPlayerSave();
    return cache;
  }
  function buildPlayerPatchPayload() {
    const cache2 = getCache();
    const patch = {
      teamName: cache2.teamName,
      squad: cache2.squad,
      inventory: cache2.inventory ?? [],
      combatProgress: { currentMapId: cache2.combatProgress?.currentMapId },
      playerStats: { displayScaleN: cache2.playerStats?.displayScaleN ?? 100 }
    };
    if (cache2.pendingExpansionRecruit) {
      patch.pendingExpansionRecruit = cache2.pendingExpansionRecruit;
    } else {
      patch.pendingExpansionRecruit = null;
    }
    return patch;
  }
  async function ensurePlayerSaveLoaded(force = false) {
    if (memoryOnly) {
      if (!loaded) {
        cache = createEmptyPlayerSave();
        loaded = true;
      }
      return getCache();
    }
    if (loaded && !force) return getCache();
    if (loadPromise && !force) return loadPromise;
    loadPromise = (async () => {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        cache = createEmptyPlayerSave();
        loaded = true;
        return cache;
      }
      const res = await fetch(`${apiBase()}/save`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        cache = createEmptyPlayerSave();
        loaded = true;
        return cache;
      }
      if (!res.ok) {
        throw new Error("failed to load save");
      }
      const data = await res.json();
      cache = normalizePlayerSave(data);
      if (isSaveEmpty(cache)) {
        const legacy = readLegacyLocalSave();
        if (legacy) {
          cache = legacy;
          clearLegacyLocalSaveKeys();
          await flushPlayerSave();
        }
      } else {
        clearLegacyLocalSaveKeys();
      }
      loaded = true;
      return cache;
    })();
    try {
      return await loadPromise;
    } finally {
      if (loaded) loadPromise = null;
    }
  }
  function isSavePersistBlocked() {
    return typeof window !== "undefined" && window.__tiBlockSavePersist === true;
  }
  async function flushPlayerSave(options = {}) {
    if (memoryOnly || isSavePersistBlocked()) return;
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const empty = isSaveEmpty(getCache());
    const init = {
      method: empty ? "PUT" : "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(empty ? getCache() : buildPlayerPatchPayload())
    };
    if (options.keepalive) init.keepalive = true;
    const url = empty ? `${apiBase()}/save` : `${apiBase()}/save/player`;
    const res = await fetch(url, init);
    if (res.status === 401) {
      localStorage.removeItem("token");
      throw new Error("unauthorized");
    }
    if (!res.ok && res.status !== 204) {
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      let msg = typeof data.error === "string" ? data.error : "failed to save";
      if (msg === "failed to save" && res.status === 409) {
        msg = "team name already taken";
      }
      const err = new Error(msg)(err).status = res.status;
      throw err;
    }
  }
  function flushPlayerSaveOnPageHide() {
    if (memoryOnly || isSavePersistBlocked() || !persistTimer) return;
    flushPlayerSave({ keepalive: true }).catch(() => {
    });
  }
  if (typeof window !== "undefined") {
    window.__reloadPlayerSave = () => ensurePlayerSaveLoaded(true);
    window.__flushPlayerSave = () => flushPlayerSave();
    window.__tiCancelSavePersist = () => {
      if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
      }
    };
    window.addEventListener("pagehide", flushPlayerSaveOnPageHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushPlayerSaveOnPageHide();
    });
  }

  // frontend/src/game/damageUtils.js
  var PHYS_ATK_UNARMED_MIN = 1;
  var PHYS_ATK_UNARMED_MAX = 4;
  var SPELL_UNARMED_MIN = 1;
  var SPELL_UNARMED_MAX = 4;
  var PHYS_MULTIPLIER_K = 0.2;
  var SPELL_MULTIPLIER_K = 0.2;
  var SPELL_BASIC_ATTACK_COEFF = 0.5;
  function randomInRange2(min, max, rng) {
    return min + Math.floor(rng() * (max - min + 1));
  }
  var UNARMED_ROLL_EXPECTED = 2.5;
  function getEffectivePhysAtk(actor, rng) {
    if (actor.side === "hero" && actor.physMultiplier != null && rng) {
      const weaponRoll = actor.physAtkWeaponMin != null && actor.physAtkWeaponMax != null ? randomInRange2(actor.physAtkWeaponMin, actor.physAtkWeaponMax, rng) : 0;
      const baseRoll = weaponRoll;
      const physAtkBonus = actor.physAtkBonus ?? 0;
      return Math.round(baseRoll * actor.physMultiplier) + physAtkBonus;
    }
    const physAtk = actor.physAtk ?? 0;
    if (physAtk <= 0) return 0;
    if (actor.side === "monster" && rng) {
      const baseRoll = randomInRange2(PHYS_ATK_UNARMED_MIN, PHYS_ATK_UNARMED_MAX, rng);
      return Math.round(baseRoll * physAtk / UNARMED_ROLL_EXPECTED);
    }
    return physAtk;
  }
  function getEffectiveSpellPowerBreakdown(actor, rng) {
    if (actor.side === "hero" && actor.spellMultiplier != null && rng) {
      const weaponRoll = actor.spellPowerWeaponMin != null && actor.spellPowerWeaponMax != null ? randomInRange2(actor.spellPowerWeaponMin, actor.spellPowerWeaponMax, rng) : 0;
      const weaponScaled = Math.round(weaponRoll * actor.spellMultiplier);
      const flatBonus = actor.spellPowerBonus ?? 0;
      return { total: weaponScaled + flatBonus, weaponScaled, flatBonus, weaponRoll };
    }
    const spellPower = actor.spellPower ?? 0;
    if (spellPower <= 0) {
      return { total: 0, weaponScaled: 0, flatBonus: 0, weaponRoll: 0 };
    }
    if (actor.side === "monster" && rng) {
      const weaponRoll = randomInRange2(SPELL_UNARMED_MIN, SPELL_UNARMED_MAX, rng);
      const total = Math.round(weaponRoll * spellPower / UNARMED_ROLL_EXPECTED);
      return { total, weaponScaled: total, flatBonus: 0, weaponRoll };
    }
    return { total: spellPower, weaponScaled: spellPower, flatBonus: 0, weaponRoll: 0 };
  }
  function getEffectiveSpellPower(actor, rng) {
    return getEffectiveSpellPowerBreakdown(actor, rng).total;
  }

  // frontend/src/game/warriorLevelSkills.js
  var WARRIOR_LEVEL_SKILLS = {
    5: [
      { id: "cleave", name: "\u987A\u5288\u65A9", spec: "\u6B66\u5668", rageCost: 20, cooldown: 0, coefficient: 0.7, targets: 2, effectDesc: "\u5BF9 2 \u4E2A\u76EE\u6807\u9020\u6210 0.7 \u500D\u7269\u7406\u4F24\u5BB3" },
      { id: "whirlwind", name: "\u65CB\u98CE\u65A9", spec: "\u72C2\u66B4", rageCost: 25, cooldown: 2, coefficient: 0.55, targets: -1, effectDesc: "\u5BF9\u6240\u6709\u654C\u4EBA\u9020\u6210 0.55 \u500D\u7269\u7406\u4F24\u5BB3\uFF0C2 \u56DE\u5408 CD" },
      {
        id: "defensive-stance",
        name: "\u9632\u5FA1\u59FF\u6001",
        spec: "\u9632\u62A4",
        rageCost: 10,
        cooldown: 4,
        damageReductionPct: 12,
        stanceDuration: 3,
        effectDesc: "\u81EA\u8EAB\u53D7\u5230\u4F24\u5BB3 -12%\uFF0C\u6301\u7EED 3 \u56DE\u5408\uFF0C4 \u56DE\u5408 CD"
      }
    ],
    10: [
      { id: "rend", name: "\u6495\u88C2", spec: "\u6B66\u5668", rageCost: 10, cooldown: 0, coefficient: 0.5, effectDesc: "0.5 \u500D\u4F24\u5BB3 + \u6D41\u8840 4 \u56DE\u5408" },
      { id: "raging-strike", name: "\u72C2\u6012\u6253\u51FB", spec: "\u72C2\u66B4", rageCost: 12, cooldown: 0, coefficient: 1.2, effectDesc: "1.2 \u500D\u7269\u7406\u4F24\u5BB3\uFF0C\u4F4E\u6D88\u8017\u586B\u5145" },
      { id: "shield-slam", name: "\u76FE\u724C\u731B\u51FB", spec: "\u9632\u62A4", rageCost: 20, cooldown: 1, coefficient: 1.2, effectDesc: "1.2 \u500D\u4F24\u5BB3\uFF0C\u9700\u76FE\u724C\uFF0C1 \u56DE\u5408 CD\uFF1B\u76EE\u6807\u6709\u7834\u7532\u65F6\u5FC5\u66B4\u51FB" }
    ],
    15: [
      { id: "thunder-clap", name: "\u96F7\u9706\u4E00\u51FB", spec: "\u6B66\u5668", rageCost: 20, cooldown: 2, coefficient: 0.45, targets: -1, effectDesc: "\u5BF9\u6240\u6709\u9020\u6210 0.45 \u500D\u4F24\u5BB3\uFF0C-25% \u654F\u6377 2 \u56DE\u5408" },
      { id: "slam", name: "\u731B\u51FB", spec: "\u72C2\u66B4", rageCost: 15, cooldown: 0, coefficient: 1.2, effectDesc: "1.2 \u500D\u7269\u7406\u4F24\u5BB3\uFF0C\u586B\u5145" },
      { id: "revenge", name: "\u590D\u4EC7", spec: "\u9632\u62A4", rageCost: 5, cooldown: 0, coefficient: 1.2, effectDesc: "1.2 \u500D\u4F24\u5BB3\uFF0C\u9AD8\u4EC7\u6068\uFF0C\u4EC5\u5728\u88AB\u51FB\u4E2D\u540E\u53EF\u7528" }
    ],
    20: [
      { id: "mortal-strike", name: "\u81F4\u6B7B\u6253\u51FB", spec: "\u6B66\u5668", rageCost: 30, cooldown: 1, coefficient: 1.6, effectDesc: "1.6 \u500D\u4F24\u5BB3\uFF0C\u66B4\u51FB\uFF1A-30% \u6CBB\u7597 2 \u56DE\u5408" },
      { id: "furious-blow", name: "\u72C2\u66B4\u4E4B\u51FB", spec: "\u72C2\u66B4", rageCost: 20, cooldown: 0, coefficient: 1.3, effectDesc: "1.3 \u500D\u7269\u7406\u4F24\u5BB3" },
      { id: "shield-block", name: "\u76FE\u724C\u683C\u6321", spec: "\u9632\u62A4", rageCost: 15, cooldown: 2, effectDesc: "\u4E0B\u6B21\u7269\u7406\u653B\u51FB -50% \u4F24\u5BB3\uFF0C\u9700\u76FE\u724C" }
    ],
    25: [
      { id: "execute", name: "\u65A9\u6740", spec: "\u6B66\u5668", rageCost: 20, cooldown: 0, coefficient: 2, effectDesc: "2.0 \u500D\u4F24\u5BB3\uFF0C\u4EC5\u5F53\u76EE\u6807 HP < 30% \u65F6\u53EF\u7528" },
      { id: "flurry", name: "\u4E71\u821E", spec: "\u72C2\u66B4", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u66B4\u51FB\u540E\uFF0C\u4E0B\u56DE\u5408 +15% \u4F24\u5BB3" },
      { id: "concussion-blow", name: "\u9707\u8361\u731B\u51FB", spec: "\u9632\u62A4", rageCost: 15, cooldown: 3, coefficient: 0.8, effectDesc: "0.8 \u500D\u4F24\u5BB3\uFF0C\u7729\u6655 1 \u56DE\u5408\uFF0C3 \u56DE\u5408 CD" }
    ],
    30: [
      { id: "sweeping-strikes", name: "\u6A2A\u626B\u653B\u51FB", spec: "\u6B66\u5668", rageCost: 30, cooldown: 3, effectDesc: "\u63A5\u4E0B\u6765 2 \u56DE\u5408\uFF1A\u5355\u4F53\u653B\u51FB\u989D\u5916\u547D\u4E2D 1 \u4E2A\u76EE\u6807\uFF0875%\uFF09" },
      { id: "bloodrage", name: "\u8840\u6027\u72C2\u66B4", spec: "\u72C2\u66B4", rageCost: 0, cooldown: 4, effectDesc: "\u6D88\u8017 10% \u6700\u5927 HP\uFF0C\u83B7\u5F97 25 \u6012\u6C14\uFF0C4 \u56DE\u5408 CD" },
      { id: "shield-wall", name: "\u76FE\u5899", spec: "\u9632\u62A4", rageCost: 30, cooldown: 5, effectDesc: "\u53D7\u5230\u4F24\u5BB3 -40% \u6301\u7EED 3 \u56DE\u5408\uFF0C5 \u56DE\u5408 CD" }
    ],
    35: [
      { id: "hamstring", name: "\u65AD\u7B4B", spec: "\u6B66\u5668", rageCost: 10, cooldown: 0, coefficient: 0.5, effectDesc: "0.5 \u500D\u4F24\u5BB3\uFF0C-30% \u654F\u6377 3 \u56DE\u5408" },
      { id: "death-wish", name: "\u9C81\u83BD", spec: "\u72C2\u66B4", rageCost: 0, cooldown: 6, effectDesc: "+20% \u4F24\u5BB3\uFF0C+10% \u53D7\u5230\u4F24\u5BB3\uFF0C3 \u56DE\u5408\uFF0C6 \u56DE\u5408 CD" },
      { id: "demoralizing-shout", name: "\u632B\u5FD7\u6012\u543C", spec: "\u9632\u62A4", rageCost: 15, cooldown: 0, effectDesc: "\u6240\u6709\u654C\u4EBA PhysAtk -15% \u6301\u7EED 4 \u56DE\u5408" }
    ],
    40: [
      { id: "charge", name: "\u51B2\u950B", spec: "\u6B66\u5668", rageCost: 0, cooldown: 2, effectDesc: "\u83B7\u5F97 20 \u6012\u6C14\uFF0C2 \u56DE\u5408 CD" },
      { id: "blood-fury", name: "\u8840\u4E4B\u72C2\u66B4", spec: "\u72C2\u66B4", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1AHP < 30% \u65F6 +10% \u4F24\u5BB3" },
      { id: "last-stand", name: "\u7834\u91DC\u6C89\u821F", spec: "\u9632\u62A4", rageCost: 0, cooldown: 6, effectDesc: "\u6CBB\u7597 20% \u6700\u5927 HP\uFF0C\u6BCF\u6218 1 \u6B21\uFF0C6 \u56DE\u5408 CD" }
    ],
    45: [
      { id: "battle-shout", name: "\u6218\u6597\u6012\u543C", spec: "\u6B66\u5668", rageCost: 10, cooldown: 0, effectDesc: "\u53CB\u65B9 PhysAtk +15% \u6301\u7EED 5 \u56DE\u5408" },
      { id: "berserker-rage", name: "\u72C2\u66B4\u4E4B\u6012", spec: "\u72C2\u66B4", rageCost: 0, cooldown: 4, coefficient: 1, effectDesc: "1.0 \u500D\u4F24\u5BB3 + \u83B7\u5F97 15 \u6012\u6C14\uFF0C4 \u56DE\u5408 CD" },
      { id: "challenging-shout", name: "\u6311\u6218\u6012\u543C", spec: "\u9632\u62A4", rageCost: 20, cooldown: 4, effectDesc: "\u6240\u6709\u654C\u4EBA\u653B\u51FB\u4F60 2 \u56DE\u5408\uFF0C4 \u56DE\u5408 CD" }
    ],
    50: [
      { id: "weapon-mastery", name: "\u6B66\u5668\u4E13\u7CBE", spec: "\u6B66\u5668", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A+5% \u7269\u7406\u4F24\u5BB3" },
      { id: "blood-craving", name: "\u55DC\u8840\u6E34\u671B", spec: "\u72C2\u66B4", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u66B4\u51FB\u6CBB\u7597 1% \u6700\u5927 HP" },
      { id: "shield-barrier", name: "\u76FE\u724C\u58C1\u5792", spec: "\u9632\u62A4", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u683C\u6321\u6CBB\u7597 2% \u6700\u5927 HP" }
    ],
    55: [
      { id: "victory-rush", name: "\u4E58\u80DC\u8FFD\u51FB", spec: "\u6B66\u5668", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u51FB\u6740\u6CBB\u7597 5% \u6700\u5927 HP" },
      { id: "fury-overflow", name: "\u6012\u6C14\u6EA2\u51FA", spec: "\u72C2\u66B4", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u6012\u6C14 > 50 \u65F6 +8% \u4F24\u5BB3" },
      { id: "shield-specialization", name: "\u76FE\u724C\u4E13\u7CBE", spec: "\u9632\u62A4", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A+10% \u683C\u6321\uFF0C\u6301\u76FE\u65F6 -5% \u53D7\u5230\u4F24\u5BB3" }
    ],
    60: [
      { id: "bladestorm", name: "\u5251\u5203\u98CE\u66B4", spec: "\u6B66\u5668", rageCost: 35, cooldown: 5, coefficient: 0.75, targets: -1, effectDesc: "\u5BF9\u6240\u6709\u9020\u6210 0.75 \u500D\u4F24\u5BB3\uFF0C\u65E0\u89C6 25% \u62A4\u7532\uFF0C2 \u56DE\u5408\uFF0C5 \u56DE\u5408 CD" },
      { id: "titans-grip", name: "\u6CF0\u5766\u4E4B\u63E1", spec: "\u72C2\u66B4", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A+10% \u4F24\u5BB3\uFF0C\u82E5\u5DF2\u5B66\u987A\u5288\u5219 +1 \u76EE\u6807" },
      { id: "invincible", name: "\u65E0\u654C", spec: "\u9632\u62A4", rageCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A+10% \u6700\u5927 HP\uFF0C-5% \u53D7\u5230\u4F24\u5BB3" }
    ]
  };
  function getLevelSkillById(skillId) {
    for (const skills of Object.values(WARRIOR_LEVEL_SKILLS)) {
      const found = skills.find((s) => s.id === skillId);
      if (found) return found;
    }
    return null;
  }

  // frontend/src/game/skillEnhancementLimits.js
  var MAX_SKILL_ENHANCE_COUNT = 4;
  var MAX_SKILL_DISPLAY_LEVEL = MAX_SKILL_ENHANCE_COUNT + 1;

  // frontend/src/game/weaponAffixDamage.js
  function computePhysicalDefenseAfterWeapon(target, opts = {}) {
    const armorPen = opts.armorPen ?? 0;
    const ignoreArmorPct = opts.ignoreArmorPct ?? 0;
    const base = getEffectiveArmor(target);
    const afterPen = Math.max(0, base - armorPen);
    return Math.max(0, Math.floor(afterPen * (1 - ignoreArmorPct / 100)));
  }
  function computeMagicDefenseAfterWeapon(target, opts = {}) {
    const spellPen = opts.spellPen ?? 0;
    const ignoreResistPct = opts.ignoreResistPct ?? 0;
    const base = getEffectiveResistance(target);
    const afterPen = Math.max(0, base - spellPen);
    return Math.max(0, Math.floor(afterPen * (1 - ignoreResistPct / 100)));
  }
  function applyDamageWithWeaponAffixes(rawDamage, damageType, target, weaponOpts = {}) {
    const defense = damageType === "magic" ? computeMagicDefenseAfterWeapon(target, weaponOpts) : computePhysicalDefenseAfterWeapon(target, weaponOpts);
    const finalDamage = Math.max(1, Math.round(rawDamage) - defense);
    const absorbed = Math.round(rawDamage) - finalDamage;
    return {
      damageType,
      absorbed,
      finalDamage,
      effectiveDefense: defense,
      nextHP: Math.max(0, (target.currentHP || 0) - finalDamage)
    };
  }

  // frontend/src/game/warriorSkills.js
  var WARRIOR_INITIAL_SKILLS = [
    {
      id: "heroic-strike",
      name: "\u82F1\u52C7\u6253\u51FB",
      spec: "\u6B66\u5668",
      rageCost: 15,
      coefficient: 1.2,
      effectDesc: "\u5BF9\u5355\u4F53\u9020\u6210 1.2 \u500D\u7269\u7406\u4F24\u5BB3"
    },
    {
      id: "bloodthirst",
      name: "\u55DC\u8840",
      spec: "\u72C2\u66B4",
      rageCost: 20,
      coefficient: 1.2,
      healPercent: 0.15,
      effectDesc: "1.2 \u500D\u7269\u7406\u4F24\u5BB3\uFF1B\u6CBB\u7597\u9020\u6210\u4F24\u5BB3\u7684 15%"
    },
    {
      id: "sunder-armor",
      name: "\u7834\u7532",
      spec: "\u9632\u62A4",
      rageCost: 15,
      coefficient: 0.8,
      debuffArmorReduction: 8,
      debuffDuration: 3,
      excessDamagePercent: 2,
      effectDesc: "0.8 \u500D\u4F24\u5BB3\uFF0C\u76EE\u6807\u62A4\u7532 -8 \u6301\u7EED 3 \u56DE\u5408\uFF1B\u62A4\u7532\u964D\u81F3 0 \u4EE5\u4E0B\u65F6\uFF0C\u6BCF\u70B9\u8D85\u989D +2% \u4F24\u5BB3\uFF1B\u53EF\u53E0\u52A0"
    }
  ];
  var WARRIOR_STANDALONE_SKILLS = [
    {
      id: "taunt",
      name: "\u5632\u8BBD",
      spec: "\u9632\u62A4",
      rageCost: 0,
      cooldown: 2,
      tauntForcedActions: 2,
      effectDesc: "\u5F3A\u5236\u76EE\u6807\u653B\u51FB\u4F60 2 \u6B21\u884C\u52A8\uFF0C2 \u56DE\u5408 CD"
    }
  ];
  var DEFAULT_CRIT = 1.5;
  function randomInRange3(min, max, rng) {
    const r = rng ?? Math.random;
    return min + Math.floor(r() * (max - min + 1));
  }
  function getWarriorSkillById(skillId) {
    return WARRIOR_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null;
  }
  function getAnyWarriorSkillById(skillId) {
    const standalone = WARRIOR_STANDALONE_SKILLS.find((s) => s.id === skillId);
    if (standalone) return standalone;
    return getWarriorSkillById(skillId) ?? getLevelSkillById(skillId);
  }
  var HEROIC_STRIKE_COEFF_MAX = 2;
  var BLOODTHIRST_COEFF_MAX = 1.6;
  var BLOODTHIRST_HEAL_MAX = 0.35;
  var DEFENSIVE_STANCE_DR_MAX = 24;
  var PER_STACK_ARMOR_REDUCTION = 8;
  function getSkillWithEnhancements(warrior, skillId) {
    const base = getAnyWarriorSkillById(skillId);
    if (!base) return null;
    const enhanceCount = Math.min(
      MAX_SKILL_ENHANCE_COUNT,
      warrior?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
    );
    if (enhanceCount === 0) return base;
    const out = { ...base };
    if (skillId === "heroic-strike") {
      out.coefficient = Math.min(HEROIC_STRIKE_COEFF_MAX, 1.2 + enhanceCount * 0.2);
      out.effectDesc = `\u5BF9\u5355\u4F53\u9020\u6210 ${out.coefficient} \u500D\u7269\u7406\u4F24\u5BB3`;
    } else if (skillId === "bloodthirst") {
      out.coefficient = Math.min(BLOODTHIRST_COEFF_MAX, 1.2 + enhanceCount * 0.1);
      out.healPercent = Math.min(BLOODTHIRST_HEAL_MAX, 0.15 + enhanceCount * 0.05);
      out.effectDesc = `${out.coefficient} \u500D\u7269\u7406\u4F24\u5BB3\uFF1B\u6CBB\u7597\u9020\u6210\u4F24\u5BB3\u7684 ${Math.round(out.healPercent * 100)}%`;
    } else if (skillId === "sunder-armor") {
      const baseRage = base.rageCost ?? 15;
      out.sunderMaxStacks = 1 + enhanceCount;
      out.rageCost = Math.max(1, baseRage - enhanceCount);
      out.effectDesc = `${out.rageCost} \u6012\u6C14\uFF0C0.8 \u500D\u4F24\u5BB3\uFF0C\u76EE\u6807\u62A4\u7532 -8 \u6301\u7EED 3 \u56DE\u5408\uFF1B\u62A4\u7532\u964D\u81F3 0 \u4EE5\u4E0B\u65F6\u6BCF\u70B9\u8D85\u989D +2% \u4F24\u5BB3\uFF08\u6700\u591A ${out.sunderMaxStacks} \u5C42\uFF09`;
    } else if (skillId === "taunt") {
      const baseForced = base.tauntForcedActions ?? 2;
      const baseCd = base.cooldown ?? 2;
      out.tauntForcedActions = baseForced + enhanceCount;
      out.cooldown = baseCd + enhanceCount;
      out.effectDesc = `\u5F3A\u5236\u76EE\u6807\u653B\u51FB\u4F60 ${out.tauntForcedActions} \u6B21\u884C\u52A8\uFF0C${out.cooldown} \u56DE\u5408 CD`;
    } else if (skillId === "defensive-stance") {
      const basePct = base.damageReductionPct ?? 12;
      out.damageReductionPct = Math.min(DEFENSIVE_STANCE_DR_MAX, basePct + enhanceCount * 3);
      out.stanceDuration = base.stanceDuration ?? 3;
      out.effectDesc = `\u81EA\u8EAB\u53D7\u5230\u4F24\u5BB3 -${out.damageReductionPct}%\uFF0C\u6301\u7EED ${out.stanceDuration} \u56DE\u5408\uFF0C${out.cooldown ?? 4} \u56DE\u5408 CD`;
    }
    return out;
  }
  var RAGE_PER_ATTACK = 4;
  var RAGE_CRIT_MULTIPLIER = 2;
  function rageFromAttack(isCrit) {
    const base = RAGE_PER_ATTACK;
    return isCrit ? base * RAGE_CRIT_MULTIPLIER : base;
  }
  function getSunderDebuff(unit) {
    if (!Array.isArray(unit.debuffs)) return null;
    return unit.debuffs.find((d) => d.type === "sunder") ?? null;
  }
  function getTotalArmorReduction(unit) {
    if (!Array.isArray(unit.debuffs)) return 0;
    return unit.debuffs.filter((d) => d.armorReduction != null).reduce((sum, d) => sum + d.armorReduction, 0);
  }
  function getEffectiveArmor(unit) {
    return Math.max(0, (unit.armor || 0) - getTotalArmorReduction(unit));
  }
  function getTotalResistanceReduction(unit) {
    if (!Array.isArray(unit.debuffs)) return 0;
    return unit.debuffs.filter((d) => d.resistanceReduction != null).reduce((sum, d) => sum + d.resistanceReduction, 0);
  }
  function getEffectiveResistance(unit) {
    return Math.max(0, (unit.resistance || 0) - getTotalResistanceReduction(unit));
  }
  function applySunderDebuff(target, duration = 3, perStackArmorReduction = 8, maxStacks = 1) {
    if (!Array.isArray(target.debuffs)) target.debuffs = [];
    const existing = target.debuffs.find((d) => d.type === "sunder");
    if (existing) {
      existing.remainingRounds = duration;
      const currentStacks = existing.stacks ?? (Math.round((existing.armorReduction || 0) / perStackArmorReduction) || 1);
      const newStacks = Math.min(currentStacks + 1, maxStacks);
      existing.stacks = newStacks;
      existing.armorReduction = perStackArmorReduction * newStacks;
      return { refreshed: true, stacked: newStacks > currentStacks };
    }
    target.debuffs.push({
      type: "sunder",
      stacks: 1,
      armorReduction: perStackArmorReduction * 1,
      remainingRounds: duration
    });
    return { refreshed: false, stacked: false };
  }
  function tickDebuffs(unit) {
    if (!Array.isArray(unit.debuffs)) return;
    unit.debuffs = unit.debuffs.map((d) => {
      if (d.skipActions != null) return d;
      const rr = d.remainingRounds;
      if (rr == null) return d;
      return { ...d, remainingRounds: rr - 1 };
    }).filter((d) => {
      if (d.skipActions != null) return true;
      return d.remainingRounds > 0;
    });
  }
  function tickHeroBuffs(unit) {
    if (unit.side !== "hero" || !Array.isArray(unit.buffs)) return;
    unit.buffs = unit.buffs.map((b) => {
      const rr = b.remainingRounds;
      if (rr == null) return b;
      return { ...b, remainingRounds: rr - 1 };
    }).filter((b) => (b.remainingRounds ?? 0) > 0);
  }
  function applyDefensiveStanceToIncomingDamage(hero, finalDamage) {
    if (finalDamage <= 0) return { finalDamage, stanceMitigated: 0 };
    const buff = (hero.buffs || []).find(
      (b) => (b.type === "defensive-stance" || b.type === "bear-form") && (b.remainingRounds ?? 0) > 0 && (b.damageReductionPct ?? 0) > 0
    );
    if (!buff) return { finalDamage, stanceMitigated: 0 };
    const pct = Math.min(100, buff.damageReductionPct);
    const after = Math.max(1, Math.round(finalDamage * (1 - pct / 100)));
    return { finalDamage: after, stanceMitigated: finalDamage - after };
  }
  function executeWarriorSkill(warrior, target, skill, opts = {}) {
    let { isCrit = false, rng, isHit = true } = opts;
    const critMult = warrior.physCritMult ?? DEFAULT_CRIT;
    if (skill.id === "shield-slam" && getSunderDebuff(target)) {
      isCrit = true;
    }
    warrior.currentMP = Math.max(0, (warrior.currentMP || 0) - skill.rageCost);
    if (!isHit) {
      return {
        skillId: skill.id,
        skillName: skill.name,
        skillSpec: skill.spec,
        skillCoefficient: skill.coefficient ?? (skill.baseCoefficient ?? 0.8),
        rawDamage: 0,
        rawAfterCrit: 0,
        finalDamage: 0,
        effectiveArmor: 0,
        isCrit: false,
        isHit: false,
        rageConsumed: skill.rageCost,
        rageGained: 0,
        heal: 0,
        healFromSkill: 0,
        weaponLifeStealHeal: 0,
        weaponLifeOnHitHeal: 0,
        primaryPhysDamage: 0,
        weaponAddedMagicDamage: 0,
        debuffApplied: false,
        debuffRefreshed: false,
        debuffArmorReduction: void 0,
        debuffDuration: skill.id === "sunder-armor" ? skill.debuffDuration : void 0
      };
    }
    const coeff = skill.coefficient ?? (skill.baseCoefficient ?? 0.8);
    const effectivePhysAtk = getEffectivePhysAtk(warrior, rng);
    const armorBefore = getEffectiveArmor(target);
    const mitigationArmor = computePhysicalDefenseAfterWeapon(target, {
      armorPen: warrior.physArmorPen ?? 0,
      ignoreArmorPct: warrior.physIgnoreArmorPct ?? 0
    });
    let baseRaw = Math.round(
      effectivePhysAtk * coeff * (1 + (warrior.physDmgPct || 0) / 100)
    );
    let debuffResult = null;
    let sunderExcessDamage = 0;
    if (skill.id === "sunder-armor") {
      const maxStacks = skill.sunderMaxStacks ?? 1;
      debuffResult = applySunderDebuff(target, skill.debuffDuration, PER_STACK_ARMOR_REDUCTION, maxStacks);
      const addedArmorReduction = debuffResult.stacked || !debuffResult.refreshed;
      if (addedArmorReduction) {
        sunderExcessDamage = Math.max(0, PER_STACK_ARMOR_REDUCTION - armorBefore);
      }
    }
    const excessPercent = (skill.excessDamagePercent ?? 0) / 100;
    const damageMultiplier = 1 + sunderExcessDamage * excessPercent;
    const rawAfterExcess = Math.round(baseRaw * damageMultiplier);
    const rawAfterCrit = isCrit ? Math.round(rawAfterExcess * critMult) : rawAfterExcess;
    const physFinalDamage = Math.max(1, rawAfterCrit - mitigationArmor);
    target.currentHP = Math.max(0, (target.currentHP || 0) - physFinalDamage);
    let weaponAddedMagic = 0;
    if (physFinalDamage > 0 && (warrior.addedMagicDmgMax ?? 0) > 0 && (warrior.addedMagicDmgMin ?? 0) <= (warrior.addedMagicDmgMax ?? 0)) {
      const roll = randomInRange3(warrior.addedMagicDmgMin, warrior.addedMagicDmgMax, rng);
      const md = applyDamageWithWeaponAffixes(roll, "magic", target, { spellPen: 0, ignoreResistPct: 0 });
      target.currentHP = md.nextHP;
      weaponAddedMagic = md.finalDamage;
    }
    const finalDamage = physFinalDamage + weaponAddedMagic;
    let healFromSkill = 0;
    if (skill.id === "bloodthirst" && skill.healPercent) {
      healFromSkill = Math.floor(finalDamage * skill.healPercent);
      warrior.currentHP = Math.min(
        warrior.maxHP ?? warrior.currentHP + healFromSkill,
        (warrior.currentHP || 0) + healFromSkill
      );
    }
    let weaponLifeStealHeal = 0;
    let weaponLifeOnHitHeal = 0;
    if (physFinalDamage > 0) {
      if (warrior.lifeStealPct) {
        weaponLifeStealHeal += Math.floor(physFinalDamage * (warrior.lifeStealPct / 100));
      }
      if (warrior.lifeOnHit) {
        weaponLifeOnHitHeal += warrior.lifeOnHit;
      }
      const lsTotal = weaponLifeStealHeal + weaponLifeOnHitHeal;
      if (lsTotal > 0) {
        warrior.currentHP = Math.min(warrior.maxHP ?? 99999, (warrior.currentHP || 0) + lsTotal);
      }
    }
    const heal = healFromSkill + weaponLifeStealHeal + weaponLifeOnHitHeal;
    const actualDebuffArmorReduction = skill.id === "sunder-armor" ? getSunderDebuff(target)?.armorReduction ?? 0 : void 0;
    const rageGained = physFinalDamage > 0 ? rageFromAttack(isCrit) : 0;
    warrior.currentMP = Math.min(100, (warrior.currentMP || 0) + rageGained);
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: coeff,
      rawDamage: skill.id === "sunder-armor" ? rawAfterExcess : baseRaw,
      rawAfterCrit,
      finalDamage,
      effectiveArmor: mitigationArmor,
      isCrit,
      isHit: true,
      rageConsumed: skill.rageCost,
      rageGained,
      heal,
      healFromSkill,
      weaponLifeStealHeal,
      weaponLifeOnHitHeal,
      primaryPhysDamage: physFinalDamage,
      weaponAddedMagicDamage: weaponAddedMagic,
      debuffApplied: debuffResult ? !debuffResult.refreshed : false,
      debuffRefreshed: debuffResult ? debuffResult.refreshed : false,
      debuffArmorReduction: actualDebuffArmorReduction,
      debuffDuration: skill.id === "sunder-armor" ? skill.debuffDuration : void 0
    };
  }
  function executeCleave(warrior, targets, skill, opts = {}) {
    const { isCrit = false, rng, isHit = true } = opts;
    const critMult = warrior.physCritMult ?? DEFAULT_CRIT;
    const maxTargets = Math.min(skill.targets ?? 2, targets.length) || 1;
    const toHit = targets.slice(0, maxTargets);
    warrior.currentMP = Math.max(0, (warrior.currentMP || 0) - skill.rageCost);
    const coeff = skill.coefficient ?? 0.7;
    let totalDamage = 0;
    let weaponLifeStealHealTotal = 0;
    let weaponLifeOnHitHealTotal = 0;
    let weaponAddedMagicDamageTotal = 0;
    const hits = [];
    for (const target of toHit) {
      const effectivePhysAtk = getEffectivePhysAtk(warrior, rng);
      const targetHPBefore = target.currentHP ?? 0;
      const baseRaw = Math.round(effectivePhysAtk * coeff * (1 + (warrior.physDmgPct || 0) / 100));
      const rawAfterCrit = isHit && isCrit ? Math.round(baseRaw * critMult) : baseRaw;
      const effectiveArmor = computePhysicalDefenseAfterWeapon(target, {
        armorPen: warrior.physArmorPen ?? 0,
        ignoreArmorPct: warrior.physIgnoreArmorPct ?? 0
      });
      let physFinal = isHit ? Math.max(1, rawAfterCrit - effectiveArmor) : 0;
      target.currentHP = Math.max(0, targetHPBefore - physFinal);
      let hitTotal = physFinal;
      let hitWeaponAddedMagic = 0;
      if (physFinal > 0 && (warrior.addedMagicDmgMax ?? 0) > 0 && (warrior.addedMagicDmgMin ?? 0) <= (warrior.addedMagicDmgMax ?? 0)) {
        const roll = randomInRange3(warrior.addedMagicDmgMin, warrior.addedMagicDmgMax, rng);
        const md = applyDamageWithWeaponAffixes(roll, "magic", target, { spellPen: 0, ignoreResistPct: 0 });
        target.currentHP = md.nextHP;
        hitWeaponAddedMagic = md.finalDamage;
        hitTotal += hitWeaponAddedMagic;
        weaponAddedMagicDamageTotal += hitWeaponAddedMagic;
      }
      if (physFinal > 0) {
        let lsPct = 0;
        if (warrior.lifeStealPct) lsPct += Math.floor(physFinal * (warrior.lifeStealPct / 100));
        let lsHit = 0;
        if (warrior.lifeOnHit) lsHit += warrior.lifeOnHit;
        weaponLifeStealHealTotal += lsPct;
        weaponLifeOnHitHealTotal += lsHit;
        const ls = lsPct + lsHit;
        if (ls > 0) {
          warrior.currentHP = Math.min(warrior.maxHP ?? 99999, (warrior.currentHP || 0) + ls);
        }
      }
      totalDamage += hitTotal;
      hits.push({
        target,
        targetId: target.id,
        targetName: target.name,
        baseRaw,
        physFinalDamage: physFinal,
        finalDamage: hitTotal,
        effectiveArmor,
        targetHPBefore,
        weaponAddedMagicDamage: hitWeaponAddedMagic,
        isHit,
        isMiss: !isHit
      });
    }
    const rageGained = rageFromAttack(isCrit);
    warrior.currentMP = Math.min(100, (warrior.currentMP || 0) + rageGained);
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: coeff,
      rageConsumed: skill.rageCost,
      rageGained,
      hits,
      totalDamage,
      targetCount: hits.length,
      weaponLifeStealHeal: weaponLifeStealHealTotal,
      weaponLifeOnHitHeal: weaponLifeOnHitHealTotal,
      weaponAddedMagicDamageTotal
    };
  }

  // frontend/src/game/mageLevelSkills.js
  var MAGE_LEVEL_SKILLS = {
    5: [
      { id: "arcane-missiles", name: "\u5965\u672F\u98DE\u5F39", spec: "\u5965\u672F", manaCost: 11, cooldown: 0, coefficient: 1, effectDesc: "1.0 \u500D\u4F24\u5BB3\uFF0C\u6062\u590D\u9020\u6210\u4F24\u5BB3 10% \u7684\u6CD5\u529B" },
      {
        id: "frost-nova",
        name: "\u51B0\u971C\u65B0\u661F",
        spec: "\u51B0\u971C",
        manaCost: 11,
        cooldown: 2,
        coefficient: 0.5,
        targets: -1,
        freezeChance: 0.25,
        effectDesc: "\u5BF9\u6240\u6709\u654C\u4EBA 0.5 \u500D\u6CD5\u672F\u4F24\u5BB3\uFF1B\u6BCF\u540D\u654C\u4EBA 25% \u6982\u7387\u51B0\u51BB 1 \u6B21\u884C\u52A8\uFF08\u72EC\u7ACB\u5224\u5B9A\uFF09\uFF1B2 \u56DE\u5408 CD"
      },
      { id: "flamestrike", name: "\u70C8\u7130\u98CE\u66B4", spec: "\u706B\u7130", manaCost: 14, cooldown: 2, coefficient: 0.55, targets: -1, effectDesc: "\u5BF9\u6240\u6709\u9020\u6210 0.55 \u500D\u4F24\u5BB3 + \u71C3\u70E7 2 \u56DE\u5408\uFF0C2 \u56DE\u5408 CD" }
    ],
    10: [
      { id: "polymorph", name: "\u53D8\u5F62\u672F", spec: "\u5965\u672F", manaCost: 14, cooldown: 3, effectDesc: "\u76EE\u6807 2 \u56DE\u5408\u65E0\u6CD5\u884C\u52A8\uFF0C\u53D7\u51FB\u89E3\u9664\uFF0C3 \u56DE\u5408 CD" },
      { id: "cone-of-cold", name: "\u51B0\u9525\u672F", spec: "\u51B0\u971C", manaCost: 10, cooldown: 0, coefficient: 0.7, targets: 2, effectDesc: "\u5BF9 2 \u4E2A\u76EE\u6807\u9020\u6210 0.7 \u500D\u4F24\u5BB3\uFF0C\u6297\u6027 -4 \u6301\u7EED 2 \u56DE\u5408" },
      { id: "scorch", name: "\u707C\u70E7", spec: "\u706B\u7130", manaCost: 7, cooldown: 0, coefficient: 1, effectDesc: "1.0 \u500D\u4F24\u5BB3\uFF0C\u4F4E\u6D88\u8017\u586B\u5145\uFF1B\u76EE\u6807\u6709\u71C3\u70E7\u65F6 +0.2 \u500D" }
    ],
    15: [
      { id: "counterspell", name: "\u6CD5\u672F\u53CD\u5236", spec: "\u5965\u672F", manaCost: 0, cooldown: 4, effectDesc: "\u672C\u56DE\u5408\u6253\u65AD\u76EE\u6807\uFF0C4 \u56DE\u5408 CD" },
      { id: "ice-lance", name: "\u51B0\u67AA\u672F", spec: "\u51B0\u971C", manaCost: 6, cooldown: 0, coefficient: 1, effectDesc: "1.0 \u500D\u4F24\u5BB3\uFF0C\u76EE\u6807\u6709\u51B0\u971C debuff \u65F6 1.5 \u500D" },
      { id: "pyroblast", name: "\u708E\u7206\u672F", spec: "\u706B\u7130", manaCost: 20, cooldown: 2, coefficient: 1.8, effectDesc: "1.8 \u500D\u4F24\u5BB3\uFF0C2 \u56DE\u5408 CD" }
    ],
    20: [
      { id: "arcane-barrage", name: "\u5965\u672F\u5F39\u5E55", spec: "\u5965\u672F", manaCost: 17, cooldown: 1, coefficient: 1.6, effectDesc: "1.6 \u500D\u4F24\u5BB3\uFF0C\u66B4\u51FB\uFF1A-30% \u6CBB\u7597 2 \u56DE\u5408\uFF0C1 \u56DE\u5408 CD" },
      { id: "blizzard", name: "\u66B4\u98CE\u96EA", spec: "\u51B0\u971C", manaCost: 15, cooldown: 2, coefficient: 0.45, targets: -1, effectDesc: "\u5BF9\u6240\u6709\u9020\u6210 0.45 \u500D\u4F24\u5BB3\uFF0C-25% \u654F\u6377 2 \u56DE\u5408\uFF0C2 \u56DE\u5408 CD" },
      { id: "combustion", name: "\u71C3\u70E7", spec: "\u706B\u7130", manaCost: 0, cooldown: 5, effectDesc: "+20% \u6CD5\u672F\u4F24\u5BB3\u6301\u7EED 3 \u56DE\u5408\uFF0C5 \u56DE\u5408 CD" }
    ],
    25: [
      { id: "arcane-power", name: "\u5965\u672F\u5F3A\u5316", spec: "\u5965\u672F", manaCost: 0, cooldown: 5, effectDesc: "+25% \u6CD5\u672F\u4F24\u5BB3\uFF0C+20% \u6CD5\u529B\u6D88\u8017\uFF0C2 \u56DE\u5408\uFF0C5 \u56DE\u5408 CD" },
      { id: "frost-armor", name: "\u51B0\u7532\u672F", spec: "\u51B0\u971C", manaCost: 8, cooldown: 0, effectDesc: "\u53CB\u65B9\u53D7\u5230\u4F24\u5BB3 -15% \u6301\u7EED 4 \u56DE\u5408" },
      { id: "dragons-breath", name: "\u9F99\u606F\u672F", spec: "\u706B\u7130", manaCost: 13, cooldown: 3, coefficient: 0.9, targets: 2, effectDesc: "\u5BF9 2 \u4E2A\u76EE\u6807\u9020\u6210 0.9 \u500D\u4F24\u5BB3\uFF0C\u7729\u6655 1 \u56DE\u5408\uFF0C3 \u56DE\u5408 CD" }
    ],
    30: [
      { id: "evocation", name: "\u5524\u9192", spec: "\u5965\u672F", manaCost: 0, cooldown: 6, effectDesc: "\u6062\u590D 40% \u6700\u5927\u6CD5\u529B\uFF0C\u672C\u56DE\u5408\u65E0\u6CD5\u9020\u6210\u4F24\u5BB3\uFF0C6 \u56DE\u5408 CD" },
      { id: "deep-freeze", name: "\u6DF1\u5EA6\u51BB\u7ED3", spec: "\u51B0\u971C", manaCost: 17, cooldown: 4, coefficient: 1.5, effectDesc: "1.5 \u500D\u4F24\u5BB3\uFF0C\u7729\u6655 1 \u56DE\u5408\uFF0C\u4EC5\u5BF9\u51B0\u971C debuff \u76EE\u6807\uFF0C4 \u56DE\u5408 CD" },
      { id: "ignite", name: "\u70B9\u71C3", spec: "\u706B\u7130", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u706B\u7130\u66B4\u51FB\u65BD\u52A0\u71C3\u70E7 SpellPower*0.08/\u56DE\u5408 \u6301\u7EED 2 \u56DE\u5408" }
    ],
    35: [
      { id: "arcane-focus", name: "\u5965\u672F\u4E13\u6CE8", spec: "\u5965\u672F", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u6CD5\u529B > 50% \u65F6 +8% \u6CD5\u672F\u4F24\u5BB3" },
      { id: "ice-barrier", name: "\u5BD2\u51B0\u62A4\u4F53", spec: "\u51B0\u971C", manaCost: 11, cooldown: 4, effectDesc: "\u53CB\u65B9\u5438\u6536\u4E0B\u6B21\u653B\u51FB 50% \u4F24\u5BB3\uFF0C4 \u56DE\u5408 CD" },
      { id: "hot-streak", name: "\u70BD\u70ED\u8FDE\u51FB", spec: "\u706B\u7130", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u8FDE\u7EED 2 \u6B21\u706B\u7130\u66B4\u51FB = \u4E0B\u6B21\u708E\u7206\u514D\u8D39\u4E14\u65E0 CD" }
    ],
    40: [
      { id: "arcane-intellect", name: "\u5965\u672F\u667A\u6167", spec: "\u5965\u672F", manaCost: 6, cooldown: 0, effectDesc: "\u6240\u6709\u53CB\u65B9 SpellPower +15% \u6301\u7EED 5 \u56DE\u5408" },
      { id: "frost-mastery", name: "\u51B0\u971C\u4E13\u7CBE", spec: "\u51B0\u971C", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u5BF9\u51B0\u971C debuff \u76EE\u6807 +10% \u4F24\u5BB3" },
      { id: "fire-mastery", name: "\u706B\u7130\u4E13\u7CBE", spec: "\u706B\u7130", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A+15% \u71C3\u70E7\u4F24\u5BB3" }
    ],
    45: [
      { id: "arcane-surge", name: "\u5965\u672F\u6D8C\u52A8", spec: "\u5965\u672F", manaCost: 0, cooldown: 4, coefficient: 1, effectDesc: "1.0 \u500D\u4F24\u5BB3 + \u6062\u590D 20 \u6CD5\u529B\uFF0C4 \u56DE\u5408 CD" },
      { id: "cold-snap", name: "\u6025\u901F\u51B7\u5374", spec: "\u51B0\u971C", manaCost: 0, cooldown: 6, effectDesc: "\u91CD\u7F6E\u51B0\u971C\u65B0\u661F\u3001\u66B4\u98CE\u96EA\u3001\u6DF1\u5EA6\u51BB\u7ED3 CD\uFF0C6 \u56DE\u5408 CD" },
      { id: "molten-armor", name: "\u7194\u5CA9\u62A4\u7532", spec: "\u706B\u7130", manaCost: 8, cooldown: 0, effectDesc: "\u53CB\u65B9\u53D7\u5230\u7269\u7406\u4F24\u5BB3 -10% \u6301\u7EED 4 \u56DE\u5408" }
    ],
    50: [
      { id: "arcane-mastery", name: "\u5965\u672F\u4E13\u7CBE", spec: "\u5965\u672F", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A+5% \u6CD5\u672F\u4F24\u5BB3" },
      { id: "touch-of-frost", name: "\u51B0\u971C\u4E4B\u89E6", spec: "\u51B0\u971C", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u51B0\u971C\u66B4\u51FB\u6062\u590D 1% \u6700\u5927\u6CD5\u529B" },
      { id: "touch-of-fire", name: "\u706B\u7130\u4E4B\u89E6", spec: "\u706B\u7130", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u706B\u7130\u66B4\u51FB\u5EF6\u957F\u71C3\u70E7 +1 \u56DE\u5408" }
    ],
    55: [
      { id: "arcane-amplification", name: "\u5965\u672F\u589E\u5E45", spec: "\u5965\u672F", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u51FB\u6740\u6062\u590D 5% \u6700\u5927\u6CD5\u529B" },
      { id: "frost-amplification", name: "\u51B0\u971C\u589E\u5E45", spec: "\u51B0\u971C", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u6CD5\u529B > 50 \u65F6\u51B0\u971C debuff \u6301\u7EED +1 \u56DE\u5408" },
      { id: "fire-amplification", name: "\u706B\u7130\u589E\u5E45", spec: "\u706B\u7130", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A\u71C3\u70E7\u51FB\u6740\u6062\u590D 3% \u6700\u5927\u6CD5\u529B" }
    ],
    60: [
      { id: "arcane-storm", name: "\u5965\u672F\u98CE\u66B4", spec: "\u5965\u672F", manaCost: 22, cooldown: 5, coefficient: 0.75, targets: -1, effectDesc: "\u5BF9\u6240\u6709\u9020\u6210 0.75 \u500D\u4F24\u5BB3\uFF0C\u65E0\u89C6 25% \u6297\u6027\uFF0C2 \u56DE\u5408\uFF0C5 \u56DE\u5408 CD" },
      { id: "frostheart", name: "\u51B0\u971C\u4E4B\u5FC3", spec: "\u51B0\u971C", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A+10% \u6CD5\u672F\u4F24\u5BB3\uFF0C\u82E5\u5DF2\u5B66\u51B0\u9525\u5219 +1 \u76EE\u6807" },
      { id: "inferno", name: "\u70BC\u72F1", spec: "\u706B\u7130", manaCost: 0, cooldown: 0, effectDesc: "\u88AB\u52A8\uFF1A+10% \u6700\u5927\u6CD5\u529B\uFF0C+10% \u71C3\u70E7\u4F24\u5BB3" }
    ]
  };
  function getLevelSkillById2(skillId) {
    for (const skills of Object.values(MAGE_LEVEL_SKILLS)) {
      const found = skills.find((s) => s.id === skillId);
      if (found) return found;
    }
    return null;
  }

  // frontend/src/game/mageSkills.js
  var DEFAULT_SPELL_CRIT = 1.5;
  function randomInRange4(min, max, rng) {
    const r = rng ?? Math.random;
    return min + Math.floor(r() * (max - min + 1));
  }
  var FROSTBOLT_FREEZE_CHANCE_BASE = 0.1;
  var FROSTBOLT_FREEZE_CHANCE_PER_ENHANCE = 0.05;
  var FROSTBOLT_FREEZE_CHANCE_MAX = 0.3;
  var FROST_NOVA_FREEZE_CHANCE_BASE = 0.25;
  var FROST_NOVA_FREEZE_CHANCE_PER_ENHANCE = 0.05;
  var FROST_NOVA_FREEZE_CHANCE_MAX = 0.45;
  var FIREBALL_COEFF_MAX = 1.5;
  var FIREBALL_SPELL_CRIT_BONUS_MAX = 0.2;
  var FROSTBOLT_COEFF_MAX = 1;
  function fmtCoeffUi(n) {
    return String(Number.parseFloat(Number(n).toFixed(2)));
  }
  function getFrostboltFreezeChance(enhanceCount) {
    const c = Math.min(MAX_SKILL_ENHANCE_COUNT, Math.max(0, enhanceCount ?? 0));
    return Math.min(FROSTBOLT_FREEZE_CHANCE_MAX, FROSTBOLT_FREEZE_CHANCE_BASE + c * FROSTBOLT_FREEZE_CHANCE_PER_ENHANCE);
  }
  function getFrostNovaFreezeChance(enhanceCount) {
    const c = Math.min(MAX_SKILL_ENHANCE_COUNT, Math.max(0, enhanceCount ?? 0));
    return Math.min(
      FROST_NOVA_FREEZE_CHANCE_MAX,
      FROST_NOVA_FREEZE_CHANCE_BASE + c * FROST_NOVA_FREEZE_CHANCE_PER_ENHANCE
    );
  }
  var MAGE_INITIAL_SKILLS = [
    {
      id: "frostbolt",
      name: "\u5BD2\u51B0\u7BAD",
      spec: "\u51B0\u971C",
      manaCost: 9,
      coefficient: 0.8,
      freezeChance: FROSTBOLT_FREEZE_CHANCE_BASE,
      effectDesc: "0.8 \u500D\u6CD5\u672F\u4F24\u5BB3\uFF1B10% \u6982\u7387\u51B0\u51BB\u76EE\u6807\uFF0C\u4F7F\u5176\u8DF3\u8FC7 1 \u6B21\u884C\u52A8"
    },
    {
      id: "fireball",
      name: "\u706B\u7403\u672F",
      spec: "\u706B\u7130",
      manaCost: 13,
      coefficient: 1.3,
      spellCritBonus: 0.12,
      effectDesc: "1.3 \u500D\u6CD5\u672F\u4F24\u5BB3\uFF1B\u672C\u6280\u80FD\u989D\u5916 +12% \u6CD5\u672F\u66B4\u51FB\u7387\uFF08\u4E0D\u542B\u6301\u7EED\u4F24\u5BB3\uFF09"
    }
  ];
  function getMageSkillById(skillId) {
    return MAGE_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null;
  }
  function getAnyMageSkillById(skillId) {
    return getMageSkillById(skillId) ?? getLevelSkillById2(skillId);
  }
  function getMageSkillWithEnhancements(mage, skillId) {
    const base = getAnyMageSkillById(skillId);
    if (!base) return null;
    const enhanceCount = Math.min(
      MAX_SKILL_ENHANCE_COUNT,
      mage?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
    );
    if (enhanceCount === 0) return base;
    const out = { ...base };
    if (skillId === "fireball") {
      out.manaCost = (base.manaCost ?? 0) + enhanceCount;
      out.coefficient = Math.min(FIREBALL_COEFF_MAX, 1.3 + enhanceCount * 0.05);
      out.spellCritBonus = Math.min(FIREBALL_SPELL_CRIT_BONUS_MAX, 0.12 + enhanceCount * 0.02);
      out.effectDesc = `${fmtCoeffUi(out.coefficient)} \u500D\u6CD5\u672F\u4F24\u5BB3\uFF1B\u672C\u6280\u80FD\u989D\u5916 +${Math.round(out.spellCritBonus * 100)}% \u6CD5\u672F\u66B4\u51FB\u7387\uFF08\u4E0D\u542B\u6301\u7EED\u4F24\u5BB3\uFF09`;
    } else if (skillId === "frostbolt") {
      out.manaCost = (base.manaCost ?? 0) + enhanceCount;
      out.coefficient = Math.min(FROSTBOLT_COEFF_MAX, 0.8 + enhanceCount * 0.05);
      out.freezeChance = getFrostboltFreezeChance(enhanceCount);
      const pct = Math.round(out.freezeChance * 100);
      out.effectDesc = `${fmtCoeffUi(out.coefficient)} \u500D\u6CD5\u672F\u4F24\u5BB3\uFF1B${pct}% \u6982\u7387\u51B0\u51BB\u76EE\u6807\uFF0C\u4F7F\u5176\u8DF3\u8FC7 1 \u6B21\u884C\u52A8`;
    } else if (skillId === "frost-nova") {
      out.freezeChance = getFrostNovaFreezeChance(enhanceCount);
      const coeff = out.coefficient ?? 0.5;
      const pct = Math.round(out.freezeChance * 100);
      out.effectDesc = `\u5BF9\u6240\u6709\u654C\u4EBA ${fmtCoeffUi(coeff)} \u500D\u6CD5\u672F\u4F24\u5BB3\uFF1B\u6BCF\u540D\u654C\u4EBA ${pct}% \u6982\u7387\u51B0\u51BB 1 \u6B21\u884C\u52A8\uFF08\u72EC\u7ACB\u5224\u5B9A\uFF09\uFF1B2 \u56DE\u5408 CD`;
    }
    return out;
  }
  function applyFreezeDebuff(target, skipActions = 1) {
    if (!Array.isArray(target.debuffs)) target.debuffs = [];
    const existing = target.debuffs.find((d) => d.type === "freeze");
    if (existing) {
      existing.skipActions = Math.max(existing.skipActions ?? 0, skipActions);
      return { refreshed: true, applied: false };
    }
    target.debuffs.push({
      type: "freeze",
      skipActions
    });
    return { refreshed: false, applied: true };
  }
  function consumeFreezeTurn(unit) {
    if (!Array.isArray(unit.debuffs)) return false;
    const idx = unit.debuffs.findIndex((d2) => d2.type === "freeze" && (d2.skipActions ?? 0) > 0);
    if (idx < 0) return false;
    const d = unit.debuffs[idx];
    const next = (d.skipActions ?? 1) - 1;
    if (next <= 0) unit.debuffs.splice(idx, 1);
    else unit.debuffs[idx] = { ...d, skipActions: next };
    return true;
  }
  function executeFrostNova(mage, monsters, skill, opts = {}) {
    const { isCrit = false, rng, isHit = true } = opts;
    const roll = rng ?? Math.random;
    const critMult = mage.spellCritMult ?? DEFAULT_SPELL_CRIT;
    const coeff = skill.coefficient ?? 0.5;
    const freezeChance = skill.freezeChance ?? FROST_NOVA_FREEZE_CHANCE_BASE;
    const manaCost = skill.manaCost ?? 0;
    mage.currentMP = Math.max(0, (mage.currentMP || 0) - manaCost);
    const hits = [];
    let totalMainMagic = 0;
    let totalDamage = 0;
    const spBreak = getEffectiveSpellPowerBreakdown(mage, rng);
    const effectiveSpellPower = spBreak.total;
    for (const target of monsters) {
      if ((target.currentHP ?? 0) <= 0) continue;
      const baseRaw = Math.round(effectiveSpellPower * coeff * (1 + (mage.spellDmgPct || 0) / 100));
      const rawAfterCrit = isHit && isCrit ? Math.round(baseRaw * critMult) : baseRaw;
      const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
        spellPen: mage.spellPen ?? 0,
        ignoreResistPct: mage.spellIgnoreResistPct ?? 0
      });
      const mainMagicDamage = isHit ? Math.max(1, rawAfterCrit - effectiveResistance) : 0;
      totalMainMagic += mainMagicDamage;
      target.currentHP = Math.max(0, (target.currentHP || 0) - mainMagicDamage);
      let arcaneFollowupDamage = 0;
      if (mainMagicDamage > 0 && (mage.arcaneFollowupMax ?? 0) > 0 && (mage.arcaneFollowupMin ?? 0) <= (mage.arcaneFollowupMax ?? 0)) {
        const fu = randomInRange4(mage.arcaneFollowupMin, mage.arcaneFollowupMax, rng);
        const md = applyDamageWithWeaponAffixes(fu, "magic", target, {
          spellPen: mage.spellPen ?? 0,
          ignoreResistPct: mage.spellIgnoreResistPct ?? 0
        });
        target.currentHP = md.nextHP;
        arcaneFollowupDamage = md.finalDamage;
      }
      const finalDamage = mainMagicDamage + arcaneFollowupDamage;
      totalDamage += finalDamage;
      const freezeProcced = isHit && roll() < freezeChance;
      if (freezeProcced) {
        applyFreezeDebuff(target, 1);
      }
      hits.push({
        targetId: target.id,
        targetName: target.name,
        targetClass: target.class ?? null,
        targetTier: target.tier ?? null,
        rawDamage: baseRaw,
        finalDamage,
        primaryMagicDamage: mainMagicDamage,
        effectiveResistance,
        arcaneFollowupDamage,
        freezeProcced,
        isHit,
        isMiss: !isHit
      });
    }
    let manaRefluxGain = 0;
    let manaOnCastGain = 0;
    if (totalMainMagic > 0) {
      if (mage.manaRefluxPct) {
        manaRefluxGain += Math.floor(totalMainMagic * (mage.manaRefluxPct / 100));
      }
      if (mage.manaOnCast) {
        manaOnCastGain += mage.manaOnCast;
      }
      const mpGain = manaRefluxGain + manaOnCastGain;
      if (mpGain > 0) {
        mage.currentMP = Math.min(mage.maxMP ?? 99999, (mage.currentMP || 0) + mpGain);
      }
    }
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: coeff,
      hits,
      totalDamage,
      rawDamage: hits[0]?.rawDamage ?? 0,
      isCrit,
      manaConsumed: manaCost,
      manaRefluxGain,
      manaOnCastGain,
      spellPowerWeaponScaled: spBreak.weaponScaled,
      spellPowerFlatBonus: spBreak.flatBonus
    };
  }
  function executeMageSkill(mage, target, skill, opts = {}) {
    const { isCrit = false, rng, isHit = true } = opts;
    const roll = rng ?? Math.random;
    const critMult = mage.spellCritMult ?? DEFAULT_SPELL_CRIT;
    mage.currentMP = Math.max(0, (mage.currentMP || 0) - (skill.manaCost ?? 0));
    const coeff = skill.coefficient ?? 1;
    if (!isHit) {
      return {
        skillId: skill.id,
        skillName: skill.name,
        skillSpec: skill.spec,
        skillCoefficient: coeff,
        rawDamage: 0,
        rawAfterCrit: 0,
        finalDamage: 0,
        primaryMagicDamage: 0,
        effectiveResistance: 0,
        arcaneFollowupDamage: 0,
        manaRefluxGain: 0,
        manaOnCastGain: 0,
        isCrit: false,
        isHit: false,
        manaConsumed: skill.manaCost ?? 0,
        debuffApplied: false,
        debuffRefreshed: false,
        debuffType: void 0,
        freezeSkipActions: void 0,
        freezeProcced: skill.id === "frostbolt" ? false : void 0
      };
    }
    const spBreak = getEffectiveSpellPowerBreakdown(mage, rng);
    const effectiveSpellPower = spBreak.total;
    const baseRaw = Math.round(effectiveSpellPower * coeff * (1 + (mage.spellDmgPct || 0) / 100));
    const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw;
    const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
      spellPen: mage.spellPen ?? 0,
      ignoreResistPct: mage.spellIgnoreResistPct ?? 0
    });
    const mainMagicDamage = Math.max(1, rawAfterCrit - effectiveResistance);
    target.currentHP = Math.max(0, (target.currentHP || 0) - mainMagicDamage);
    let arcaneFollowupDamage = 0;
    if (mainMagicDamage > 0 && (mage.arcaneFollowupMax ?? 0) > 0 && (mage.arcaneFollowupMin ?? 0) <= (mage.arcaneFollowupMax ?? 0)) {
      const fu = randomInRange4(mage.arcaneFollowupMin, mage.arcaneFollowupMax, rng);
      const md = applyDamageWithWeaponAffixes(fu, "magic", target, {
        spellPen: mage.spellPen ?? 0,
        ignoreResistPct: mage.spellIgnoreResistPct ?? 0
      });
      target.currentHP = md.nextHP;
      arcaneFollowupDamage = md.finalDamage;
    }
    const finalDamage = mainMagicDamage + arcaneFollowupDamage;
    let manaRefluxGain = 0;
    let manaOnCastGain = 0;
    if (mainMagicDamage > 0) {
      if (mage.manaRefluxPct) {
        manaRefluxGain += Math.floor(mainMagicDamage * (mage.manaRefluxPct / 100));
      }
      if (mage.manaOnCast) {
        manaOnCastGain += mage.manaOnCast;
      }
      const mpGain = manaRefluxGain + manaOnCastGain;
      if (mpGain > 0) {
        mage.currentMP = Math.min(mage.maxMP ?? 99999, (mage.currentMP || 0) + mpGain);
      }
    }
    let debuffResult = null;
    let freezeProcced = false;
    if (skill.id === "frostbolt") {
      const p = skill.freezeChance ?? FROSTBOLT_FREEZE_CHANCE_BASE;
      freezeProcced = roll() < p;
      if (freezeProcced) {
        debuffResult = applyFreezeDebuff(target, 1);
      }
    }
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: coeff,
      rawDamage: baseRaw,
      rawAfterCrit,
      finalDamage,
      primaryMagicDamage: mainMagicDamage,
      effectiveResistance,
      arcaneFollowupDamage,
      manaRefluxGain,
      manaOnCastGain,
      isCrit,
      isHit: true,
      manaConsumed: skill.manaCost ?? 0,
      debuffApplied: !!(debuffResult && debuffResult.applied),
      debuffRefreshed: !!(debuffResult && debuffResult.refreshed),
      debuffType: skill.id === "frostbolt" && freezeProcced ? "freeze" : void 0,
      freezeSkipActions: skill.id === "frostbolt" && freezeProcced ? 1 : void 0,
      /** Only set for Frostbolt: whether the Freeze roll succeeded (for battle log). */
      freezeProcced: skill.id === "frostbolt" ? freezeProcced : void 0,
      spellPowerWeaponScaled: spBreak.weaponScaled,
      spellPowerFlatBonus: spBreak.flatBonus
    };
  }

  // frontend/src/game/priestLevelSkills.js
  var PRIEST_LEVEL_SKILLS = {
    5: [
      {
        id: "greater-heal",
        name: "\u5F3A\u6548\u6CBB\u7597",
        spec: "\u795E\u5723",
        manaCost: 18,
        cooldown: 1,
        coefficient: 2.1,
        effectDesc: "\u5BF9\u53CB\u65B9\u5355\u4F53\u6062\u590D 2.1 \u500D\u6CD5\u672F\u5F3A\u5EA6\u751F\u547D\u503C\uFF0C1 \u56DE\u5408 CD"
      },
      {
        id: "fade-mind",
        name: "\u5FC3\u7075\u9041\u5F71",
        spec: "\u6212\u5F8B",
        manaCost: 14,
        cooldown: 4,
        effectDesc: "\u6E05\u7A7A\u6240\u6709\u602A\u7269\u5BF9\u81EA\u5DF1\u7684\u4EC7\u6068\uFF0C4 \u56DE\u5408 CD"
      },
      {
        id: "shadow-word-pain",
        name: "\u6697\u8A00\u672F\uFF1A\u75DB",
        spec: "\u6697\u5F71",
        manaCost: 10,
        cooldown: 0,
        coefficient: 0.35,
        duration: 4,
        effectDesc: "\u5BF9\u5355\u4F53\u65BD\u52A0\u6697\u5F71\u6301\u7EED\u4F24\u5BB3\uFF1A\u6BCF\u56DE\u5408 0.35 \u500D\u6CD5\u672F\u5F3A\u5EA6\uFF0C\u6301\u7EED 4 \u56DE\u5408"
      }
    ]
  };
  function getPriestLevelSkillById(skillId) {
    for (const skills of Object.values(PRIEST_LEVEL_SKILLS)) {
      const found = skills.find((s) => s.id === skillId);
      if (found) return found;
    }
    return null;
  }

  // frontend/src/game/priestSkills.js
  var PRIEST_INITIAL_SKILLS = [
    {
      id: "flash-heal",
      name: "\u5FEB\u901F\u6CBB\u7597",
      spec: "\u795E\u5723",
      manaCost: 8,
      coefficient: 1,
      effectDesc: "\u6CBB\u7597\u53CB\u65B9\uFF1A\u6CD5\u672F\u5F3A\u5EA6 \xD7 1.0"
    },
    {
      id: "power-word-shield",
      name: "\u771F\u8A00\u672F\uFF1A\u76FE",
      spec: "\u795E\u5723",
      manaCost: 8,
      coefficient: 1,
      absorbDuration: 3,
      effectDesc: "\u62A4\u76FE\u5438\u6536 \u6CD5\u672F\u5F3A\u5EA6 \xD7 1.0 \u4F24\u5BB3\uFF0C\u6301\u7EED 3 \u56DE\u5408\u6216\u76F4\u81F3\u6253\u7834"
    }
  ];
  function getPriestSkillById(skillId) {
    return PRIEST_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null;
  }
  function getAnyPriestSkillById(skillId) {
    return getPriestSkillById(skillId) ?? getPriestLevelSkillById(skillId);
  }
  function getPriestSkillWithEnhancements(priest, skillId) {
    const base = getAnyPriestSkillById(skillId);
    if (!base) return null;
    const enhanceCount = Math.min(
      MAX_SKILL_ENHANCE_COUNT,
      priest?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
    );
    if (enhanceCount === 0) return base;
    const out = { ...base };
    if (skillId === "flash-heal") {
      out.coefficient = 1 + enhanceCount * 0.1;
      out.manaCost = 8 + enhanceCount;
      out.effectDesc = `\u6CBB\u7597\u53CB\u65B9\uFF1A\u6CD5\u672F\u5F3A\u5EA6 \xD7 ${out.coefficient}`;
    } else if (skillId === "power-word-shield") {
      out.coefficient = 1 + enhanceCount * 0.1;
      out.absorbDuration = 3 + enhanceCount;
      out.manaCost = 8 + enhanceCount;
      out.effectDesc = `\u62A4\u76FE\u5438\u6536 \u6CD5\u672F\u5F3A\u5EA6 \xD7 ${out.coefficient} \u4F24\u5BB3\uFF0C\u6301\u7EED ${out.absorbDuration} \u56DE\u5408\u6216\u76F4\u81F3\u6253\u7834`;
    }
    return out;
  }
  function getShieldBuff(unit) {
    if (!unit.shield) return null;
    return unit.shield;
  }
  function applyDamageToShieldedUnit(unit, damage) {
    const shield = unit.shield;
    if (!shield || shield.absorbRemaining <= 0) {
      unit.currentHP = Math.max(0, (unit.currentHP || 0) - damage);
      return { absorbed: 0, overflow: damage, shieldBroke: false };
    }
    const absorbed = Math.min(shield.absorbRemaining, damage);
    const overflow = damage - absorbed;
    shield.absorbRemaining -= absorbed;
    if (shield.absorbRemaining <= 0) {
      delete unit.shield;
    }
    unit.currentHP = Math.max(0, (unit.currentHP || 0) - overflow);
    return { absorbed, overflow, shieldBroke: absorbed > 0 && !unit.shield };
  }
  function executeFlashHeal(priest, target, skill, opts = {}) {
    const { rng } = opts;
    priest.currentMP = Math.max(0, (priest.currentMP || 0) - (skill.manaCost ?? 0));
    const spellPower = getEffectiveSpellPower(priest, rng);
    const healAmount = Math.max(1, Math.round(spellPower * (skill.coefficient ?? 1)));
    const targetHPBefore = target.currentHP ?? 0;
    target.currentHP = Math.min(target.maxHP, targetHPBefore + healAmount);
    const actualHeal = target.currentHP - targetHPBefore;
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: skill.coefficient ?? 1,
      heal: actualHeal,
      manaConsumed: skill.manaCost ?? 0,
      targetHPBefore,
      targetHPAfter: target.currentHP,
      targetMaxHP: target.maxHP
    };
  }
  function executeGreaterHeal(priest, target, skill, opts = {}) {
    return executeFlashHeal(priest, target, skill, opts);
  }
  function executePowerWordShield(priest, target, skill, opts = {}) {
    const { rng } = opts;
    priest.currentMP = Math.max(0, (priest.currentMP || 0) - (skill.manaCost ?? 0));
    const spellPower = getEffectiveSpellPower(priest, rng);
    const absorbAmount = Math.max(1, Math.round(spellPower * (skill.coefficient ?? 1)));
    const duration = skill.absorbDuration ?? 3;
    target.shield = { absorbRemaining: absorbAmount, remainingRounds: duration, casterId: priest.id };
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: skill.coefficient ?? 1,
      absorbAmount,
      manaConsumed: skill.manaCost ?? 0,
      shieldDuration: duration
    };
  }
  function executeShadowWordPain(priest, target, skill, opts = {}) {
    const { rng, isHit = true } = opts;
    priest.currentMP = Math.max(0, (priest.currentMP || 0) - (skill.manaCost ?? 0));
    if (!isHit) {
      return {
        skillId: skill.id,
        skillName: skill.name,
        skillSpec: skill.spec,
        finalDamage: 0,
        targetHPBefore: target.currentHP ?? 0,
        targetHPAfter: target.currentHP ?? 0,
        targetMaxHP: target.maxHP,
        manaConsumed: skill.manaCost ?? 0,
        debuffApplied: false,
        debuffRefreshed: false,
        debuffType: "shadow-pain",
        debuffDuration: skill.duration ?? 4,
        debuffDamagePerRound: 0,
        debuffDamageType: "magic",
        isHit: false
      };
    }
    const spellPower = getEffectiveSpellPower(priest, rng);
    const dotCoeff = skill.coefficient ?? 0.35;
    const duration = skill.duration ?? 4;
    const dotDamage = Math.max(1, Math.round(spellPower * dotCoeff));
    const targetHPBefore = target.currentHP ?? 0;
    target.currentHP = Math.max(0, targetHPBefore - dotDamage);
    if (!Array.isArray(target.debuffs)) target.debuffs = [];
    const existing = target.debuffs.find((d) => d.type === "shadow-pain");
    if (existing) {
      existing.damagePerRound = dotDamage;
      existing.remainingRounds = duration;
      existing.damageType = "magic";
    } else {
      target.debuffs.push({
        type: "shadow-pain",
        damagePerRound: dotDamage,
        remainingRounds: duration,
        damageType: "magic"
      });
    }
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      finalDamage: dotDamage,
      targetHPBefore,
      targetHPAfter: target.currentHP,
      targetMaxHP: target.maxHP,
      manaConsumed: skill.manaCost ?? 0,
      debuffApplied: !existing,
      debuffRefreshed: !!existing,
      debuffType: "shadow-pain",
      debuffDuration: duration,
      debuffDamagePerRound: dotDamage,
      debuffDamageType: "magic",
      isHit: true
    };
  }

  // frontend/src/game/druidLevelSkills.js
  var DRUID_LEVEL_SKILLS = {
    5: [
      {
        id: "bear-form",
        name: "\u718A\u5F62\u6001",
        spec: "\u5B88\u62A4",
        manaCost: 8,
        cooldown: 4,
        damageReductionPct: 12,
        stanceDuration: 3,
        effectDesc: "\u63A5\u4E0B\u6765 3 \u56DE\u5408\u6240\u53D7\u4F24\u5BB3 -12%\uFF1B\u6240\u6709\u4EA7\u751F\u4EC7\u6068\u7684\u884C\u52A8\u4EC7\u6068\u500D\u7387 +0.25"
      },
      {
        id: "regrowth",
        name: "\u6108\u5408",
        spec: "\u6062\u590D",
        manaCost: 14,
        cooldown: 0,
        coefficient: 0.9,
        hotCoeffPerTurn: 0.15,
        hotDuration: 2,
        effectDesc: "\u7ACB\u5373\u6CBB\u7597 \u6CD5\u672F\u5F3A\u5EA6 \xD7 0.9\uFF1B\u6301\u7EED\u6CBB\u7597 \u6BCF\u56DE\u5408 \xD7 0.15\uFF0C\u6301\u7EED 2 \u56DE\u5408"
      },
      {
        id: "rake",
        name: "\u626B\u51FB",
        spec: "\u91CE\u6027",
        manaCost: 11,
        cooldown: 0,
        coefficient: 0.6,
        bleedCoeffPerTurn: 0.12,
        bleedDuration: 4,
        effectDesc: "0.6 \u500D\u7269\u7406\u4F24\u5BB3 + \u6D41\u8840 4 \u56DE\u5408\uFF08\u6BCF\u56DE\u5408\u7269\u653B \xD7 0.12\uFF09"
      }
    ]
  };
  function getDruidLevelSkillById(skillId) {
    for (const skills of Object.values(DRUID_LEVEL_SKILLS)) {
      const found = skills.find((s) => s.id === skillId);
      if (found) return found;
    }
    return null;
  }

  // frontend/src/game/paladinLevelSkills.js
  var PALADIN_LEVEL_SKILLS = {
    5: [
      {
        id: "lay-on-hands",
        name: "\u5723\u7597\u672F",
        spec: "\u795E\u5723",
        manaCost: 15,
        cooldown: 4,
        maxHealHpRatio: 0.4,
        effectDesc: "\u6062\u590D\u76EE\u6807 min(\u7F3A\u5931\u751F\u547D, \u65BD\u6CD5\u8005\u6700\u5927\u751F\u547D \xD7 0.40)"
      },
      {
        id: "consecration",
        name: "\u5949\u732E",
        spec: "\u9632\u62A4",
        manaCost: 13,
        cooldown: 2,
        holyCoeff: 0.42,
        threatMultiplier: 1.4,
        effectDesc: "\u5168\u4F53\u654C\u4EBA\u795E\u5723\u4F24\u5BB3 \u6CD5\u672F\u5F3A\u5EA6 \xD7 0.42\uFF1B\u4EC7\u6068\u500D\u7387 1.40"
      },
      {
        id: "hammer-of-justice",
        name: "\u5236\u88C1\u4E4B\u9524",
        spec: "\u60E9\u6212",
        manaCost: 11,
        cooldown: 3,
        physCoeff: 0.65,
        holyCoeff: 0.35,
        effectDesc: "0.65 \u500D\u7269\u7406 + \u795E\u5723 \xD7 0.35\uFF1B\u6655\u7729 1 \u56DE\u5408\uFF08\u8DF3\u8FC7 1 \u6B21\u884C\u52A8\uFF09"
      }
    ]
  };
  function getPaladinLevelSkillById(skillId) {
    for (const skills of Object.values(PALADIN_LEVEL_SKILLS)) {
      const found = skills.find((s) => s.id === skillId);
      if (found) return found;
    }
    return null;
  }

  // frontend/src/game/paladinSkills.js
  var DEFAULT_CRIT2 = 1.5;
  var SEAL_BUFF_TYPE = "seal-of-righteousness";
  var PALADIN_FIXED_INITIAL_SKILLS = [
    {
      id: "seal-of-righteousness",
      name: "\u6B63\u4E49\u5723\u5370",
      spec: "\u795E\u5723",
      manaCost: 7,
      sealDuration: 3,
      sealRiderCoeff: 0.22,
      effectDesc: "\u81EA\u8EAB\u589E\u76CA 3 \u56DE\u5408\uFF1A\u6BCF\u6B21\u9020\u6210\u4F24\u5BB3\u7684\u884C\u52A8\u989D\u5916\u795E\u5723 \xD7 0.22\uFF1B\u671F\u95F4\u6240\u6709\u4EA7\u4EC7\u884C\u52A8 +0.15 \u4EC7\u6068\u500D\u7387"
    },
    {
      id: "judgement",
      name: "\u5BA1\u5224",
      spec: "\u60E9\u6212",
      manaCost: 10,
      holyCoeff: 0.85,
      sealBonusCoeff: 0.35,
      threatMultiplier: 1.25,
      effectDesc: "\u5355\u4F53\u795E\u5723 \xD7 0.85\uFF1B\u82E5\u5723\u5370\u751F\u6548\uFF1A\u989D\u5916 +0.35\xD7\u5E76\u5237\u65B0\u5723\u5370\u81F3 3 \u56DE\u5408\uFF1B\u4EC7\u6068\u500D\u7387 1.25"
    }
  ];
  var PALADIN_FIXED_SKILL_IDS = PALADIN_FIXED_INITIAL_SKILLS.map((s) => s.id);
  function getPaladinSkillById(skillId) {
    return PALADIN_FIXED_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null;
  }
  function getAnyPaladinSkillById(skillId) {
    return getPaladinSkillById(skillId) ?? getPaladinLevelSkillById(skillId);
  }
  function getSealBuff(paladin) {
    if (!Array.isArray(paladin?.buffs)) return null;
    return paladin.buffs.find((b) => b.type === SEAL_BUFF_TYPE && (b.remainingRounds ?? 0) > 0) ?? null;
  }
  function hasActiveSeal(paladin) {
    return getSealBuff(paladin) != null;
  }
  function applySealBuff(paladin, skill) {
    paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0));
    const duration = skill.sealDuration ?? 3;
    const riderCoeff = skill.sealRiderCoeff ?? 0.22;
    if (!Array.isArray(paladin.buffs)) paladin.buffs = [];
    const existing = paladin.buffs.find((b) => b.type === SEAL_BUFF_TYPE);
    if (existing) {
      existing.remainingRounds = duration;
      existing.riderCoeff = riderCoeff;
      return { refreshed: true, duration, riderCoeff };
    }
    paladin.buffs.push({ type: SEAL_BUFF_TYPE, remainingRounds: duration, riderCoeff });
    return { refreshed: false, duration, riderCoeff };
  }
  function refreshSealBuff(paladin, duration, riderCoeff) {
    const seal = getSealBuff(paladin);
    if (!seal) return false;
    seal.remainingRounds = duration;
    if (riderCoeff != null) seal.riderCoeff = riderCoeff;
    return true;
  }
  function getPaladinSkillWithEnhancements(paladin, skillId) {
    const base = getAnyPaladinSkillById(skillId);
    if (!base) return null;
    const enhanceCount = Math.min(
      MAX_SKILL_ENHANCE_COUNT,
      paladin?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
    );
    if (enhanceCount === 0) return base;
    const out = { ...base };
    if (skillId === "seal-of-righteousness") {
      out.sealRiderCoeff = 0.22 + enhanceCount * 0.04;
      out.manaCost = 7 + enhanceCount;
      out.effectDesc = `\u81EA\u8EAB\u589E\u76CA 3 \u56DE\u5408\uFF1A\u6BCF\u6B21\u9020\u6210\u4F24\u5BB3\u7684\u884C\u52A8\u989D\u5916\u795E\u5723 \xD7 ${out.sealRiderCoeff}\uFF1B\u671F\u95F4\u6240\u6709\u4EA7\u4EC7\u884C\u52A8 +0.15 \u4EC7\u6068\u500D\u7387`;
    } else if (skillId === "judgement") {
      out.holyCoeff = 0.85 + enhanceCount * 0.07;
      out.sealBonusCoeff = 0.35 + enhanceCount * 0.03;
      out.manaCost = 10 + enhanceCount;
      out.effectDesc = `\u5355\u4F53\u795E\u5723 \xD7 ${out.holyCoeff}\uFF1B\u82E5\u5723\u5370\u751F\u6548\uFF1A\u989D\u5916 +${out.sealBonusCoeff}\xD7\u5E76\u5237\u65B0\u5723\u5370\u81F3 3 \u56DE\u5408\uFF1B\u4EC7\u6068\u500D\u7387 1.25`;
    } else if (skillId === "lay-on-hands") {
      out.maxHealHpRatio = 0.4 + enhanceCount * 0.05;
      out.manaCost = 15 + enhanceCount;
      out.effectDesc = `\u6062\u590D\u76EE\u6807 min(\u7F3A\u5931\u751F\u547D, \u65BD\u6CD5\u8005\u6700\u5927\u751F\u547D \xD7 ${out.maxHealHpRatio})`;
    } else if (skillId === "consecration") {
      out.holyCoeff = 0.42 + enhanceCount * 0.05;
      out.manaCost = 13 + enhanceCount;
      out.effectDesc = `\u5168\u4F53\u654C\u4EBA\u795E\u5723 \xD7 ${out.holyCoeff}\uFF1B\u4EC7\u6068\u500D\u7387 1.40`;
    } else if (skillId === "hammer-of-justice") {
      out.physCoeff = 0.65 + enhanceCount * 0.06;
      out.holyCoeff = 0.35 + enhanceCount * 0.04;
      out.manaCost = 11 + enhanceCount;
      out.cooldown = enhanceCount >= 4 ? 2 : 3;
      out.effectDesc = `${out.physCoeff} \u500D\u7269\u7406 + \u795E\u5723 \xD7 ${out.holyCoeff}\uFF1B\u6655\u7729 1 \u56DE\u5408\uFF1B\u51B7\u5374 ${out.cooldown} \u56DE\u5408`;
    }
    return out;
  }
  function consumeStunTurn(unit) {
    if (!Array.isArray(unit.debuffs)) return false;
    const idx = unit.debuffs.findIndex((d2) => d2.type === "stun" && (d2.skipActions ?? 0) > 0);
    if (idx < 0) return false;
    const d = unit.debuffs[idx];
    const next = (d.skipActions ?? 1) - 1;
    if (next <= 0) unit.debuffs.splice(idx, 1);
    else unit.debuffs[idx] = { ...d, skipActions: next };
    return true;
  }
  function applyStunDebuff(target, skipActions = 1) {
    if (!Array.isArray(target.debuffs)) target.debuffs = [];
    const existing = target.debuffs.find((d) => d.type === "stun");
    if (existing) {
      existing.skipActions = skipActions;
      return { applied: false, refreshed: true };
    }
    target.debuffs.push({ type: "stun", skipActions });
    return { applied: true, refreshed: false };
  }
  function executeSealRider(paladin, target, opts = {}) {
    const seal = getSealBuff(paladin);
    if (!seal || (target.currentHP ?? 0) <= 0) return null;
    const { rng, isHit: forcedHit } = opts;
    const riderCoeff = seal.riderCoeff ?? 0.22;
    const spellPower = getEffectiveSpellPower(paladin, rng);
    const rawHoly = Math.max(1, Math.round(spellPower * riderCoeff));
    const hitResult = forcedHit != null ? { isHit: forcedHit } : { isHit: true };
    const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
      spellPen: paladin.spellPen ?? 0,
      ignoreResistPct: paladin.spellIgnoreResistPct ?? 0
    });
    const finalDamage = hitResult.isHit ? Math.max(1, rawHoly - effectiveResistance) : 0;
    const targetHPBefore = target.currentHP ?? 0;
    if (finalDamage > 0) {
      target.currentHP = Math.max(0, targetHPBefore - finalDamage);
    }
    return {
      finalDamage,
      riderCoeff,
      rawHoly,
      isHit: hitResult.isHit,
      effectiveResistance,
      targetHPBefore,
      targetHPAfter: target.currentHP,
      targetMaxHP: target.maxHP
    };
  }
  function executeSealOfRighteousness(paladin, skill) {
    const result = applySealBuff(paladin, skill);
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      sealApplied: !result.refreshed,
      sealRefreshed: result.refreshed,
      sealRounds: result.duration,
      sealRiderCoeff: result.riderCoeff,
      manaConsumed: skill.manaCost ?? 0
    };
  }
  function executeJudgement(paladin, target, skill, opts = {}) {
    const { rng, isHit = true, isCrit = false } = opts;
    const critMult = paladin.spellCritMult ?? DEFAULT_CRIT2;
    paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0));
    if (!isHit) {
      return {
        skillId: skill.id,
        skillName: skill.name,
        skillSpec: skill.spec,
        skillCoefficient: skill.holyCoeff ?? 0.85,
        rawDamage: 0,
        finalDamage: 0,
        isHit: false,
        isCrit: false,
        manaConsumed: skill.manaCost ?? 0,
        sealBonusDamage: 0,
        sealRefreshed: false
      };
    }
    const spellPower = getEffectiveSpellPower(paladin, rng);
    const baseCoeff = skill.holyCoeff ?? 0.85;
    let sealRefreshed = false;
    const sealActive = hasActiveSeal(paladin);
    const bonusCoeff = sealActive ? skill.sealBonusCoeff ?? 0.35 : 0;
    if (sealActive) {
      refreshSealBuff(paladin, skill.sealDuration ?? 3, getSealBuff(paladin)?.riderCoeff);
      sealRefreshed = true;
    }
    const totalCoeff = baseCoeff + bonusCoeff;
    const baseRaw = Math.round(spellPower * totalCoeff * (1 + (paladin.spellDmgPct || 0) / 100));
    const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw;
    const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
      spellPen: paladin.spellPen ?? 0,
      ignoreResistPct: paladin.spellIgnoreResistPct ?? 0
    });
    const finalDamage = Math.max(1, rawAfterCrit - effectiveResistance);
    const sealBonusDamage = bonusCoeff > 0 ? Math.max(0, Math.round(spellPower * bonusCoeff)) : 0;
    const targetHPBefore = target.currentHP ?? 0;
    target.currentHP = Math.max(0, targetHPBefore - finalDamage);
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: totalCoeff,
      rawDamage: rawAfterCrit,
      finalDamage,
      primaryHolyDamage: finalDamage,
      sealBonusDamage,
      effectiveResistance,
      isHit: true,
      isCrit,
      manaConsumed: skill.manaCost ?? 0,
      targetHPBefore,
      targetHPAfter: target.currentHP,
      targetMaxHP: target.maxHP,
      sealRefreshed,
      sealWasActive: sealActive
    };
  }
  function executeLayOnHands(paladin, target, skill) {
    paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0));
    const ratio = skill.maxHealHpRatio ?? 0.4;
    const cap = Math.max(1, Math.round((paladin.maxHP ?? 1) * ratio));
    const missing = Math.max(0, (target.maxHP ?? 0) - (target.currentHP ?? 0));
    const healAmount = Math.min(cap, missing);
    const targetHPBefore = target.currentHP ?? 0;
    target.currentHP = Math.min(target.maxHP ?? targetHPBefore, targetHPBefore + healAmount);
    const actualHeal = target.currentHP - targetHPBefore;
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      heal: actualHeal,
      healCap: cap,
      manaConsumed: skill.manaCost ?? 0,
      targetHPBefore,
      targetHPAfter: target.currentHP,
      targetMaxHP: target.maxHP
    };
  }
  function executeConsecration(paladin, monsters, skill, opts = {}) {
    const { rng, isCrit = false, isHit = true } = opts;
    const critMult = paladin.spellCritMult ?? DEFAULT_CRIT2;
    paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0));
    const coeff = skill.holyCoeff ?? 0.42;
    const spellPower = getEffectiveSpellPower(paladin, rng);
    const hits = [];
    let totalDamage = 0;
    for (const target of monsters) {
      if ((target.currentHP ?? 0) <= 0) continue;
      if (!isHit) {
        hits.push({
          targetId: target.id,
          targetName: target.name,
          finalDamage: 0,
          isHit: false,
          isMiss: true
        });
        continue;
      }
      const baseRaw = Math.round(spellPower * coeff * (1 + (paladin.spellDmgPct || 0) / 100));
      const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw;
      const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
        spellPen: paladin.spellPen ?? 0,
        ignoreResistPct: paladin.spellIgnoreResistPct ?? 0
      });
      const finalDamage = Math.max(1, rawAfterCrit - effectiveResistance);
      target.currentHP = Math.max(0, (target.currentHP || 0) - finalDamage);
      totalDamage += finalDamage;
      hits.push({
        targetId: target.id,
        targetName: target.name,
        targetClass: target.class ?? null,
        targetTier: target.tier ?? null,
        rawDamage: baseRaw,
        finalDamage,
        effectiveResistance,
        isHit: true,
        isMiss: false
      });
    }
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: coeff,
      hits,
      totalDamage,
      isCrit,
      isHit,
      manaConsumed: skill.manaCost ?? 0,
      threatMultiplier: skill.threatMultiplier ?? 1.4
    };
  }
  function executeHammerOfJustice(paladin, target, skill, opts = {}) {
    const { rng, isHit = true, isCrit = false } = opts;
    const critMult = paladin.physCritMult ?? DEFAULT_CRIT2;
    paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0));
    if (!isHit) {
      return {
        skillId: skill.id,
        skillName: skill.name,
        skillSpec: skill.spec,
        rawDamage: 0,
        finalDamage: 0,
        primaryPhysDamage: 0,
        holyDamage: 0,
        isHit: false,
        isCrit: false,
        manaConsumed: skill.manaCost ?? 0,
        debuffApplied: false,
        debuffRefreshed: false
      };
    }
    const physCoeff = skill.physCoeff ?? 0.65;
    const holyCoeff = skill.holyCoeff ?? 0.35;
    const effectivePhysAtk = getEffectivePhysAtk(paladin, rng);
    const physRaw = Math.round(effectivePhysAtk * physCoeff * (1 + (paladin.physDmgPct || 0) / 100));
    const physAfterCrit = isCrit ? Math.round(physRaw * critMult) : physRaw;
    const mitigationArmor = computePhysicalDefenseAfterWeapon(target, {
      armorPen: paladin.physArmorPen ?? 0,
      ignoreArmorPct: paladin.physIgnoreArmorPct ?? 0
    });
    const physFinal = Math.max(1, physAfterCrit - mitigationArmor);
    const spellPower = getEffectiveSpellPower(paladin, rng);
    const holyRaw = Math.max(1, Math.round(spellPower * holyCoeff));
    const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
      spellPen: paladin.spellPen ?? 0,
      ignoreResistPct: paladin.spellIgnoreResistPct ?? 0
    });
    const holyFinal = Math.max(1, holyRaw - effectiveResistance);
    const finalDamage = physFinal + holyFinal;
    const targetHPBefore = target.currentHP ?? 0;
    target.currentHP = Math.max(0, targetHPBefore - finalDamage);
    const stunResult = applyStunDebuff(target, 1);
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: physCoeff,
      rawDamage: physRaw + holyRaw,
      finalDamage,
      primaryPhysDamage: physFinal,
      holyDamage: holyFinal,
      effectiveArmor: mitigationArmor,
      effectiveResistance,
      isHit: true,
      isCrit,
      manaConsumed: skill.manaCost ?? 0,
      targetHPBefore,
      targetHPAfter: target.currentHP,
      targetMaxHP: target.maxHP,
      debuffApplied: stunResult.applied,
      debuffRefreshed: stunResult.refreshed,
      debuffType: "stun",
      debuffSkipActions: 1
    };
  }

  // frontend/src/game/druidSkills.js
  var DEFAULT_CRIT3 = 1.5;
  var BEAR_FORM_DR_MAX = 24;
  var DRUID_FIXED_INITIAL_SKILLS = [
    {
      id: "rejuvenation",
      name: "\u56DE\u6625\u672F",
      spec: "\u6062\u590D",
      manaCost: 10,
      hotCoeffPerTurn: 0.25,
      hotDuration: 4,
      effectDesc: "\u53CB\u65B9\u6301\u7EED\u6CBB\u7597\uFF1A\u6BCF\u56DE\u5408\u6CD5\u672F\u5F3A\u5EA6 \xD7 0.25\uFF0C\u6301\u7EED 4 \u56DE\u5408"
    },
    {
      id: "maul",
      name: "\u91CD\u6BB4",
      spec: "\u5B88\u62A4",
      manaCost: 12,
      coefficient: 1,
      threatMultiplier: 1.5,
      effectDesc: "1.0 \u500D\u7269\u7406\u4F24\u5BB3\uFF1B\u4EC7\u6068\u500D\u7387 1.5"
    }
  ];
  var DRUID_FIXED_SKILL_IDS = DRUID_FIXED_INITIAL_SKILLS.map((s) => s.id);
  function getDruidSkillById(skillId) {
    return DRUID_FIXED_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null;
  }
  function getAnyDruidSkillById(skillId) {
    return getDruidSkillById(skillId) ?? getDruidLevelSkillById(skillId);
  }
  function getDruidSkillWithEnhancements(druid, skillId) {
    const base = getAnyDruidSkillById(skillId);
    if (!base) return null;
    const enhanceCount = Math.min(
      MAX_SKILL_ENHANCE_COUNT,
      druid?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
    );
    if (enhanceCount === 0) return base;
    const out = { ...base };
    if (skillId === "rejuvenation") {
      out.hotCoeffPerTurn = 0.25 + enhanceCount * 0.04;
      out.manaCost = 10 + enhanceCount;
      out.effectDesc = `\u53CB\u65B9\u6301\u7EED\u6CBB\u7597\uFF1A\u6BCF\u56DE\u5408\u6CD5\u672F\u5F3A\u5EA6 \xD7 ${out.hotCoeffPerTurn}\uFF0C\u6301\u7EED ${out.hotDuration ?? 4} \u56DE\u5408`;
    } else if (skillId === "maul") {
      out.coefficient = 1 + enhanceCount * 0.1;
      out.manaCost = 12 + enhanceCount;
      out.effectDesc = `${out.coefficient} \u500D\u7269\u7406\u4F24\u5BB3\uFF1B\u4EC7\u6068\u500D\u7387 1.5`;
    } else if (skillId === "bear-form") {
      out.damageReductionPct = Math.min(BEAR_FORM_DR_MAX, 12 + enhanceCount * 3);
      out.manaCost = 8 + enhanceCount;
      out.effectDesc = `\u63A5\u4E0B\u6765 ${out.stanceDuration ?? 3} \u56DE\u5408\u6240\u53D7\u4F24\u5BB3 -${out.damageReductionPct}%\uFF1B\u6240\u6709\u4EA7\u751F\u4EC7\u6068\u7684\u884C\u52A8\u4EC7\u6068\u500D\u7387 +0.25`;
    } else if (skillId === "regrowth") {
      out.coefficient = 0.9 + enhanceCount * 0.08;
      out.hotCoeffPerTurn = 0.15 + enhanceCount * 0.02;
      out.manaCost = 14 + enhanceCount;
      out.effectDesc = `\u7ACB\u5373\u6CBB\u7597 \u6CD5\u672F\u5F3A\u5EA6 \xD7 ${out.coefficient}\uFF1B\u6301\u7EED\u6CBB\u7597 \u6BCF\u56DE\u5408 \xD7 ${out.hotCoeffPerTurn}\uFF0C\u6301\u7EED ${out.hotDuration ?? 2} \u56DE\u5408`;
    } else if (skillId === "rake") {
      out.coefficient = 0.6 + enhanceCount * 0.08;
      out.bleedCoeffPerTurn = 0.12 + enhanceCount * 0.02;
      out.manaCost = 11 + enhanceCount;
      out.effectDesc = `${out.coefficient} \u500D\u7269\u7406\u4F24\u5BB3 + \u6D41\u8840 ${out.bleedDuration ?? 4} \u56DE\u5408\uFF08\u6BCF\u56DE\u5408\u7269\u653B \xD7 ${out.bleedCoeffPerTurn}\uFF09`;
    }
    return out;
  }
  function applyHoTBuff(target, opts) {
    const { type, healPerRound, duration, casterId, sourceSkillId } = opts;
    if (!Array.isArray(target.buffs)) target.buffs = [];
    const existing = target.buffs.find((b) => b.type === type);
    if (existing) {
      existing.healPerRound = healPerRound;
      existing.remainingRounds = duration;
      existing.casterId = casterId;
      existing.sourceSkillId = sourceSkillId;
      return { refreshed: true };
    }
    target.buffs.push({
      type,
      healPerRound,
      remainingRounds: duration,
      casterId,
      sourceSkillId
    });
    return { refreshed: false };
  }
  function executeRejuvenation(druid, target, skill, opts = {}) {
    const { rng } = opts;
    druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0));
    const spellPower = getEffectiveSpellPower(druid, rng);
    const coeff = skill.hotCoeffPerTurn ?? 0.25;
    const duration = skill.hotDuration ?? 4;
    const healPerRound = Math.max(1, Math.round(spellPower * coeff));
    const hotResult = applyHoTBuff(target, {
      type: "rejuvenation-hot",
      healPerRound,
      duration,
      casterId: druid.id,
      sourceSkillId: skill.id
    });
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      heal: 0,
      hotHealPerRound: healPerRound,
      hotDuration: duration,
      hotApplied: !hotResult.refreshed,
      hotRefreshed: hotResult.refreshed,
      manaConsumed: skill.manaCost ?? 0,
      targetHPBefore: target.currentHP ?? 0,
      targetHPAfter: target.currentHP ?? 0,
      targetMaxHP: target.maxHP
    };
  }
  function executeRegrowth(druid, target, skill, opts = {}) {
    const { rng } = opts;
    druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0));
    const spellPower = getEffectiveSpellPower(druid, rng);
    const directCoeff = skill.coefficient ?? 0.9;
    const healAmount = Math.max(1, Math.round(spellPower * directCoeff));
    const targetHPBefore = target.currentHP ?? 0;
    target.currentHP = Math.min(target.maxHP, targetHPBefore + healAmount);
    const actualHeal = target.currentHP - targetHPBefore;
    const hotCoeff = skill.hotCoeffPerTurn ?? 0.15;
    const hotDuration = skill.hotDuration ?? 2;
    const healPerRound = Math.max(1, Math.round(spellPower * hotCoeff));
    const hotResult = applyHoTBuff(target, {
      type: "regrowth-hot",
      healPerRound,
      duration: hotDuration,
      casterId: druid.id,
      sourceSkillId: skill.id
    });
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: directCoeff,
      heal: actualHeal,
      hotHealPerRound: healPerRound,
      hotDuration,
      hotApplied: !hotResult.refreshed,
      hotRefreshed: hotResult.refreshed,
      manaConsumed: skill.manaCost ?? 0,
      targetHPBefore,
      targetHPAfter: target.currentHP,
      targetMaxHP: target.maxHP
    };
  }
  function executeMaul(druid, target, skill, opts = {}) {
    let { isCrit = false, rng, isHit = true } = opts;
    const critMult = druid.physCritMult ?? DEFAULT_CRIT3;
    druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0));
    if (!isHit) {
      return {
        skillId: skill.id,
        skillName: skill.name,
        skillSpec: skill.spec,
        skillCoefficient: skill.coefficient ?? 1,
        rawDamage: 0,
        rawAfterCrit: 0,
        finalDamage: 0,
        effectiveArmor: 0,
        isCrit: false,
        isHit: false,
        manaConsumed: skill.manaCost ?? 0,
        weaponAddedMagicDamage: 0,
        primaryPhysDamage: 0,
        weaponLifeStealHeal: 0,
        weaponLifeOnHitHeal: 0
      };
    }
    const coeff = skill.coefficient ?? 1;
    const effectivePhysAtk = getEffectivePhysAtk(druid, rng);
    const baseRaw = Math.round(effectivePhysAtk * coeff * (1 + (druid.physDmgPct || 0) / 100));
    const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw;
    const mitigationArmor = computePhysicalDefenseAfterWeapon(target, {
      armorPen: druid.physArmorPen ?? 0,
      ignoreArmorPct: druid.physIgnoreArmorPct ?? 0
    });
    const physFinalDamage = Math.max(1, rawAfterCrit - mitigationArmor);
    target.currentHP = Math.max(0, (target.currentHP || 0) - physFinalDamage);
    let weaponAddedMagic = 0;
    if (physFinalDamage > 0 && (druid.addedMagicDmgMax ?? 0) > 0 && (druid.addedMagicDmgMin ?? 0) <= (druid.addedMagicDmgMax ?? 0)) {
      const roll = druid.addedMagicDmgMin + Math.floor(rng() * ((druid.addedMagicDmgMax ?? 0) - (druid.addedMagicDmgMin ?? 0) + 1));
      const md = applyDamageWithWeaponAffixes(roll, "magic", target, { spellPen: 0, ignoreResistPct: 0 });
      target.currentHP = md.nextHP;
      weaponAddedMagic = md.finalDamage;
    }
    const finalDamage = physFinalDamage + weaponAddedMagic;
    let weaponLifeStealHeal = 0;
    let weaponLifeOnHitHeal = 0;
    if (physFinalDamage > 0) {
      if (druid.lifeStealPct) {
        weaponLifeStealHeal += Math.floor(physFinalDamage * (druid.lifeStealPct / 100));
      }
      if (druid.lifeOnHit) {
        weaponLifeOnHitHeal += druid.lifeOnHit;
      }
      const lsTotal = weaponLifeStealHeal + weaponLifeOnHitHeal;
      if (lsTotal > 0) {
        druid.currentHP = Math.min(druid.maxHP ?? 99999, (druid.currentHP || 0) + lsTotal);
      }
    }
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: coeff,
      rawDamage: baseRaw,
      rawAfterCrit,
      finalDamage,
      effectiveArmor: mitigationArmor,
      isCrit,
      isHit: true,
      manaConsumed: skill.manaCost ?? 0,
      weaponAddedMagicDamage: weaponAddedMagic,
      primaryPhysDamage: physFinalDamage,
      weaponLifeStealHeal,
      weaponLifeOnHitHeal,
      threatMultiplier: skill.threatMultiplier ?? 1.5
    };
  }
  function executeRake(druid, target, skill, opts = {}) {
    let { isCrit = false, rng, isHit = true } = opts;
    const critMult = druid.physCritMult ?? DEFAULT_CRIT3;
    druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0));
    if (!isHit) {
      return {
        skillId: skill.id,
        skillName: skill.name,
        skillSpec: skill.spec,
        skillCoefficient: skill.coefficient ?? 0.6,
        rawDamage: 0,
        finalDamage: 0,
        isHit: false,
        manaConsumed: skill.manaCost ?? 0,
        debuffApplied: false,
        debuffRefreshed: false,
        debuffType: "bleed",
        debuffDuration: skill.bleedDuration ?? 4,
        debuffDamagePerRound: 0,
        debuffDamageType: "physical"
      };
    }
    const coeff = skill.coefficient ?? 0.6;
    const effectivePhysAtk = getEffectivePhysAtk(druid, rng);
    const baseRaw = Math.round(effectivePhysAtk * coeff * (1 + (druid.physDmgPct || 0) / 100));
    const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw;
    const mitigationArmor = computePhysicalDefenseAfterWeapon(target, {
      armorPen: druid.physArmorPen ?? 0,
      ignoreArmorPct: druid.physIgnoreArmorPct ?? 0
    });
    const physFinalDamage = Math.max(1, rawAfterCrit - mitigationArmor);
    const targetHPBefore = target.currentHP ?? 0;
    target.currentHP = Math.max(0, targetHPBefore - physFinalDamage);
    const bleedCoeff = skill.bleedCoeffPerTurn ?? 0.12;
    const bleedDuration = skill.bleedDuration ?? 4;
    const bleedPerRound = Math.max(1, Math.round(effectivePhysAtk * bleedCoeff));
    if (!Array.isArray(target.debuffs)) target.debuffs = [];
    const existing = target.debuffs.find((d) => d.type === "bleed" && d.sourceSkillId === "rake");
    if (existing) {
      existing.damagePerRound = bleedPerRound;
      existing.remainingRounds = bleedDuration;
      existing.damageType = "physical";
    } else {
      target.debuffs.push({
        type: "bleed",
        sourceSkillId: "rake",
        damagePerRound: bleedPerRound,
        remainingRounds: bleedDuration,
        damageType: "physical"
      });
    }
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: coeff,
      rawDamage: baseRaw,
      finalDamage: physFinalDamage,
      effectiveArmor: mitigationArmor,
      isCrit,
      isHit: true,
      manaConsumed: skill.manaCost ?? 0,
      targetHPBefore,
      targetHPAfter: target.currentHP,
      targetMaxHP: target.maxHP,
      debuffApplied: !existing,
      debuffRefreshed: !!existing,
      debuffType: "bleed",
      debuffDuration: bleedDuration,
      debuffDamagePerRound: bleedPerRound,
      debuffDamageType: "physical"
    };
  }
  function executeBearForm(druid, skill) {
    druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0));
    const duration = skill.stanceDuration ?? 3;
    const pct = skill.damageReductionPct ?? 12;
    if (!druid.buffs) druid.buffs = [];
    druid.buffs = druid.buffs.filter((b) => b.type !== "bear-form");
    druid.buffs.push({
      type: "bear-form",
      remainingRounds: duration,
      damageReductionPct: pct
    });
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      damageReductionPct: pct,
      stanceDuration: duration,
      manaConsumed: skill.manaCost ?? 0
    };
  }
  var DRUID_HOT_BUFF_TYPES = ["rejuvenation-hot", "regrowth-hot"];

  // frontend/src/game/skillChoice.js
  function getHeroSkillIds(hero) {
    if (Array.isArray(hero.skills) && hero.skills.length > 0) {
      return [...hero.skills];
    }
    if (hero.skill) {
      return [hero.skill];
    }
    return [];
  }
  var SKILL_MILESTONE_LEVELS = (() => {
    const set = /* @__PURE__ */ new Set();
    for (let n = 3; n <= 60; n += 1) {
      if (n % 3 === 0) set.add(n);
      if (n >= 10 && n % 10 === 0) set.add(n);
    }
    return [...set].sort((a, b) => a - b);
  })();

  // frontend/src/data/heroes.js
  var LEVEL_HP_PER_LEVEL = 1.5;
  var LEVEL_MP_PER_LEVEL = 0.75;
  var STRENGTH_TO_ARMOR_K = 0.5;
  var SPELL_BASE_ATTR_INT_K_DEFAULT = 1.2;
  var SPELL_BASE_ATTR_INT_K_PRIEST_MAGE = 0.8;
  function getSpellIntellectK(heroClass) {
    if (heroClass === "Priest" || heroClass === "Mage") {
      return SPELL_BASE_ATTR_INT_K_PRIEST_MAGE;
    }
    return SPELL_BASE_ATTR_INT_K_DEFAULT;
  }
  var CLASS_COEFFICIENTS = {
    Warrior: { k_HP: 2.5, k_MP: null, physAtkAttr: "strength", k_PhysAtk: 0.585, k_SpellPower: null, k_Resistance: 0.27, k_PhysCrit: 0.27, k_SpellCrit: null, k_Dodge: 0.18 },
    Paladin: { k_HP: 3.15, k_MP: 1.98, physAtkAttr: "strength", k_PhysAtk: 0.405, k_SpellPower: 0.405, k_Resistance: 0.54, k_PhysCrit: 0.27, k_SpellCrit: 0.36, k_Dodge: 0.18 },
    Priest: { k_HP: 2.25, k_MP: 2.52, physAtkAttr: null, k_PhysAtk: null, k_SpellPower: 0.585, k_Resistance: 0.72, k_PhysCrit: 0.27, k_SpellCrit: 0.54, k_Dodge: 0.18 },
    Druid: { k_HP: 2.88, k_MP: 1.98, physAtkAttr: "agility", k_PhysAtk: 0.45, k_SpellPower: 0.405, k_Resistance: 0.54, k_PhysCrit: 0.54, k_SpellCrit: 0.45, k_Dodge: 0.36 },
    Mage: { k_HP: 1.8, k_MP: 2.52, physAtkAttr: null, k_PhysAtk: null, k_SpellPower: 0.585, k_Resistance: 0.72, k_PhysCrit: 0.27, k_SpellCrit: 0.54, k_Dodge: 0.18 },
    Rogue: { k_HP: 2.52, k_MP: null, physAtkAttr: "agility", k_PhysAtk: 0.495, k_SpellPower: null, k_Resistance: 0.27, k_PhysCrit: 0.63, k_SpellCrit: null, k_Dodge: 0.45 },
    Hunter: { k_HP: 2.7, k_MP: null, physAtkAttr: "agility", k_PhysAtk: 0.45, k_SpellPower: null, k_Resistance: 0.27, k_PhysCrit: 0.54, k_SpellCrit: null, k_Dodge: 0.36 },
    Warlock: { k_HP: 2.52, k_MP: 2.52, physAtkAttr: null, k_PhysAtk: null, k_SpellPower: 0.585, k_Resistance: 0.72, k_PhysCrit: 0.27, k_SpellCrit: 0.54, k_Dodge: 0.18 },
    Shaman: { k_HP: 2.7, k_MP: 1.98, physAtkAttr: "agility", k_PhysAtk: 0.36, k_SpellPower: 0.405, k_Resistance: 0.54, k_PhysCrit: 0.45, k_SpellCrit: 0.45, k_Dodge: 0.27 }
  };
  function getEffectiveAttrs(hero) {
    const eq = getEquipmentBonuses(hero?.equipment);
    return {
      strength: (hero?.strength || 0) + eq.strength,
      agility: (hero?.agility || 0) + eq.agility,
      intellect: (hero?.intellect || 0) + eq.intellect,
      stamina: (hero?.stamina || 0) + eq.stamina,
      spirit: (hero?.spirit || 0) + eq.spirit
    };
  }
  function computeHeroMaxHP(hero) {
    const attrs = getEffectiveAttrs(hero);
    const coef = CLASS_COEFFICIENTS[hero?.class] || {};
    const k_HP = coef.k_HP ?? 0;
    const eq = getEquipmentBonuses(hero?.equipment);
    const base = 10 + attrs.stamina * k_HP + (hero?.level || 1) * LEVEL_HP_PER_LEVEL;
    const pct = (eq.maxHpPct || 0) / 100;
    return Math.round(base * (1 + pct)) + (eq.maxHpFlat || 0);
  }
  function computeHeroMaxMP(hero) {
    const heroClass = hero?.class;
    if (heroClass === "Warrior" || heroClass === "Rogue" || heroClass === "Hunter") {
      return 100;
    }
    const attrs = getEffectiveAttrs(hero);
    const coef = CLASS_COEFFICIENTS[heroClass] || {};
    const kMp = coef.k_MP;
    if (kMp == null) {
      return 100;
    }
    const eq = getEquipmentBonuses(hero?.equipment);
    const base = 5 + (attrs.spirit || 0) * kMp + (hero?.level || 1) * LEVEL_MP_PER_LEVEL;
    const pct = (eq.maxManaPct || 0) / 100;
    return Math.round(base * (1 + pct));
  }
  function computeHeroArmor(hero) {
    const attrs = getEffectiveAttrs(hero);
    const eq = getEquipmentBonuses(hero?.equipment);
    return Math.round(attrs.strength * STRENGTH_TO_ARMOR_K) + eq.armor;
  }
  function getSpellBaseAttr(hero) {
    const attrs = getEffectiveAttrs(hero);
    const intK = getSpellIntellectK(hero?.class);
    return (attrs.intellect || 0) * intK + (attrs.spirit || 0) * 0.8;
  }
  function getPhysBaseAttr(hero) {
    const attrs = getEffectiveAttrs(hero);
    const coef = CLASS_COEFFICIENTS[hero?.class] || {};
    if (hero?.class === "Warrior" && coef.physAtkAttr === "strength") {
      return (attrs.strength || 0) * 0.8 + (attrs.agility || 0) * 0.6;
    }
    if (coef.physAtkAttr === "strength") return (attrs.strength || 0) * 1.4 + (attrs.agility || 0) * 0.6;
    if (coef.physAtkAttr === "agility") return (attrs.agility || 0) * 1.4 + (attrs.strength || 0) * 0.6;
    return (attrs.strength || 0) * 1.4 + (attrs.agility || 0) * 0.6;
  }
  function computeHeroResistance(hero) {
    const attrs = getEffectiveAttrs(hero);
    const eq = getEquipmentBonuses(hero?.equipment);
    const coef = CLASS_COEFFICIENTS[hero?.class] || {};
    const k = coef.k_Resistance ?? 0;
    return Math.round(attrs.intellect * k) + eq.resistance;
  }
  function getClassCritRates(heroClass, attrs) {
    const coef = CLASS_COEFFICIENTS[heroClass] || {};
    return {
      physCrit: (5 + (attrs.agility || 0) * (coef.k_PhysCrit || 0)) / 100,
      spellCrit: coef.k_SpellCrit != null ? (5 + (attrs.intellect || 0) * coef.k_SpellCrit) / 100 : 0
    };
  }

  // frontend/src/game/combatDisplayState.js
  function cloneDebuffs(debuffs) {
    return Array.isArray(debuffs) ? debuffs.map((d) => ({ ...d })) : [];
  }
  function cloneBuffs(buffs) {
    return Array.isArray(buffs) ? buffs.map((b) => ({ ...b })) : [];
  }
  function cloneShield(shield) {
    if (!shield || typeof shield !== "object") return void 0;
    return { ...shield };
  }
  function cloneTaunt(taunt) {
    if (!taunt || typeof taunt !== "object") return void 0;
    return { ...taunt };
  }
  function serializeMonsterUnit(unit) {
    return {
      id: unit.id,
      typeId: unit.typeId,
      name: unit.name,
      tier: unit.tier,
      level: unit.level ?? 1,
      damageType: unit.damageType ?? "physical",
      skill: unit.skill ?? null,
      skillChance: unit.skillChance,
      maxHP: unit.maxHP,
      currentHP: unit.currentHP,
      physAtk: unit.physAtk,
      spellPower: unit.spellPower,
      agility: unit.agility,
      armor: unit.armor,
      resistance: unit.resistance,
      physCrit: unit.physCrit,
      spellCrit: unit.spellCrit,
      hit: unit.hit,
      dodge: unit.dodge,
      debuffs: cloneDebuffs(unit.debuffs),
      taunt: cloneTaunt(unit.taunt),
      shield: cloneShield(unit.shield)
    };
  }
  function serializeHeroUnit(unit) {
    return {
      id: unit.id,
      name: unit.name,
      class: unit.class,
      level: unit.level ?? 1,
      maxHP: unit.maxHP,
      currentHP: unit.currentHP,
      maxMP: unit.maxMP,
      currentMP: unit.currentMP,
      agility: unit.agility,
      debuffs: cloneDebuffs(unit.debuffs),
      buffs: cloneBuffs(unit.buffs),
      shield: cloneShield(unit.shield)
    };
  }
  function serializeMonsterStep(unit) {
    return {
      id: unit.id,
      maxHP: unit.maxHP,
      currentHP: unit.currentHP,
      debuffs: cloneDebuffs(unit.debuffs),
      taunt: cloneTaunt(unit.taunt),
      shield: cloneShield(unit.shield)
    };
  }
  function serializeHeroStep(unit) {
    return {
      id: unit.id,
      maxHP: unit.maxHP,
      currentHP: unit.currentHP,
      maxMP: unit.maxMP,
      currentMP: unit.currentMP,
      debuffs: cloneDebuffs(unit.debuffs),
      buffs: cloneBuffs(unit.buffs),
      shield: cloneShield(unit.shield)
    };
  }
  function serializeEncounter(monsterUnits, heroUnits) {
    return {
      monsters: (monsterUnits || []).map(serializeMonsterUnit),
      heroes: (heroUnits || []).map(serializeHeroUnit)
    };
  }
  function serializePanelStep(heroUnits, monsterUnits) {
    return {
      monsters: (monsterUnits || []).map(serializeMonsterStep),
      heroes: (heroUnits || []).map(serializeHeroStep)
    };
  }

  // frontend/src/game/combatBattleStats.js
  function createBattleStatsAccumulator() {
    return {
      damageByHero: {},
      injuryByHero: {}
    };
  }
  function ensureDamageHero(acc, id) {
    if (!acc.damageByHero[id]) {
      acc.damageByHero[id] = { basic: 0, skill: 0, skillById: {} };
    }
    return acc.damageByHero[id];
  }
  function ensureInjuryHero(acc, id) {
    if (!acc.injuryByHero[id]) {
      acc.injuryByHero[id] = { basic: 0, basicPhysical: 0, basicMagic: 0, skill: 0, skillById: {} };
    }
    return acc.injuryByHero[id];
  }
  function recordHeroDamageToMonster(acc, hit) {
    if (!hit?.actorId || hit.isMiss === true) return;
    const fd = Math.floor(Number(hit.finalDamage) || 0);
    if (fd <= 0) return;
    const row = ensureDamageHero(acc, String(hit.actorId));
    if (hit.action === "skill") {
      row.skill += fd;
      const sid = typeof hit.skillId === "string" && hit.skillId ? hit.skillId : "__unknown__";
      row.skillById[sid] = (row.skillById[sid] || 0) + fd;
    } else if (hit.action === "basic" || hit.action === "attack") {
      row.basic += fd;
    }
  }
  function recordMonsterDamageToHero(acc, hit) {
    if (!hit?.targetId || hit.isMiss === true) return;
    const fd = Math.floor(Number(hit.finalDamage) || 0);
    if (fd <= 0) return;
    const row = ensureInjuryHero(acc, String(hit.targetId));
    if (hit.action === "skill") {
      row.skill += fd;
      const sid = typeof hit.skillId === "string" && hit.skillId ? hit.skillId : "__unknown__";
      row.skillById[sid] = (row.skillById[sid] || 0) + fd;
    } else if (hit.action === "basic" || hit.action === "attack") {
      row.basic += fd;
      if (hit.damageType === "magic") {
        row.basicMagic += fd;
      } else {
        row.basicPhysical += fd;
      }
    }
  }
  function battleStatsToDeltas(acc) {
    const damageByHeroDelta = {};
    for (const [id, rec] of Object.entries(acc.damageByHero || {})) {
      const out = { basic: rec.basic, skill: rec.skill };
      if (rec.skillById && Object.keys(rec.skillById).length > 0) {
        out.skillById = { ...rec.skillById };
      }
      damageByHeroDelta[id] = out;
    }
    const injuryByHeroDelta = {};
    for (const [id, rec] of Object.entries(acc.injuryByHero || {})) {
      const out = {
        basic: rec.basic,
        basicPhysical: rec.basicPhysical,
        basicMagic: rec.basicMagic,
        skill: rec.skill
      };
      if (rec.skillById && Object.keys(rec.skillById).length > 0) {
        out.skillById = { ...rec.skillById };
      }
      injuryByHeroDelta[id] = out;
    }
    return { damageByHeroDelta, injuryByHeroDelta };
  }

  // frontend/src/game/monsterSkills.js
  var MONSTER_SKILLS = {
    "stone-shard": {
      id: "stone-shard",
      name: "\u77F3\u7247",
      coefficient: 1.2,
      cooldown: 2,
      effectDesc: "1.2 \u500D\u6CD5\u672F\u4F24\u5BB3\uFF1B\u7834\u6CD5\uFF1A\u6297\u6027 -2 \u6301\u7EED 2 \u56DE\u5408\u3002CD\uFF1A2 \u56DE\u5408",
      debuff: { type: "splinter", resistanceReduction: 2, duration: 2 }
    },
    "blackjack": {
      id: "blackjack",
      name: "\u95F7\u68CD",
      coefficient: 1.35,
      cooldown: 2,
      effectDesc: "1.35 \u500D\u7206\u53D1\u4F24\u5BB3\uFF08\u7269\u7406\u6216\u6CD5\u672F\uFF09\u3002CD\uFF1A2 \u56DE\u5408"
    },
    "swift-cut": {
      id: "swift-cut",
      name: "\u8FC5\u6377\u5207\u5272",
      coefficient: 1.1,
      cooldown: 2,
      effectDesc: "1.1 \u500D\u7269\u7406\u4F24\u5BB3\uFF1B\u6D41\u8840\uFF1A\u6BCF\u56DE\u5408 3 \u70B9\u4F24\u5BB3\u6301\u7EED 2 \u56DE\u5408\u3002CD\uFF1A2 \u56DE\u5408",
      debuff: { type: "bleed", damagePerRound: 3, damageType: "physical", duration: 2 }
    },
    "rend": {
      id: "rend",
      name: "\u6495\u88C2",
      coefficient: 1.5,
      cooldown: 3,
      effectDesc: "1.5 \u500D\u72C2\u66B4\u7206\u53D1\u4F24\u5BB3\u3002CD\uFF1A3 \u56DE\u5408"
    }
  };
  function getMonsterSkillById(skillId) {
    return MONSTER_SKILLS[skillId] ?? null;
  }
  function applyMonsterSkillDebuff(target, skillDef) {
    const cfg = skillDef?.debuff;
    if (!cfg) return null;
    if (!Array.isArray(target.debuffs)) target.debuffs = [];
    const existing = target.debuffs.find((d) => d.type === cfg.type);
    const debuff = {
      type: cfg.type,
      remainingRounds: cfg.duration ?? 2,
      armorReduction: cfg.armorReduction,
      resistanceReduction: cfg.resistanceReduction,
      damagePerRound: cfg.damagePerRound,
      damageType: cfg.damageType ?? "physical"
    };
    if (existing) {
      Object.assign(existing, debuff);
      return { ...cfg, refreshed: true };
    }
    target.debuffs.push(debuff);
    return { ...cfg, refreshed: false };
  }

  // frontend/src/game/threat.js
  var HEAL_THREAT_MULTIPLIER = 0.5;
  var SHIELD_THREAT_MULTIPLIER = 0.25;
  var TAUNT_THREAT_BOOST = 1.1;
  var SKILL_THREAT_MULTIPLIERS = {
    "sunder-armor": 1.5,
    "revenge": 1.5,
    "shield-slam": 1.3,
    "taunt": 1.5,
    "maul": 1.5,
    "judgement": 1.25
  };
  var BEAR_FORM_THREAT_BONUS = 0.25;
  var SEAL_OF_RIGHTEOUSNESS_THREAT_BONUS = 0.15;
  var SEAL_OF_RIGHTEOUSNESS_BUFF_TYPE = "seal-of-righteousness";
  function createThreatTables(heroes, monsters) {
    const threat = {};
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    for (const m of monsters) {
      if ((m.currentHP ?? 0) <= 0) continue;
      threat[m.id] = {};
      for (const h of aliveHeroes) {
        threat[m.id][h.id] = 0;
      }
    }
    return threat;
  }
  function hasNonZeroThreatOnMonster(threat, monsterId, heroes) {
    const t = threat[monsterId];
    if (!t) return false;
    for (const h of heroes) {
      if ((h.currentHP ?? 0) <= 0) continue;
      if ((t[h.id] ?? 0) > 0) return true;
    }
    return false;
  }
  function getThreatMultiplier(skillId) {
    return SKILL_THREAT_MULTIPLIERS[skillId] ?? 1;
  }
  function getBearFormThreatBonus(hero) {
    if (!hero?.buffs) return 0;
    const buff = hero.buffs.find((b) => b.type === "bear-form" && (b.remainingRounds ?? 0) > 0);
    return buff ? BEAR_FORM_THREAT_BONUS : 0;
  }
  function getSealOfRighteousnessThreatBonus(hero) {
    if (!hero?.buffs) return 0;
    const buff = hero.buffs.find(
      (b) => b.type === SEAL_OF_RIGHTEOUSNESS_BUFF_TYPE && (b.remainingRounds ?? 0) > 0
    );
    return buff ? SEAL_OF_RIGHTEOUSNESS_THREAT_BONUS : 0;
  }
  function getEffectiveThreatMultiplierForHero(hero, baseMultiplier = 1) {
    return baseMultiplier + getBearFormThreatBonus(hero) + getSealOfRighteousnessThreatBonus(hero);
  }
  function computeSkillDamageThreat(skillId, finalDamage, opts = {}) {
    const mult = getThreatMultiplier(skillId);
    let base = finalDamage;
    if (skillId === "sunder-armor" && opts.sunderArmorReduction != null) {
      base = finalDamage + opts.sunderArmorReduction;
    }
    return Math.round(base * mult);
  }
  function addThreatFromSkillDamage(threat, monsterId, heroId, skillId, finalDamage, opts = {}) {
    const delta = computeSkillDamageThreat(skillId, finalDamage, opts);
    if (!threat[monsterId]) threat[monsterId] = {};
    const current = threat[monsterId][heroId] ?? 0;
    threat[monsterId][heroId] = current + delta;
  }
  function addThreatFromDamage(threat, monsterId, heroId, finalDamage, multiplier = 1, hero = null) {
    const mult = hero ? getEffectiveThreatMultiplierForHero(hero, multiplier) : multiplier;
    if (!threat[monsterId]) threat[monsterId] = {};
    const current = threat[monsterId][heroId] ?? 0;
    threat[monsterId][heroId] = current + Math.round(finalDamage * mult);
  }
  function addThreatFromHeal(threat, monsters, heroes, tauntState, beneficiaryHeroId, healerId, healAmount, monsterLastTargetById = null, healer = null) {
    const threatMult = getEffectiveThreatMultiplierForHero(healer, 1);
    const amount = Math.round(healAmount * HEAL_THREAT_MULTIPLIER * threatMult);
    if (amount <= 0) return 0;
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    let count = 0;
    for (const m of monsters) {
      if ((m.currentHP ?? 0) <= 0) continue;
      const lastId = monsterLastTargetById?.[m.id] ?? null;
      const intent = getMonsterTargetStable(m, aliveHeroes, threat, tauntState, lastId);
      if (!intent || intent.id !== beneficiaryHeroId) continue;
      if (!threat[m.id]) threat[m.id] = {};
      const current = threat[m.id][healerId] ?? 0;
      threat[m.id][healerId] = current + amount;
      count += 1;
    }
    return count;
  }
  function addThreatFromShield(threat, monsters, heroes, tauntState, beneficiaryHeroId, casterId, absorbAmount, monsterLastTargetById = null, caster = null) {
    const threatMult = getEffectiveThreatMultiplierForHero(caster, 1);
    const amount = Math.round(absorbAmount * SHIELD_THREAT_MULTIPLIER * threatMult);
    if (amount <= 0) return 0;
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    let count = 0;
    for (const m of monsters) {
      if ((m.currentHP ?? 0) <= 0) continue;
      const lastId = monsterLastTargetById?.[m.id] ?? null;
      const intent = getMonsterTargetStable(m, aliveHeroes, threat, tauntState, lastId);
      if (!intent || intent.id !== beneficiaryHeroId) continue;
      if (!threat[m.id]) threat[m.id] = {};
      const current = threat[m.id][casterId] ?? 0;
      threat[m.id][casterId] = current + amount;
      count += 1;
    }
    return count;
  }
  function applyTauntThreatBoost(threat, monsterId, casterId, heroes) {
    if (!threat[monsterId]) threat[monsterId] = {};
    const table = threat[monsterId];
    let maxThreat = 0;
    for (const h of heroes) {
      if ((h.currentHP ?? 0) <= 0) continue;
      const v = table[h.id] ?? 0;
      if (v > maxThreat) maxThreat = v;
    }
    const casterThreat = table[casterId] ?? 0;
    const newThreat = Math.max(maxThreat, casterThreat) * TAUNT_THREAT_BOOST;
    threat[monsterId][casterId] = Math.ceil(newThreat);
  }
  function getHighestThreatHero(threatTable, heroes, rng = Math.random, lastTargetId = null) {
    const alive2 = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    if (alive2.length === 0) return null;
    let maxThreat = -1;
    const candidates = [];
    for (const h of alive2) {
      const t = threatTable?.[h.id] ?? 0;
      if (t > maxThreat) {
        maxThreat = t;
        candidates.length = 0;
        candidates.push(h);
      } else if (t === maxThreat) {
        candidates.push(h);
      }
    }
    if (candidates.length === 0) return alive2[0];
    if (candidates.length === 1) return candidates[0];
    if (lastTargetId != null) {
      const sticky = candidates.find((h) => h.id === lastTargetId);
      if (sticky) return sticky;
    }
    return candidates[Math.floor(rng() * candidates.length)];
  }
  function getHighestThreatHeroStable(threatTable, heroes, lastTargetId = null) {
    const alive2 = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    if (alive2.length === 0) return null;
    let maxThreat = -1;
    const candidates = [];
    for (const h of alive2) {
      const t = threatTable?.[h.id] ?? 0;
      if (t > maxThreat) {
        maxThreat = t;
        candidates.length = 0;
        candidates.push(h);
      } else if (t === maxThreat) {
        candidates.push(h);
      }
    }
    if (candidates.length === 0) return alive2[0];
    if (candidates.length === 1) return candidates[0];
    if (lastTargetId != null) {
      const sticky = candidates.find((h) => h.id === lastTargetId);
      if (sticky) return sticky;
    }
    candidates.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    return candidates[0];
  }
  function getMonsterTarget(monster, heroes, threat, tauntState, rng = Math.random, lastTargetId = null) {
    const alive2 = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    if (alive2.length === 0) return null;
    const taunt = tauntState[monster.id];
    if (taunt && taunt.actionsRemaining > 0) {
      const caster = alive2.find((h) => h.id === taunt.casterId);
      if (caster) return caster;
    }
    const table = threat[monster.id] ?? {};
    return getHighestThreatHero(table, heroes, rng, lastTargetId);
  }
  function getMonsterTargetStable(monster, heroes, threat, tauntState, lastTargetId = null) {
    const alive2 = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    if (alive2.length === 0) return null;
    const taunt = tauntState[monster.id];
    if (taunt && taunt.actionsRemaining > 0) {
      const caster = alive2.find((h) => h.id === taunt.casterId);
      if (caster) return caster;
    }
    const table = threat[monster.id] ?? {};
    return getHighestThreatHeroStable(table, heroes, lastTargetId);
  }
  function decrementTauntActions(tauntState, monsterId) {
    const t = tauntState[monsterId];
    if (!t) return { expired: false };
    t.actionsRemaining -= 1;
    if (t.actionsRemaining <= 0) {
      delete tauntState[monsterId];
      return { expired: true };
    }
    return { expired: false };
  }
  function getDesignatedTank(heroes) {
    if (!heroes || heroes.length === 0) return null;
    return heroes.find((h) => h.isTank === true) ?? null;
  }
  function getTank(heroes, monsters, threat, designatedTank = null) {
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    if (aliveHeroes.length === 0) return null;
    if (designatedTank && aliveHeroes.some((h) => h.id === designatedTank.id)) {
      return designatedTank;
    }
    const aliveMonsters = monsters.filter((m) => (m.currentHP ?? 0) > 0);
    if (aliveMonsters.length === 0) return aliveHeroes[0];
    let best = null;
    let bestMonsterCount = -1;
    let bestTotalThreat = -1;
    for (const h of aliveHeroes) {
      let monsterCount = 0;
      let totalThreat = 0;
      for (const m of aliveMonsters) {
        const t = threat[m.id]?.[h.id] ?? 0;
        totalThreat += t;
        const maxOnM = Math.max(...aliveHeroes.map((x) => threat[m.id]?.[x.id] ?? 0));
        if (t >= maxOnM && t > 0) monsterCount += 1;
      }
      if (monsterCount > bestMonsterCount || monsterCount === bestMonsterCount && totalThreat > bestTotalThreat) {
        best = h;
        bestMonsterCount = monsterCount;
        bestTotalThreat = totalThreat;
      }
    }
    return best ?? aliveHeroes[0];
  }
  function isAllyOT(heroes, monsters, threat, designatedTank = null, monsterLastTargetById = null) {
    const tank = getTank(heroes, monsters, threat, designatedTank);
    if (!tank) return false;
    const aliveMonsters = monsters.filter((m) => (m.currentHP ?? 0) > 0);
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    for (const m of aliveMonsters) {
      const table = threat[m.id] ?? {};
      const lastId = monsterLastTargetById?.[m.id] ?? null;
      const topHero = getHighestThreatHeroStable(table, aliveHeroes, lastId);
      if (topHero && topHero.id !== tank.id) return true;
    }
    return false;
  }

  // frontend/src/game/tactics.js
  var TACTICS_TARGET_RULE_INHERIT = "default";
  function isTacticsConditionInactive(condition) {
    if (!condition) return true;
    if (Array.isArray(condition.whenAll) && condition.whenAll.length > 0) return false;
    const w = condition.when;
    if (w == null || w === "") return true;
    if (typeof w === "string" && w.trim() === "") return true;
    return false;
  }
  function getTargetRuleChain(actor, skillId, conditions) {
    const list = conditions ?? [];
    const cond = list.find((c) => c.skillId === skillId);
    if (cond?.targetRules?.length) {
      return cond.targetRules.filter((r) => {
        if (typeof r === "string") return r.length > 0;
        if (typeof r === "object" && r !== null) return typeof r.rule === "string" && r.rule.length > 0;
        return false;
      });
    }
    if (cond?.targetRule) {
      return [cond.targetRule];
    }
    return [TACTICS_TARGET_RULE_INHERIT];
  }
  function getSkillPriority(actor) {
    const tactics = actor.tactics;
    if (tactics?.skillPriority && Array.isArray(tactics.skillPriority) && tactics.skillPriority.length > 0) {
      const available = new Set(actor.skills || []);
      const seen = /* @__PURE__ */ new Set();
      const filtered = [];
      for (const id of tactics.skillPriority) {
        const ok = id === "basic-attack" || available.has(id);
        if (!ok) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        filtered.push(id);
      }
      if (filtered.length > 0) return filtered;
    }
    return actor.skills || [];
  }
  function getConditions(actor) {
    return actor.tactics?.conditions || [];
  }
  function tacticsConditionWhenRequiresPickedTarget(condition) {
    if (!condition || isTacticsConditionInactive(condition)) return false;
    if (Array.isArray(condition.whenAll) && condition.whenAll.length > 0) {
      return condition.whenAll.some(
        (x) => x && (x.when === "target-hp-below" || x.when === "target-hp-above" || x.when === "target-has-debuff")
      );
    }
    const w = condition.when;
    return w === "target-hp-below" || w === "target-hp-above" || w === "target-has-debuff";
  }
  function tacticsHpRatioWhenSkipsPreFilter(condition) {
    if (!condition || isTacticsConditionInactive(condition)) return false;
    if (Array.isArray(condition.whenAll) && condition.whenAll.length > 0) {
      return condition.whenAll.some((x) => x && (x.when === "target-hp-below" || x.when === "target-hp-above"));
    }
    const w = condition.when;
    return w === "target-hp-below" || w === "target-hp-above";
  }
  function checkCondition(condition, actor, target, heroes, monsters, ctx) {
    if (isTacticsConditionInactive(condition)) return true;
    if (Array.isArray(condition.whenAll) && condition.whenAll.length > 0) {
      const needsTarget = condition.whenAll.some(
        (w) => w && (w.when === "target-hp-below" || w.when === "target-hp-above" || w.when === "target-has-debuff")
      );
      if (needsTarget && !target) return false;
      return condition.whenAll.every((w) => {
        if (!w || !w.when) return true;
        return checkCondition({ when: w.when, value: w.value }, actor, target, heroes, monsters, ctx);
      });
    }
    const { when, value } = condition;
    if (when === "target-hp-below" || when === "target-hp-above" || when === "target-has-debuff") {
      if (!target) return false;
    }
    if (when === "target-hp-below") {
      const threshold = typeof value === "number" ? value : 0.3;
      const ratio = (target.currentHP ?? 0) / Math.max(1, target.maxHP ?? 1);
      return ratio <= threshold;
    }
    if (when === "target-hp-above") {
      const threshold = typeof value === "number" ? value : 0.5;
      const ratio = (target.currentHP ?? 0) / Math.max(1, target.maxHP ?? 1);
      return ratio > threshold;
    }
    if (when === "self-hp-below") {
      const threshold = typeof value === "number" ? value : 0.3;
      const ratio = (actor.currentHP ?? 0) / Math.max(1, actor.maxHP ?? 1);
      return ratio < threshold;
    }
    if (when === "self-hp-above") {
      const threshold = typeof value === "number" ? value : 0.6;
      const ratio = (actor.currentHP ?? 0) / Math.max(1, actor.maxHP ?? 1);
      return ratio > threshold;
    }
    if (when === "ally-hp-below") {
      const threshold = typeof value === "number" ? value : 0.4;
      return heroes.some((h) => {
        if (h.currentHP <= 0) return false;
        const ratio = (h.currentHP ?? 0) / Math.max(1, h.maxHP ?? 1);
        return ratio <= threshold;
      });
    }
    if (when === "self-hit-this-round") {
      return !!actor.hitThisRound;
    }
    if (when === "target-has-debuff") {
      const debuffType = value === "sunder" || value === "sunder-armor" ? "sunder" : value || "sunder";
      if (debuffType === "sunder") {
        return !!getSunderDebuff(target);
      }
      return (target.debuffs || []).some((d) => d.type === debuffType);
    }
    if (when === "ally-ot") {
      const threat = ctx?.threat;
      const isAllyOTFn = ctx?.isAllyOT;
      if (!threat || !isAllyOTFn) return false;
      return isAllyOTFn(heroes, monsters, threat);
    }
    if (when === "enemy-targeting-self") {
      const threat = ctx?.threat;
      if (!threat) return false;
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      const aliveMonsters = monsters.filter((m) => (m.currentHP ?? 0) > 0);
      const monsterLastTarget = ctx?.monsterLastTarget;
      return aliveMonsters.some((m) => {
        const lastId = monsterLastTarget?.[m.id] ?? null;
        return getTopThreatHeroId(m, threat, aliveHeroes, lastId) === actor.id;
      });
    }
    if (when === "tank-hp-below") {
      const threshold = typeof value === "number" ? value : 0.7;
      const tankId = ctx?.tankId;
      if (!tankId) return false;
      const tank = heroes.find((h) => h.id === tankId && (h.currentHP ?? 0) > 0);
      if (!tank) return false;
      const ratio = (tank.currentHP ?? 0) / Math.max(1, tank.maxHP ?? 1);
      return ratio < threshold;
    }
    if (when === "tank-hp-above") {
      const threshold = typeof value === "number" ? value : 0.7;
      const tankId = ctx?.tankId;
      if (!tankId) return false;
      const tank = heroes.find((h) => h.id === tankId && (h.currentHP ?? 0) > 0);
      if (!tank) return false;
      const ratio = (tank.currentHP ?? 0) / Math.max(1, tank.maxHP ?? 1);
      return ratio > threshold;
    }
    if (when === "self-no-shield") {
      return !getShieldBuff(actor);
    }
    if (when === "tank-no-shield") {
      const tankId = ctx?.tankId;
      if (!tankId) return false;
      const tank = heroes.find((h) => h.id === tankId && (h.currentHP ?? 0) > 0);
      if (!tank) return false;
      return !getShieldBuff(tank);
    }
    if (when === "enemy-not-targeting-self") {
      const threat = ctx?.threat;
      if (!threat) return true;
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      const aliveMonsters = monsters.filter((m) => (m.currentHP ?? 0) > 0);
      if (aliveMonsters.length === 0) return true;
      const monsterLastTarget = ctx?.monsterLastTarget;
      return !aliveMonsters.some((m) => {
        const lastId = monsterLastTarget?.[m.id] ?? null;
        return getTopThreatHeroId(m, threat, aliveHeroes, lastId) === actor.id;
      });
    }
    if (when === "resource-above") {
      const threshold = typeof value === "number" ? value : 50;
      return (actor.currentMP ?? 0) >= threshold;
    }
    if (when === "resource-below") {
      const threshold = typeof value === "number" ? value : 30;
      return (actor.currentMP ?? 0) < threshold;
    }
    if (when === "round-gte") {
      const minRound = typeof value === "number" ? value : 1;
      return (ctx?.round ?? 0) >= minRound;
    }
    if (when === "enemy-all-hp-above") {
      const threshold = typeof value === "number" ? value : 0.05;
      const aliveMonsters = monsters.filter((m) => (m.currentHP ?? 0) > 0);
      if (aliveMonsters.length === 0) return false;
      return aliveMonsters.every((m) => {
        const ratio = (m.currentHP ?? 0) / Math.max(1, m.maxHP ?? 1);
        return ratio > threshold;
      });
    }
    if (when === "every-ally-hp-gte") {
      const threshold = typeof value === "number" ? value : 0.7;
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      if (aliveHeroes.length === 0) return false;
      return aliveHeroes.every((h) => {
        const ratio = (h.currentHP ?? 0) / Math.max(1, h.maxHP ?? 1);
        return ratio >= threshold;
      });
    }
    if (when === "solo-survivor") {
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      return aliveHeroes.length === 1;
    }
    if (when === "allies-alive-gte") {
      const minCount = typeof value === "number" ? value : 2;
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      return aliveHeroes.length >= minCount;
    }
    return true;
  }
  function getAllyHpBelowThresholdFromStep(step) {
    if (typeof step !== "object" || step === null) return null;
    if (step.when === "ally-hp-below") return typeof step.value === "number" ? step.value : 0.3;
    if (Array.isArray(step.whenAll)) {
      const w = step.whenAll.find((x) => x && x.when === "ally-hp-below");
      if (w) return typeof w.value === "number" ? w.value : 0.3;
    }
    return null;
  }
  var ALLY_EMERGENCY_HEAL_SKILL_IDS = /* @__PURE__ */ new Set([
    "flash-heal",
    "greater-heal",
    "rejuvenation",
    "regrowth"
  ]);
  function isPlainLowestHpAllyTargetStep(step) {
    return step === "lowest-hp-ally" || typeof step === "object" && step !== null && step.rule === "lowest-hp-ally" && !step.when && !(Array.isArray(step.whenAll) && step.whenAll.length > 0);
  }
  function isUnsafePlainLowestAllyFallbackAfterEmergencyTriage(chain, stepIndex, step, skillId) {
    if (!skillId || !ALLY_EMERGENCY_HEAL_SKILL_IDS.has(skillId)) return false;
    if (!isPlainLowestHpAllyTargetStep(step)) return false;
    if (stepIndex <= 0) return false;
    const prev = chain[stepIndex - 1];
    if (typeof prev !== "object" || prev === null || prev.rule !== "lowest-hp-ally") return false;
    return getAllyHpBelowThresholdFromStep(prev) != null;
  }
  function ignoreSelfNoShieldForStepGate(step) {
    return step && step.rule === "lowest-hp-ally";
  }
  function whenClauseNeedsPickedTarget(when) {
    return when === "target-hp-below" || when === "target-hp-above" || when === "target-has-debuff";
  }
  function evaluateTargetRuleStepGates(step, actor, heroes, monsters, ctx) {
    if (typeof step !== "object" || step === null) return true;
    const c = ctx || {};
    const skipSelfNoShield = ignoreSelfNoShieldForStepGate(step);
    const evalPrePick = (w) => {
      if (!w || !w.when) return true;
      if (whenClauseNeedsPickedTarget(w.when)) return true;
      if (skipSelfNoShield && w.when === "self-no-shield") return true;
      return checkCondition({ when: w.when, value: w.value }, actor, null, heroes, monsters, c);
    };
    if (Array.isArray(step.whenAll) && step.whenAll.length > 0) {
      return step.whenAll.every(evalPrePick);
    }
    if (step.when) {
      return evalPrePick({ when: step.when, value: step.value });
    }
    return true;
  }
  function evaluateTargetRuleStepPostPickGates(step, target, actor, heroes, monsters, ctx) {
    if (typeof step !== "object" || step === null) return true;
    const c = ctx || {};
    const clauses = [];
    if (step.when && whenClauseNeedsPickedTarget(step.when)) {
      clauses.push({ when: step.when, value: step.value });
    }
    if (Array.isArray(step.whenAll)) {
      for (const w of step.whenAll) {
        if (w && w.when && whenClauseNeedsPickedTarget(w.when)) clauses.push(w);
      }
    }
    if (clauses.length === 0) return true;
    return clauses.every(
      (w) => checkCondition({ when: w.when, value: w.value }, actor, target, heroes, monsters, c)
    );
  }
  function checkAllyEmergencyHealSkillAllowed(healCond, actor, heroes, monsters, ctx) {
    if (!healCond) return true;
    if (tacticsConditionWhenRequiresPickedTarget(healCond)) return true;
    const chain = healCond.targetRules;
    if (!Array.isArray(chain) || chain.length === 0) {
      if (isTacticsConditionInactive(healCond)) return true;
      return checkCondition(healCond, actor, null, heroes, monsters, ctx);
    }
    const first = chain[0];
    if (typeof first === "object" && first !== null) {
      const th = getAllyHpBelowThresholdFromStep(first);
      if (th != null) {
        const emergency = { when: "ally-hp-below", value: th };
        if (checkCondition(emergency, actor, null, heroes, monsters, ctx)) {
          if (evaluateTargetRuleStepGates(first, actor, heroes, monsters, ctx)) return true;
        }
        if (isTacticsConditionInactive(healCond)) {
          if (chain.length === 1) return false;
          return true;
        }
      }
    }
    if (isTacticsConditionInactive(healCond)) return true;
    return checkCondition(healCond, actor, null, heroes, monsters, ctx);
  }
  function checkPriestFlashHealSkillAllowed(priestCond, actor, heroes, monsters, ctx) {
    return checkAllyEmergencyHealSkillAllowed(priestCond, actor, heroes, monsters, ctx);
  }
  function relaxBasicAttackConditionsKeepingTargetRules(conditions) {
    if (!Array.isArray(conditions) || conditions.length === 0) return [];
    const ba = conditions.find((c) => c.skillId === "basic-attack");
    if (!ba) return conditions;
    const relaxed = { skillId: "basic-attack" };
    if (Array.isArray(ba.targetRules) && ba.targetRules.length > 0) {
      relaxed.targetRules = ba.targetRules.map((step) => {
        if (typeof step === "string") return step;
        if (typeof step === "object" && step !== null && typeof step.rule === "string") return step.rule;
        return step;
      });
    } else if (ba.targetRule) {
      relaxed.targetRule = ba.targetRule;
    }
    return [...conditions.filter((c) => c.skillId !== "basic-attack"), relaxed];
  }
  function filterTargetsByCondition(targets, condition, actor, ctx) {
    if (isTacticsConditionInactive(condition)) return targets;
    if (condition.when === "target-has-debuff") {
      const debuffType = condition.value === "sunder" || condition.value === "sunder-armor" ? "sunder" : condition.value || "sunder";
      return targets.filter((t) => {
        if (debuffType === "sunder") return !!getSunderDebuff(t);
        return (t.debuffs || []).some((d) => d.type === debuffType);
      });
    }
    if (condition.when === "target-hp-below") {
      const threshold = typeof condition.value === "number" ? condition.value : 0.3;
      return targets.filter((t) => {
        const ratio = (t.currentHP ?? 0) / Math.max(1, t.maxHP ?? 1);
        return ratio <= threshold;
      });
    }
    if (condition.when === "target-hp-above") {
      const threshold = typeof condition.value === "number" ? condition.value : 0.5;
      return targets.filter((t) => {
        const ratio = (t.currentHP ?? 0) / Math.max(1, t.maxHP ?? 1);
        return ratio > threshold;
      });
    }
    return targets;
  }
  function getTopThreatHeroId(monster, threat, aliveHeroes, lastTargetId = null) {
    const table = threat[monster.id] ?? {};
    const hero = getHighestThreatHeroStable(table, aliveHeroes, lastTargetId);
    return hero?.id ?? null;
  }
  function pickRandomAlive(units, rng) {
    const alive2 = units.filter((u) => (u.currentHP ?? 0) > 0);
    if (alive2.length === 0) return null;
    return alive2[Math.floor(rng() * alive2.length)];
  }
  function isThreatAllZeroAcrossPool(threat, aliveMonsters, aliveHeroes) {
    if (!threat || aliveMonsters.length === 0) return true;
    for (const m of aliveMonsters) {
      const table = threat[m.id] ?? {};
      for (const h of aliveHeroes) {
        if ((table[h.id] ?? 0) !== 0) return false;
      }
    }
    return true;
  }
  function resolveThreatNotTankId(heroes, aliveMonsters, threat, tankId) {
    if (tankId) return tankId;
    const flagged = heroes.find((h) => h.isTank === true);
    if (flagged) return flagged.id;
    if (threat && aliveMonsters.length > 0) {
      return getTank(heroes, aliveMonsters, threat, null)?.id;
    }
    return void 0;
  }
  function getThreatNotTankMonsterPool(aliveMonsters, threat, heroes, tankId, monsterLastTarget = null, tauntState = {}) {
    if (!threat || !heroes) return null;
    const alive2 = aliveMonsters.filter((u) => (u.currentHP ?? 0) > 0);
    if (alive2.length === 0) return [];
    const resolvedTankId = resolveThreatNotTankId(heroes, alive2, threat, tankId);
    if (!resolvedTankId) return alive2;
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
    let pool = alive2.filter((m) => {
      const lastId = monsterLastTarget?.[m.id] ?? null;
      const intent = getMonsterTargetStable(m, aliveHeroes, threat, tauntState, lastId);
      return intent?.id !== resolvedTankId;
    });
    if (pool.length === 0) {
      if (isThreatAllZeroAcrossPool(threat, alive2, aliveHeroes)) {
        return alive2;
      }
      return [];
    }
    return pool;
  }
  function pickTargetByRule(candidates, targetRule, rng = Math.random, opts = {}) {
    const alive2 = candidates.filter((u) => (u.currentHP ?? 0) > 0);
    if (alive2.length === 0) return null;
    if (targetRule === "lowest-hp" || targetRule === "lowest-hp-ally") {
      return alive2.reduce((a, b) => (a.currentHP ?? 0) < (b.currentHP ?? 0) ? a : b);
    }
    if (targetRule === "lowest-hp-ratio-ally") {
      return alive2.reduce((a, b) => {
        const ra = (a.currentHP ?? 0) / Math.max(1, a.maxHP ?? 1);
        const rb = (b.currentHP ?? 0) / Math.max(1, b.maxHP ?? 1);
        if (ra < rb) return a;
        if (rb < ra) return b;
        const ca = a.currentHP ?? 0;
        const cb = b.currentHP ?? 0;
        if (ca < cb) return a;
        if (cb < ca) return b;
        return a;
      });
    }
    if (targetRule === "self") {
      const { actor } = opts;
      if (!actor) return null;
      const found = alive2.find((u) => u.id === actor.id);
      return found ?? null;
    }
    if (targetRule === "self-if-enemy-targeting") {
      const { actor, threat, heroes, monsters: monsList } = opts;
      if (!actor) return null;
      const selfUnit = alive2.find((u) => u.id === actor.id);
      if (!selfUnit) return null;
      if (!threat || !heroes || !monsList) return null;
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      const aliveMonsters = monsList.filter((m) => (m.currentHP ?? 0) > 0);
      const monsterLastTarget = opts.monsterLastTarget;
      const anyTargetingActor = aliveMonsters.some((m) => {
        const lastId = monsterLastTarget?.[m.id] ?? null;
        return getTopThreatHeroId(m, threat, aliveHeroes, lastId) === actor.id;
      });
      return anyTargetingActor ? selfUnit : null;
    }
    if (targetRule === "highest-hp") {
      return alive2.reduce((a, b) => (a.currentHP ?? 0) > (b.currentHP ?? 0) ? a : b);
    }
    if (targetRule === "threat-not-tank-random") {
      const { threat, heroes, tankId, monsterLastTarget, tauntState } = opts;
      const pool = getThreatNotTankMonsterPool(
        alive2,
        threat,
        heroes,
        tankId,
        monsterLastTarget,
        tauntState ?? {}
      );
      if (pool === null) return null;
      if (pool.length === 0) return null;
      return pickRandomAlive(pool, rng);
    }
    if (targetRule === "threat-not-tank-lowest-hp") {
      const { threat, heroes, tankId, monsterLastTarget, tauntState } = opts;
      const pool = getThreatNotTankMonsterPool(
        alive2,
        threat,
        heroes,
        tankId,
        monsterLastTarget,
        tauntState ?? {}
      );
      if (pool === null) return null;
      if (pool.length === 0) return null;
      return pool.reduce((a, b) => (a.currentHP ?? 0) < (b.currentHP ?? 0) ? a : b);
    }
    if (targetRule === "threat-tank-top-random") {
      const { threat, heroes, tankId } = opts;
      if (!threat || !heroes) return null;
      if (!tankId) {
        return pickRandomAlive(alive2, rng);
      }
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      const monsterLastTarget = opts.monsterLastTarget;
      let pool = alive2.filter((m) => {
        const lastId = monsterLastTarget?.[m.id] ?? null;
        return getTopThreatHeroId(m, threat, aliveHeroes, lastId) === tankId;
      });
      if (pool.length === 0) {
        pool = alive2;
      }
      return pickRandomAlive(pool, rng);
    }
    if (targetRule === "threat-tank-top-lowest-on-tank") {
      const { threat, heroes, tankId } = opts;
      if (!threat || !heroes) return null;
      if (!tankId) {
        return pickRandomAlive(alive2, rng);
      }
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      const monsterLastTarget = opts.monsterLastTarget;
      let pool = alive2.filter((m) => {
        const lastId = monsterLastTarget?.[m.id] ?? null;
        return getTopThreatHeroId(m, threat, aliveHeroes, lastId) === tankId;
      });
      if (pool.length === 0) {
        pool = alive2;
      }
      let best = null;
      let bestT = Infinity;
      for (const m of pool) {
        const t = (threat[m.id] ?? {})[tankId] ?? 0;
        if (t < bestT) {
          bestT = t;
          best = m;
        }
      }
      return best;
    }
    if (targetRule === "threat-tank-top-highest-on-tank") {
      const { threat, heroes, tankId } = opts;
      if (!threat || !heroes) return null;
      if (!tankId) {
        return pickRandomAlive(alive2, rng);
      }
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      const monsterLastTarget = opts.monsterLastTarget;
      let pool = alive2.filter((m) => {
        const lastId = monsterLastTarget?.[m.id] ?? null;
        return getTopThreatHeroId(m, threat, aliveHeroes, lastId) === tankId;
      });
      if (pool.length === 0) {
        pool = alive2;
      }
      let best = null;
      let bestT = -1;
      for (const m of pool) {
        const t = (threat[m.id] ?? {})[tankId] ?? 0;
        if (t > bestT) {
          bestT = t;
          best = m;
        }
      }
      return best;
    }
    if (targetRule === "first-top-threat-not-self") {
      const { threat, actor, heroes } = opts;
      if (!threat || !actor || !heroes) return pickRandomAlive(alive2, rng);
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      for (const m of alive2) {
        const table = threat[m.id] ?? {};
        let maxT = -1;
        let topId = null;
        for (const h of aliveHeroes) {
          const t = table[h.id] ?? 0;
          if (t > maxT) {
            maxT = t;
            topId = h.id;
          }
        }
        if (topId != null && topId !== actor.id) return m;
      }
      return pickRandomAlive(alive2, rng);
    }
    if (targetRule === "highest-threat-on-actor") {
      const { threat, actor } = opts;
      if (!threat || !actor) return alive2[0];
      let best = null;
      let bestT = -1;
      for (const m of alive2) {
        const t = (threat[m.id] ?? {})[actor.id] ?? 0;
        if (t > bestT) {
          bestT = t;
          best = m;
        }
      }
      return best ?? alive2[0];
    }
    if (targetRule === "highest-threat") {
      const { threat, actor, heroes } = opts;
      if (!threat || !actor || !heroes) return alive2[0];
      const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0);
      const notTargetingSelf = alive2.filter((m) => {
        const table = threat[m.id] ?? {};
        let maxT = -1;
        let topId = null;
        for (const h of aliveHeroes) {
          const t = table[h.id] ?? 0;
          if (t > maxT) {
            maxT = t;
            topId = h.id;
          }
        }
        return topId !== actor.id;
      });
      const pool = notTargetingSelf.length > 0 ? notTargetingSelf : alive2;
      let best = null;
      let bestSum = -1;
      for (const m of pool) {
        const table = threat[m.id] ?? {};
        const sum = aliveHeroes.reduce((s, h) => s + (table[h.id] ?? 0), 0);
        if (sum > bestSum) {
          bestSum = sum;
          best = m;
        }
      }
      return best ?? alive2[0];
    }
    if (targetRule === "lowest-threat") {
      const { threat, actor } = opts;
      if (!threat || !actor) return alive2[0];
      let best = null;
      let bestT = Infinity;
      for (const m of alive2) {
        const table = threat[m.id] ?? {};
        const t = table[actor.id] ?? 0;
        if (t < bestT) {
          bestT = t;
          best = m;
        }
      }
      return best ?? alive2[0];
    }
    if (targetRule === "tank") {
      const { threat, heroes, monsters, getTank: getTankFn } = opts;
      if (!threat || !heroes || !getTankFn) return alive2[0];
      const tank = getTankFn(heroes, monsters ?? [], threat);
      if (tank) {
        const found = alive2.find((a) => a.id === tank.id);
        if (found) return found;
      }
      return alive2[0];
    }
    if (targetRule === "random") {
      return alive2[Math.floor(rng() * alive2.length)];
    }
    return alive2[0];
  }

  // frontend/src/game/heroDisplayName.js
  var HERO_NAME_SEP = "\xB7";
  function heroDisplayName(fullName) {
    if (typeof fullName !== "string" || fullName.length === 0) {
      return fullName == null ? "" : String(fullName);
    }
    const i = fullName.indexOf(HERO_NAME_SEP);
    if (i === -1) return fullName;
    const first = fullName.slice(0, i).trim();
    return first.length > 0 ? first : fullName;
  }

  // frontend/src/game/manaRegenConstants.js
  var MANA_REGEN_SPIRIT_SCALE = 0.5;

  // frontend/src/game/combat.js
  var CRIT_MULTIPLIER = 1.5;
  var HIT_CHANCE_FLOOR = 60;
  var HIT_CHANCE_CEIL = 99;
  var HIT_LEVEL_ADJUST_PER_LEVEL = 0.5;
  var HIT_LEVEL_ADJUST_CAP = 8;
  function computeFinalHitChance(attacker, defender) {
    const attackerHit = attacker?.hit ?? 95;
    const defenderDodge = defender?.dodge ?? 0;
    const attackerLevel = attacker?.level ?? 1;
    const defenderLevel = defender?.level ?? 1;
    const levelAdjustRaw = (attackerLevel - defenderLevel) * HIT_LEVEL_ADJUST_PER_LEVEL;
    const levelAdjust = clamp(levelAdjustRaw, -HIT_LEVEL_ADJUST_CAP, HIT_LEVEL_ADJUST_CAP);
    const finalHitChance = clamp(
      attackerHit - defenderDodge + levelAdjust,
      HIT_CHANCE_FLOOR,
      HIT_CHANCE_CEIL
    );
    return {
      attackerHit,
      defenderDodge,
      levelAdjust,
      finalHitChance,
      missChance: 100 - finalHitChance
    };
  }
  function rollHitCheck(attacker, defender, rng = Math.random) {
    const detail = computeFinalHitChance(attacker, defender);
    const roll = rng();
    return {
      ...detail,
      roll,
      isHit: roll * 100 < detail.finalHitChance
    };
  }
  var MAPS = [
    {
      id: "elwynn-forest",
      name: "\u827E\u5C14\u6587\u68EE\u6797",
      bossName: "\u970D\u683C",
      description: "\u9633\u5149\u900F\u8FC7\u53E4\u6A61\u6811\u7684\u6811\u51A0\u6D12\u843D\u3002\u8D8A\u5F80\u6DF1\u5904\uFF0C\u9E1F\u9E23\u6E10\u7A00\u2014\u2014\u5728\u6C99\u6C99\u4F5C\u54CD\u7684\u6811\u53F6\u4E0B\uFF0C\u5E7C\u72FC\u6F5C\u884C\uFF0C\u72D7\u5934\u4EBA\u77FF\u5DE5\u5728\u9634\u5F71\u4E2D\u7A7F\u68AD\u3002\u6BCF\u4F4D\u5192\u9669\u8005\u7684\u6545\u4E8B\u90FD\u4ECE\u8FD9\u91CC\u5F00\u59CB\u3002"
    },
    {
      id: "westfall",
      name: "\u897F\u90E8\u8352\u91CE",
      bossName: "\u827E\u5FB7\u6E29\xB7\u8303\u514B\u91CC\u592B",
      description: "\u91D1\u9EC4\u7684\u9EA6\u6D6A\u968F\u98CE\u6447\u66F3\uFF0C\u4E00\u671B\u65E0\u9645\u3002\u66FE\u662F\u738B\u56FD\u7684\u7CAE\u4ED3\uFF0C\u5982\u4ECA\u8FEA\u83F2\u4E9A\u5144\u5F1F\u4F1A\u76D8\u8E1E\u4E8E\u5E9F\u5F03\u519C\u5E84\u3002\u76D7\u532A\u85CF\u8EAB\u4E8E\u6BCF\u4E2A\u8349\u579B\u4E4B\u540E\uFF1B\u6536\u83B7\u4E4B\u6708\u5DF2\u67D3\u6210\u8840\u7EA2\u3002"
    },
    {
      id: "duskwood",
      name: "\u66AE\u8272\u68EE\u6797",
      bossName: "\u7F1D\u5408\u602A",
      description: "\u66AE\u8272\u6C38\u4E0D\u6563\u53BB\u3002\u626D\u66F2\u7684\u679D\u6860\u6293\u5411\u6C38\u4E0D\u653E\u6674\u7684\u5929\u7A7A\u3002\u7A7A\u6C14\u4E2D\u5F25\u6F2B\u7740\u8150\u673D\u7684\u6C14\u606F\u3002\u4EA1\u7075\u5728\u96FE\u4E2D\u8E52\u8DDA\uFF1B\u72FC\u4EBA\u7684\u568E\u53EB\u4ECE\u6DF1\u5904\u56DE\u8361\u3002\u4F60\u611F\u5230\u88AB\u4E0D\u518D\u6C89\u7761\u4E4B\u7269\u6CE8\u89C6\u7740\u3002"
    },
    {
      id: "redridge-mountains",
      name: "\u8D64\u810A\u5C71",
      bossName: "\u5361\u677E",
      description: "\u9661\u5CED\u7684\u60AC\u5D16\u76F4\u5165\u4E91\u7AEF\u3002\u72C2\u98CE\u5728\u72ED\u7A84\u7684\u5C71\u53E3\u547C\u5578\uFF0C\u9ED1\u77F3\u517D\u4EBA\u5DF2\u5728\u6B64\u624E\u6839\u3002\u5DE8\u578B\u8718\u86DB\u5728\u5C0F\u5F84\u4E0A\u7EC7\u7F51\u3002\u4E00\u6B65\u8E0F\u9519\uFF0C\u4FBF\u53EF\u80FD\u5760\u5165\u6DF1\u6E0A\u2014\u2014\u6216\u843D\u5165\u66F4\u53EF\u6015\u4E4B\u7269\u53E3\u4E2D\u3002"
    },
    {
      id: "stranglethorn-vale",
      name: "\u8346\u68D8\u8C37",
      bossName: "\u90A6\u52A0\u62C9\u4EC0",
      description: "\u4E1B\u6797\u5728\u547C\u5438\u2014\u2014\u6F6E\u6E7F\u3001\u7A92\u606F\u3002\u85E4\u8513\u7EDE\u7F20\u7740\u53E4\u8001\u5E9F\u589F\uFF1B\u8840\u9876\u90E8\u65CF\u7684\u9F13\u58F0\u5728\u8FDC\u5904\u56DE\u8361\u3002\u5F71\u7259\u8C79\u4ECE\u6811\u51A0\u6F5C\u884C\u800C\u4E0B\u3002\u6BCF\u4E00\u6B65\u90FD\u8E29\u788E\u67AF\u679D\uFF1B\u6BCF\u4E00\u9053\u9634\u5F71\u90FD\u53EF\u80FD\u662F\u4F60\u7684\u7EC8\u7ED3\u3002"
    }
  ];
  var MAP_MONSTER_POOLS = {
    "elwynn-forest": {
      normal: [
        {
          id: "young-wolf",
          name: "\u5E7C\u72FC",
          damageType: "physical",
          base: { hp: 19, physAtk: 8, spellPower: 0, agility: 7, armor: 2, resistance: 1 }
        },
        {
          id: "kobold-miner",
          name: "\u72D7\u5934\u4EBA\u77FF\u5DE5",
          damageType: "physical",
          base: { hp: 17, physAtk: 7, spellPower: 0, agility: 6, armor: 2, resistance: 1 }
        },
        {
          id: "defias-trapper",
          name: "\u8FEA\u83F2\u4E9A\u6355\u517D\u8005",
          damageType: "physical",
          base: { hp: 17, physAtk: 7, spellPower: 0, agility: 8, armor: 1, resistance: 1 }
        },
        {
          id: "forest-spider",
          name: "\u68EE\u6797\u8718\u86DB",
          damageType: "physical",
          base: { hp: 17, physAtk: 8, spellPower: 0, agility: 9, armor: 1, resistance: 1 }
        },
        {
          id: "timber-wolf",
          name: "\u68EE\u6797\u72FC",
          damageType: "physical",
          base: { hp: 19, physAtk: 9, spellPower: 0, agility: 8, armor: 2, resistance: 0 }
        }
      ],
      elite: [
        {
          id: "kobold-geomancer",
          name: "\u72D7\u5934\u4EBA\u5730\u535C\u5E08",
          damageType: "magic",
          skill: "stone-shard",
          base: { hp: 21, physAtk: 0, spellPower: 10, agility: 7, armor: 2, resistance: 3 }
        },
        {
          id: "defias-smuggler",
          name: "\u8FEA\u83F2\u4E9A\u8D70\u79C1\u72AF",
          damageType: "mixed",
          skill: "blackjack",
          base: { hp: 22, physAtk: 9, spellPower: 7, agility: 8, armor: 2, resistance: 2 }
        },
        {
          id: "defias-cutpurse",
          name: "\u8FEA\u83F2\u4E9A\u76D7\u8D3C",
          damageType: "physical",
          skill: "swift-cut",
          base: { hp: 20, physAtk: 10, spellPower: 0, agility: 9, armor: 2, resistance: 1 }
        }
      ],
      boss: {
        id: "hogger",
        name: "\u970D\u683C",
        damageType: "mixed",
        skill: "rend",
        base: { hp: 43, physAtk: 14, spellPower: 8, agility: 10, armor: 5, resistance: 5 }
      },
      levelRange: { min: -1, max: 2 }
    },
    westfall: {
      normal: [
        {
          id: "defias-bandit",
          name: "\u8FEA\u83F2\u4E9A\u5F3A\u76D7",
          damageType: "physical",
          base: { hp: 20, physAtk: 9, spellPower: 0, agility: 8, armor: 2, resistance: 1 }
        },
        {
          id: "harvest-watcher",
          name: "\u6536\u5272\u5080\u5121",
          damageType: "physical",
          base: { hp: 22, physAtk: 8, spellPower: 0, agility: 5, armor: 4, resistance: 2 }
        },
        {
          id: "westfall-vulture",
          name: "\u897F\u90E8\u79C3\u9E6B",
          damageType: "physical",
          base: { hp: 19, physAtk: 9, spellPower: 0, agility: 10, armor: 1, resistance: 1 }
        },
        {
          id: "defias-worker",
          name: "\u8FEA\u83F2\u4E9A\u5DE5\u4EBA",
          damageType: "physical",
          base: { hp: 21, physAtk: 8, spellPower: 0, agility: 6, armor: 3, resistance: 1 }
        },
        {
          id: "mine-spider",
          name: "\u77FF\u6D1E\u8718\u86DB",
          damageType: "physical",
          base: { hp: 20, physAtk: 9, spellPower: 0, agility: 9, armor: 2, resistance: 1 }
        }
      ],
      elite: [
        {
          id: "defias-pathstalker",
          name: "\u8FEA\u83F2\u4E9A\u8DDF\u8E2A\u8005",
          damageType: "physical",
          skill: "swift-cut",
          base: { hp: 23, physAtk: 11, spellPower: 0, agility: 10, armor: 2, resistance: 2 }
        },
        {
          id: "harvest-reaper",
          name: "\u6536\u5272\u8005",
          damageType: "physical",
          skill: "blackjack",
          base: { hp: 25, physAtk: 10, spellPower: 0, agility: 6, armor: 5, resistance: 2 }
        },
        {
          id: "defias-lieutenant",
          name: "\u8FEA\u83F2\u4E9A\u526F\u5B98",
          damageType: "mixed",
          skill: "blackjack",
          base: { hp: 24, physAtk: 10, spellPower: 8, agility: 9, armor: 3, resistance: 3 }
        }
      ],
      boss: {
        id: "vancleef",
        name: "\u827E\u5FB7\u6E29\xB7\u8303\u514B\u91CC\u592B",
        damageType: "mixed",
        skill: "blackjack",
        base: { hp: 48, physAtk: 16, spellPower: 10, agility: 12, armor: 6, resistance: 6 }
      },
      levelRange: { min: 0, max: 2 }
    },
    duskwood: {
      normal: [
        {
          id: "skeleton",
          name: "\u9AB7\u9AC5",
          damageType: "physical",
          base: { hp: 22, physAtk: 9, spellPower: 0, agility: 6, armor: 3, resistance: 2 }
        },
        {
          id: "nightbane-worgen",
          name: "\u591C\u884C\u72FC\u4EBA",
          damageType: "physical",
          base: { hp: 23, physAtk: 11, spellPower: 0, agility: 9, armor: 2, resistance: 2 }
        },
        {
          id: "rotting-corpse",
          name: "\u8150\u70C2\u7684\u5C38\u4F53",
          damageType: "physical",
          base: { hp: 24, physAtk: 8, spellPower: 0, agility: 4, armor: 2, resistance: 3 }
        },
        {
          id: "ghoul",
          name: "\u98DF\u5C38\u9B3C",
          damageType: "physical",
          base: { hp: 22, physAtk: 10, spellPower: 0, agility: 7, armor: 2, resistance: 2 }
        },
        {
          id: "dusk-spider",
          name: "\u66AE\u8272\u8718\u86DB",
          damageType: "physical",
          base: { hp: 21, physAtk: 10, spellPower: 0, agility: 10, armor: 1, resistance: 2 }
        }
      ],
      elite: [
        {
          id: "skeletal-fiend",
          name: "\u9AB7\u9AC5\u9B54",
          damageType: "magic",
          skill: "stone-shard",
          base: { hp: 25, physAtk: 0, spellPower: 12, agility: 7, armor: 3, resistance: 4 }
        },
        {
          id: "nightbane-dark-runner",
          name: "\u591C\u884C\u9ED1\u6697\u884C\u8005",
          damageType: "physical",
          skill: "swift-cut",
          base: { hp: 24, physAtk: 12, spellPower: 0, agility: 11, armor: 3, resistance: 2 }
        },
        {
          id: "plague-spreader",
          name: "\u761F\u75AB\u4F20\u64AD\u8005",
          damageType: "mixed",
          skill: "swift-cut",
          base: { hp: 26, physAtk: 9, spellPower: 9, agility: 8, armor: 3, resistance: 4 }
        }
      ],
      boss: {
        id: "stitches",
        name: "\u7F1D\u5408\u602A",
        damageType: "mixed",
        skill: "rend",
        base: { hp: 54, physAtk: 15, spellPower: 12, agility: 8, armor: 7, resistance: 7 }
      },
      levelRange: { min: 0, max: 3 }
    },
    "redridge-mountains": {
      normal: [
        {
          id: "blackrock-spy",
          name: "\u9ED1\u77F3\u95F4\u8C0D",
          damageType: "physical",
          base: { hp: 24, physAtk: 10, spellPower: 0, agility: 9, armor: 3, resistance: 2 }
        },
        {
          id: "blackrock-worg",
          name: "\u9ED1\u77F3\u5EA7\u72FC",
          damageType: "physical",
          base: { hp: 25, physAtk: 11, spellPower: 0, agility: 8, armor: 3, resistance: 1 }
        },
        {
          id: "tarantula",
          name: "\u72FC\u86DB",
          damageType: "physical",
          base: { hp: 23, physAtk: 10, spellPower: 0, agility: 11, armor: 2, resistance: 2 }
        },
        {
          id: "redridge-boar",
          name: "\u8D64\u810A\u91CE\u732A",
          damageType: "physical",
          base: { hp: 26, physAtk: 10, spellPower: 0, agility: 6, armor: 4, resistance: 1 }
        },
        {
          id: "ridge-condor",
          name: "\u5C71\u810A\u79C3\u9E70",
          damageType: "physical",
          base: { hp: 22, physAtk: 11, spellPower: 0, agility: 12, armor: 1, resistance: 2 }
        }
      ],
      elite: [
        {
          id: "blackrock-scout",
          name: "\u9ED1\u77F3\u65A5\u5019",
          damageType: "physical",
          skill: "blackjack",
          base: { hp: 27, physAtk: 12, spellPower: 0, agility: 10, armor: 4, resistance: 3 }
        },
        {
          id: "broodmother",
          name: "\u80B2\u6BCD\u8718\u86DB",
          damageType: "mixed",
          skill: "swift-cut",
          base: { hp: 29, physAtk: 10, spellPower: 9, agility: 9, armor: 3, resistance: 4 }
        },
        {
          id: "blackrock-grunt",
          name: "\u9ED1\u77F3\u6B65\u5175",
          damageType: "physical",
          skill: "rend",
          base: { hp: 28, physAtk: 13, spellPower: 0, agility: 7, armor: 5, resistance: 2 }
        }
      ],
      boss: {
        id: "kazon",
        name: "\u5361\u677E",
        damageType: "physical",
        skill: "rend",
        base: { hp: 60, physAtk: 18, spellPower: 0, agility: 11, armor: 8, resistance: 5 }
      },
      levelRange: { min: 1, max: 3 }
    },
    "stranglethorn-vale": {
      normal: [
        {
          id: "jungle-stalker",
          name: "\u4E1B\u6797\u6F5C\u884C\u8005",
          damageType: "physical",
          base: { hp: 26, physAtk: 11, spellPower: 0, agility: 12, armor: 2, resistance: 2 }
        },
        {
          id: "bloodscalp-scout",
          name: "\u8840\u9876\u65A5\u5019",
          damageType: "physical",
          base: { hp: 25, physAtk: 12, spellPower: 0, agility: 10, armor: 3, resistance: 2 }
        },
        {
          id: "shadowmaw-panther",
          name: "\u5F71\u7259\u730E\u8C79",
          damageType: "physical",
          base: { hp: 24, physAtk: 13, spellPower: 0, agility: 13, armor: 2, resistance: 1 }
        },
        {
          id: "jungle-troll",
          name: "\u4E1B\u6797\u5DE8\u9B54",
          damageType: "physical",
          base: { hp: 27, physAtk: 11, spellPower: 0, agility: 8, armor: 4, resistance: 2 }
        },
        {
          id: "stranglethorn-raptor",
          name: "\u8346\u68D8\u8C37\u8FC5\u731B\u9F99",
          damageType: "physical",
          base: { hp: 26, physAtk: 12, spellPower: 0, agility: 11, armor: 3, resistance: 1 }
        }
      ],
      elite: [
        {
          id: "bloodscalp-berserker",
          name: "\u8840\u9876\u72C2\u6218\u58EB",
          damageType: "physical",
          skill: "rend",
          base: { hp: 30, physAtk: 14, spellPower: 0, agility: 10, armor: 4, resistance: 3 }
        },
        {
          id: "elder-shadowmaw",
          name: "\u5E74\u8FC8\u7684\u5F71\u7259",
          damageType: "physical",
          skill: "swift-cut",
          base: { hp: 28, physAtk: 13, spellPower: 0, agility: 14, armor: 3, resistance: 2 }
        },
        {
          id: "bloodscalp-mystic",
          name: "\u8840\u9876\u79D8\u6CD5\u5E08",
          damageType: "magic",
          skill: "stone-shard",
          base: { hp: 27, physAtk: 0, spellPower: 14, agility: 9, armor: 3, resistance: 5 }
        }
      ],
      boss: {
        id: "king-bangalash",
        name: "\u90A6\u52A0\u62C9\u4EC0",
        damageType: "mixed",
        skill: "rend",
        base: { hp: 66, physAtk: 20, spellPower: 12, agility: 13, armor: 9, resistance: 8 }
      },
      levelRange: { min: 1, max: 4 }
    }
  };
  var TIER_MULTIPLIER = {
    normal: 1.15,
    elite: 1.5,
    boss: 2.8
  };
  var MONSTER_LEVEL_REF_SCALE = 0.096;
  var MONSTER_LEVEL_SEGMENT_END = 10;
  var MONSTER_LEVEL_EARLY_SCALE = 0.14;
  var MONSTER_LEVEL_LATE_SCALE = (60 * MONSTER_LEVEL_REF_SCALE - MONSTER_LEVEL_SEGMENT_END * MONSTER_LEVEL_EARLY_SCALE) / (60 - MONSTER_LEVEL_SEGMENT_END);
  function monsterPowerFactorFromLevel(level) {
    const L = Math.max(1, Math.min(60, level));
    const L0 = MONSTER_LEVEL_SEGMENT_END;
    if (L <= L0) {
      return 1 + L * MONSTER_LEVEL_EARLY_SCALE;
    }
    const base = 1 + L0 * MONSTER_LEVEL_EARLY_SCALE;
    return base + (L - L0) * MONSTER_LEVEL_LATE_SCALE;
  }
  var MONSTER_AGILITY_POWER_BLEND = 0.4;
  var MONSTER_AGILITY_BASE_MULT = 0.9;
  function monsterAgilityFromFactor(baseAgility, factor) {
    const blended = 1 + (factor - 1) * MONSTER_AGILITY_POWER_BLEND;
    return Math.max(1, Math.round(baseAgility * blended * MONSTER_AGILITY_BASE_MULT));
  }
  function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function pickRandom2(list, rng) {
    const index = Math.floor(rng() * list.length);
    return list[clamp(index, 0, list.length - 1)];
  }
  function createInitialProgress() {
    return {
      unlockedMapCount: 1,
      currentMapId: MAPS[0].id,
      currentProgress: 0,
      bossAvailable: false
    };
  }
  function getRecruitLimit(progress) {
    const n = progress?.unlockedMapCount ?? 1;
    return clamp(2 + n, 3, 5);
  }
  function shouldPromptExpansionRecruitAfterBoss({
    prevUnlockedMapCount,
    progress,
    squadLength,
    explorationSettlement
  }) {
    if (explorationSettlement?.mode !== "boss_unlock") return false;
    if (prevUnlockedMapCount > 2) return false;
    return squadLength < getRecruitLimit(progress);
  }
  function isDruidOnlyExpansionSlot(progress, squadLength) {
    const n = progress?.unlockedMapCount ?? 1;
    return n >= 2 && squadLength === 3;
  }
  function getSquadMinLevel(squad) {
    if (!Array.isArray(squad) || squad.length === 0) return 1;
    return Math.min(...squad.map((h) => Math.max(1, h.level ?? 1)));
  }
  function getExpansionHeroLevel(progress, squad) {
    const n = progress?.unlockedMapCount ?? 1;
    if (n <= 1) return 1;
    return getSquadMinLevel(squad);
  }
  var DEFEAT_EXPLORATION_DEDUCTION = 10;
  var EXPLORATION_BASE_GAIN = {
    normal: 1,
    elite: 2
  };
  var REWARD_TIER_WEIGHT = {
    normal: 1,
    elite: 2,
    boss: 5
  };
  var REWARD_BASE_EXP = 12;
  var REWARD_BASE_GOLD = 7;
  var REWARD_LEVEL_BONUS_PER_LEVEL = 0.06;
  var EXPLORATION_MONSTER_POWER_BAND_SIZE = 25;
  var EXPLORATION_MONSTER_POWER_PER_BAND = 0.08;
  var MONSTER_ARMOR_PEN_BY_TIER = {
    normal: 2,
    elite: 5,
    boss: 10
  };
  var MONSTER_SPELL_PEN_BY_TIER = {
    normal: 1,
    elite: 3,
    boss: 8
  };
  var EXPLORATION_PEN_PER_BAND = {
    phys: 1,
    spell: 1
  };
  function explorationMonsterPowerMultiplier(explorationProgress) {
    const progress = clamp(Math.floor(explorationProgress ?? 0), 0, 99);
    const bands = Math.floor(progress / EXPLORATION_MONSTER_POWER_BAND_SIZE);
    return 1 + bands * EXPLORATION_MONSTER_POWER_PER_BAND;
  }
  function computeExplorationKillGain(tier, monsterLevel, referenceLevel) {
    const base = EXPLORATION_BASE_GAIN[tier] ?? 0;
    if (base <= 0) return 0;
    const ref = Math.max(1, Math.floor(referenceLevel ?? 1));
    const level = Math.max(1, Math.floor(monsterLevel ?? 1));
    const ratio = Math.min(1, level / ref);
    return Math.max(0, Math.round(base * ratio));
  }
  function rewardLevelMultiplier(monsterLevel) {
    const level = Math.max(1, Math.floor(monsterLevel ?? 1));
    return 1 + (level - 1) * REWARD_LEVEL_BONUS_PER_LEVEL;
  }
  function computeMonsterRewardContribution(tier, monsterLevel) {
    const weight = REWARD_TIER_WEIGHT[tier] ?? REWARD_TIER_WEIGHT.normal;
    const mult = rewardLevelMultiplier(monsterLevel);
    return {
      exp: Math.max(0, Math.round(REWARD_BASE_EXP * weight * mult)),
      gold: Math.max(0, Math.round(REWARD_BASE_GOLD * weight * mult))
    };
  }
  function computeVictoryRewards(monsters, dropModifiers = {}) {
    if (!monsters?.length) {
      return { exp: 0, gold: 0 };
    }
    let exp = 0;
    let goldBeforeFind = 0;
    for (const m of monsters) {
      const contrib = computeMonsterRewardContribution(m.tier ?? "normal", m.level ?? 1);
      exp += contrib.exp;
      goldBeforeFind += contrib.gold;
    }
    const goldFindPct = Math.max(0, dropModifiers.goldFindPct ?? 0);
    const gold = Math.max(0, Math.floor(goldBeforeFind * (1 + goldFindPct / 100)));
    return { exp, gold };
  }
  function monsterPenetrationForTier(tier, explorationProgress = 0) {
    const bands = Math.floor(clamp(Math.floor(explorationProgress ?? 0), 0, 99) / EXPLORATION_MONSTER_POWER_BAND_SIZE);
    if (bands <= 0) {
      return { physArmorPen: 0, spellPen: 0 };
    }
    const extraBands = bands - 1;
    return {
      physArmorPen: (MONSTER_ARMOR_PEN_BY_TIER[tier] ?? 0) + extraBands * EXPLORATION_PEN_PER_BAND.phys,
      spellPen: (MONSTER_SPELL_PEN_BY_TIER[tier] ?? 0) + extraBands * EXPLORATION_PEN_PER_BAND.spell
    };
  }
  function addExplorationProgress(progress, killTier, opts = {}) {
    const gain = computeExplorationKillGain(
      killTier,
      opts.monsterLevel ?? 1,
      opts.referenceLevel ?? 1
    );
    const nextProgress = clamp(progress.currentProgress + gain, 0, 100);
    return {
      ...progress,
      currentProgress: nextProgress,
      bossAvailable: nextProgress >= 100
    };
  }
  function deductExplorationProgress(progress, amount = DEFEAT_EXPLORATION_DEDUCTION) {
    const nextProgress = clamp(progress.currentProgress - amount, 0, 100);
    return {
      ...progress,
      currentProgress: nextProgress,
      bossAvailable: nextProgress >= 100
    };
  }
  function unlockNextMapAfterBoss(progress) {
    const nextUnlocked = clamp(progress.unlockedMapCount + 1, 1, MAPS.length);
    const currentMap = MAPS[nextUnlocked - 1];
    return {
      ...progress,
      unlockedMapCount: nextUnlocked,
      currentMapId: currentMap.id,
      currentProgress: 0,
      bossAvailable: false
    };
  }
  function settleVictoryExploration(progress, monsters, opts = {}) {
    const isBossEncounter = monsters.some((m) => m.tier === "boss");
    if (isBossEncounter) {
      return {
        progress: unlockNextMapAfterBoss(progress),
        exploration: { mode: "boss_unlock" }
      };
    }
    const referenceLevel = opts.referenceLevel ?? Math.max(1, ...monsters.map((m) => Math.floor(m.level ?? 1)));
    const before = progress.currentProgress;
    let p = progress;
    for (const m of monsters) {
      if (m.tier === "normal" || m.tier === "elite") {
        p = addExplorationProgress(p, m.tier, {
          monsterLevel: m.level ?? 1,
          referenceLevel
        });
      }
    }
    return {
      progress: p,
      exploration: { mode: "gain", delta: p.currentProgress - before }
    };
  }
  function settleDefeatExploration(progress, amount = DEFEAT_EXPLORATION_DEDUCTION) {
    const before = progress.currentProgress;
    const next = deductExplorationProgress(progress, amount);
    return {
      progress: next,
      exploration: { mode: "penalty", delta: next.currentProgress - before }
    };
  }
  function generateEncounterSize(squadSize, distribution, rng = Math.random) {
    const safeSquadSize = clamp(squadSize, 1, 5);
    const roll = rng();
    if (roll < distribution.equal) {
      return safeSquadSize;
    }
    if (roll < distribution.equal + distribution.fewer) {
      const drop = rng() < 0.5 ? 1 : 2;
      return clamp(safeSquadSize - drop, 1, 5);
    }
    const add = rng() < 0.5 ? 1 : 2;
    return clamp(safeSquadSize + add, 1, 5);
  }
  function capEncounterSizeForNewbieProtection(count, squadSize, squadMinLevel) {
    const safeCount = clamp(count, 1, 5);
    const safeSquadSize = clamp(squadSize, 1, 5);
    if (squadMinLevel === 1 && safeSquadSize > 1) {
      return clamp(Math.min(safeCount, safeSquadSize - 1), 1, 5);
    }
    if (squadMinLevel === 2) {
      return clamp(Math.min(safeCount, safeSquadSize), 1, 5);
    }
    return safeCount;
  }
  function generateBossMinionCount(squadSize, rng = Math.random) {
    const safeSquadSize = clamp(squadSize, 1, 5);
    return Math.floor(rng() * safeSquadSize);
  }
  function createMonster(template, options = {}) {
    const tier = options.tier ?? "normal";
    const level = options.level ?? 1;
    const explorationMult = options.explorationPowerMult ?? explorationMonsterPowerMultiplier(options.explorationProgress ?? 0);
    const multiplier = TIER_MULTIPLIER[tier] ?? 1;
    const powerInner = options.powerFactorOverride ?? monsterPowerFactorFromLevel(level);
    const factor = multiplier * powerInner * explorationMult;
    const base = template.base;
    const pen = monsterPenetrationForTier(tier, options.explorationProgress ?? 0);
    return {
      id: `${template.id}-${tier}-${level}-${Math.floor(Math.random() * 1e5)}`,
      typeId: template.id,
      name: template.name,
      tier,
      level,
      damageType: template.damageType ?? "physical",
      skill: template.skill ?? null,
      maxHP: Math.round(base.hp * factor),
      currentHP: Math.round(base.hp * factor),
      physAtk: Math.round(base.physAtk * factor),
      spellPower: Math.round(base.spellPower * factor),
      agility: monsterAgilityFromFactor(base.agility, factor),
      armor: Math.round(base.armor * factor) + Math.floor(level * 0.5),
      resistance: Math.round(base.resistance * factor) + Math.floor(level * 0.5),
      physArmorPen: pen.physArmorPen,
      spellPen: pen.spellPen,
      skillChance: tier === "normal" ? 0 : tier === "elite" ? 0.35 : 0.45,
      physCrit: tier === "normal" ? 0.05 : tier === "elite" ? 0.1 : 0.1,
      spellCrit: tier === "normal" ? 0.05 : tier === "elite" ? 0.1 : 0.1,
      hit: tier === "normal" ? 95 : tier === "elite" ? 97 : 99,
      dodge: 5
    };
  }
  function randomLevelInRange(baseLevel, range, rng) {
    const { min: offsetMin, max: offsetMax } = range ?? { min: -1, max: 2 };
    const offset = Math.floor(rng() * (offsetMax - offsetMin + 1)) + offsetMin;
    return clamp(baseLevel + offset, 1, 60);
  }
  function buildEncounterMonsters({
    mapId,
    squadSize,
    distribution = { equal: 0.7, fewer: 0.15, more: 0.15 },
    rng = Math.random,
    level = 1,
    forceBoss = false,
    /** When squad average level is below 5, rolled enemy levels are capped to floor(squadAverageLevel). Omit to disable. */
    squadAverageLevel = null,
    /** Min squad hero level: 1 caps count below squadSize; 2 caps at squadSize. Omit to disable. */
    squadMinLevel = null,
    /** Current map exploration 0-100; scales monster stats and penetration before boss fight. */
    explorationProgress = 0
  }) {
    const pool = MAP_MONSTER_POOLS[mapId] ?? MAP_MONSTER_POOLS["elwynn-forest"];
    const levelRange = pool.levelRange ?? { min: -1, max: 2 };
    const earlyLevelCap = squadAverageLevel != null && squadAverageLevel < 5 ? Math.max(1, Math.floor(squadAverageLevel)) : null;
    const applyEarlyCap = (monsterLevel) => earlyLevelCap == null ? monsterLevel : Math.min(monsterLevel, earlyLevelCap);
    const explorationForScale = forceBoss ? Math.min(99, Math.max(0, explorationProgress)) : explorationProgress;
    if (forceBoss) {
      const bossLevel = applyEarlyCap(randomLevelInRange(level, levelRange, rng));
      const monsters2 = [
        createMonster(pool.boss, {
          tier: "boss",
          level: bossLevel,
          explorationProgress: explorationForScale
        })
      ];
      const minionCount = generateBossMinionCount(squadSize, rng);
      for (let i = 0; i < minionCount; i += 1) {
        const isElite = rng() < 0.25;
        const tier = isElite ? "elite" : "normal";
        const template = isElite ? pickRandom2(pool.elite, rng) : pickRandom2(pool.normal, rng);
        const monsterLevel = applyEarlyCap(randomLevelInRange(level, levelRange, rng));
        monsters2.push(
          createMonster(template, { tier, level: monsterLevel, explorationProgress: explorationForScale })
        );
      }
      return monsters2;
    }
    const count = capEncounterSizeForNewbieProtection(
      generateEncounterSize(squadSize, distribution, rng),
      squadSize,
      squadMinLevel
    );
    const monsters = [];
    for (let i = 0; i < count; i += 1) {
      const isElite = rng() < 0.25;
      const tier = isElite ? "elite" : "normal";
      const template = isElite ? pickRandom2(pool.elite, rng) : pickRandom2(pool.normal, rng);
      const monsterLevel = applyEarlyCap(randomLevelInRange(level, levelRange, rng));
      monsters.push(
        createMonster(template, { tier, level: monsterLevel, explorationProgress: explorationForScale })
      );
    }
    return monsters;
  }
  function applyDamage(rawDamage, damageType, target, penOpts = {}) {
    const hasPen = (penOpts.armorPen ?? 0) > 0 || (penOpts.spellPen ?? 0) > 0 || (penOpts.ignoreArmorPct ?? 0) > 0 || (penOpts.ignoreResistPct ?? 0) > 0;
    let defense;
    if (hasPen) {
      defense = damageType === "magic" ? computeMagicDefenseAfterWeapon(target, penOpts) : computePhysicalDefenseAfterWeapon(target, penOpts);
    } else if (damageType === "magic") {
      defense = getEffectiveResistance(target);
    } else {
      defense = getEffectiveArmor(target);
    }
    const finalDamage = Math.max(1, Math.round(rawDamage) - defense);
    const absorbed = Math.round(rawDamage) - finalDamage;
    return {
      damageType,
      absorbed,
      finalDamage,
      effectiveDefense: defense,
      nextHP: Math.max(0, (target.currentHP || 0) - finalDamage)
    };
  }
  function randomInRange5(min, max, rng) {
    return min + Math.floor(rng() * (max - min + 1));
  }
  function heroMitigationNoteKind(actor, damageType) {
    if (actor?.side !== "hero") return null;
    if (damageType === "physical") {
      if ((actor.physArmorPen ?? 0) > 0 || (actor.physIgnoreArmorPct ?? 0) > 0) return "physical";
    }
    if (damageType === "magic") {
      if ((actor.spellPen ?? 0) > 0 || (actor.spellIgnoreResistPct ?? 0) > 0) return "magic";
    }
    return null;
  }
  function heroCombatStats(hero) {
    const maxHP = computeHeroMaxHP(hero);
    const maxMP = computeHeroMaxMP(hero);
    const eq = getEquipmentBonuses(hero?.equipment);
    const crit = getClassCritRates(hero.class, {
      agility: hero.agility + (eq?.agility || 0),
      intellect: hero.intellect + (eq?.intellect || 0)
    });
    const baseAttr = getPhysBaseAttr(hero);
    const physMultiplier = 1 + baseAttr * PHYS_MULTIPLIER_K;
    const spellBaseAttr = getSpellBaseAttr(hero);
    const spellMultiplier = 1 + spellBaseAttr * SPELL_MULTIPLIER_K;
    const dodgeBase = 5 + (hero.agility + (eq?.agility || 0)) * (CLASS_COEFFICIENTS[hero.class]?.k_Dodge || 0);
    const hitBase = 95 + (hero.agility + (eq?.agility || 0)) * 0.2;
    return {
      id: hero.id,
      name: heroDisplayName(hero.name),
      side: "hero",
      class: hero.class,
      level: hero.level ?? 1,
      xp: hero.xp ?? 0,
      unassignedPoints: hero.unassignedPoints ?? 0,
      agility: hero.agility,
      armor: computeHeroArmor(hero),
      resistance: computeHeroResistance(hero),
      physMultiplier,
      physAtkBonus: (eq?.physAtk ?? 0) + (eq?.physWeaponFlat ?? 0),
      physAtkWeaponMin: eq?.physAtkMin ?? void 0,
      physAtkWeaponMax: eq?.physAtkMax ?? void 0,
      spellMultiplier,
      spellPowerBonus: (eq?.spellPower ?? 0) + (eq?.spellWeaponFlat ?? 0),
      spellPowerWeaponMin: eq?.spellPowerMin ?? void 0,
      spellPowerWeaponMax: eq?.spellPowerMax ?? void 0,
      physCrit: crit.physCrit + (eq?.physCritPct ?? 0) / 100,
      spellCrit: crit.spellCrit + (eq?.spellCritPct ?? 0) / 100,
      dodge: Math.round((dodgeBase + (eq?.dodgePct ?? 0)) * 10) / 10,
      hit: Math.round((hitBase + (eq?.hitPct ?? 0)) * 10) / 10,
      physCritMult: CRIT_MULTIPLIER + (eq?.physCritDmgPct ?? 0) / 100,
      spellCritMult: CRIT_MULTIPLIER + (eq?.spellCritDmgPct ?? 0) / 100,
      physArmorPen: eq?.armorPen ?? 0,
      physIgnoreArmorPct: eq?.ignoreArmorPct ?? 0,
      physDmgPct: eq?.physDmgPct ?? 0,
      lifeStealPct: eq?.lifeStealPct ?? 0,
      lifeOnHit: eq?.lifeOnHit ?? 0,
      addedMagicDmgMin: eq?.addedMagicDmgMin ?? 0,
      addedMagicDmgMax: eq?.addedMagicDmgMax ?? 0,
      spellPen: eq?.spellPen ?? 0,
      spellIgnoreResistPct: eq?.ignoreResistPct ?? 0,
      spellDmgPct: eq?.spellDmgPct ?? 0,
      manaRefluxPct: eq?.manaRefluxPct ?? 0,
      manaOnCast: eq?.manaOnCast ?? 0,
      arcaneFollowupMin: eq?.arcaneFollowupMin ?? 0,
      arcaneFollowupMax: eq?.arcaneFollowupMax ?? 0,
      maxHP,
      currentHP: hero.currentHP ?? maxHP,
      maxMP,
      // Warriors start each combat at 0 Rage
      currentMP: hero.class === "Warrior" ? 0 : hero.currentMP ?? maxMP,
      equipmentRecoveryBonus: (hero.equipmentRecoveryBonus ?? 0) + (eq?.manaRegen ?? 0),
      hpRegen: eq?.hpRegen ?? 0,
      physDrPct: eq?.physDrPct ?? 0,
      lifeOnKill: eq?.lifeOnKill ?? 0,
      thorns: eq?.thorns ?? 0,
      blockPct: eq?.blockPct ?? 0,
      blockDrPct: eq?.blockDrPct ?? 0,
      blockCounter: eq?.blockCounter ?? 0,
      rageGenPct: eq?.rageGenPct ?? 0,
      rageOnKill: eq?.rageOnKill ?? 0,
      doubleStrikePct: eq?.doubleStrikePct ?? 0,
      spirit: hero.spirit,
      skills: getHeroSkillIds(hero),
      skillEnhancements: hero.skillEnhancements ?? {},
      debuffs: [],
      buffs: [],
      tactics: hero.tactics ?? null,
      hitThisRound: false,
      skillCooldowns: {}
    };
  }
  function alive(units) {
    return units.filter((u) => u.currentHP > 0);
  }
  function shuffleTiesByRng(units, rng) {
    return units.map((u) => ({ key: rng(), value: u })).sort((a, b) => a.key - b.key).map((entry) => entry.value);
  }
  function orderUnitsByAgility(units, rng) {
    const all = [...units];
    all.sort((a, b) => b.agility - a.agility);
    const grouped = [];
    for (const unit of all) {
      const last = grouped[grouped.length - 1];
      if (last && last.agility === unit.agility) {
        last.members.push(unit);
      } else {
        grouped.push({ agility: unit.agility, members: [unit] });
      }
    }
    const ordered = [];
    for (const group of grouped) {
      const tieOrdered = group.members.length > 1 ? shuffleTiesByRng(group.members, rng) : group.members;
      ordered.push(...tieOrdered);
    }
    return ordered;
  }
  function buildRoundOrder(heroes, monsters, rng, options = {}) {
    const { round = 1, designatedTank = null } = options;
    const all = [...alive(heroes), ...alive(monsters)];
    if (all.length === 0) return [];
    if (round === 1) {
      const heroAlive = alive(heroes);
      if (heroAlive.length > 0) {
        let opener = null;
        if (designatedTank && heroAlive.some((h) => h.id === designatedTank.id)) {
          opener = heroAlive.find((h) => h.id === designatedTank.id);
        } else {
          opener = pickRandom2(heroAlive, rng);
        }
        const rest = all.filter((u) => u.id !== opener.id);
        return [opener, ...orderUnitsByAgility(rest, rng)];
      }
    }
    return orderUnitsByAgility(all, rng);
  }
  var ALLY_TARGET_SKILLS = ["flash-heal", "power-word-shield", "greater-heal", "rejuvenation", "regrowth", "lay-on-hands"];
  function heroAllPrioritySkillsUnaffordable(actor, priority) {
    if (!actor || !Array.isArray(priority) || priority.length === 0) return false;
    const mp = actor.currentMP || 0;
    const cls = actor.class;
    for (const skillId of priority) {
      if (skillId === "basic-attack") return false;
      if (cls === "Mage") {
        const skill = getMageSkillWithEnhancements(actor, skillId) ?? getAnyMageSkillById(skillId);
        const cost = skill?.manaCost ?? skill?.rageCost ?? 999;
        if (skill && cost <= mp) return false;
      } else if (cls === "Priest") {
        const skill = getPriestSkillWithEnhancements(actor, skillId) ?? getAnyPriestSkillById(skillId);
        const cost = skill?.manaCost ?? 999;
        if (skill && cost <= mp) return false;
      } else if (cls === "Druid") {
        const skill = getDruidSkillWithEnhancements(actor, skillId) ?? getAnyDruidSkillById(skillId);
        const cost = skill?.manaCost ?? 999;
        if (skill && cost <= mp) return false;
      } else if (cls === "Paladin") {
        const skill = getPaladinSkillWithEnhancements(actor, skillId) ?? getAnyPaladinSkillById(skillId);
        const cost = skill?.manaCost ?? 999;
        if (skill && cost <= mp) return false;
      } else if (cls === "Warrior") {
        const skill = getSkillWithEnhancements(actor, skillId) ?? getAnyWarriorSkillById(skillId);
        const cost = skill?.rageCost ?? 0;
        if (skill && cost <= mp) return false;
      } else {
        return false;
      }
    }
    return true;
  }
  function pickTarget(actor, heroes, monsters, opts = {}) {
    const { threat, tauntState, skillId, conditions, rng, designatedTank, round, monsterLastTarget } = opts;
    if (actor.side === "monster") {
      const lastId = monsterLastTarget?.[actor.id] ?? null;
      return getMonsterTarget(actor, heroes, threat ?? {}, tauntState ?? {}, rng, lastId);
    }
    const conditionsList = conditions ?? getConditions(actor);
    const cond = skillId ? conditionsList.find((c) => c.skillId === skillId) : null;
    const chain = getTargetRuleChain(actor, skillId || "", conditionsList);
    const targetAllies = skillId && ALLY_TARGET_SKILLS.includes(skillId);
    let candidates = targetAllies ? alive(heroes) : alive(monsters);
    if (skillId === "power-word-shield") {
      candidates = candidates.filter((u) => !getShieldBuff(u));
    }
    let filtered = cond && !tacticsHpRatioWhenSkipsPreFilter(cond) ? filterTargetsByCondition(candidates, cond, actor, opts) : candidates;
    const getTankFn = designatedTank != null ? (h, m, t) => getTank(h, m, t, designatedTank) : getTank;
    const globalDefault = actor.tactics?.targetRule || "first";
    for (let stepIndex = 0; stepIndex < chain.length; stepIndex++) {
      const step = chain[stepIndex];
      if (isUnsafePlainLowestAllyFallbackAfterEmergencyTriage(chain, stepIndex, step, skillId)) continue;
      const stepRule = typeof step === "string" ? step : step.rule;
      const stepCtx = { threat, tauntState, tankId: designatedTank?.id, round, rng };
      if (typeof step === "object" && step !== null) {
        if (!evaluateTargetRuleStepGates(step, actor, heroes, monsters, stepCtx)) continue;
      }
      const resolved = stepRule === TACTICS_TARGET_RULE_INHERIT ? globalDefault : stepRule;
      let pool = filtered;
      let rule = resolved;
      if (targetAllies && resolved === "lowest-hp-ally") {
        let triageTh = typeof step === "object" && step !== null ? getAllyHpBelowThresholdFromStep(step) : null;
        if (triageTh == null && step === "lowest-hp-ally" && cond?.when === "ally-hp-below") {
          triageTh = typeof cond.value === "number" ? cond.value : 0.4;
        }
        if (triageTh != null) {
          pool = pool.filter((u) => {
            const ratio = (u.currentHP ?? 0) / Math.max(1, u.maxHP ?? 1);
            return ratio <= triageTh;
          });
          if (pool.length === 0) continue;
          rule = "lowest-hp-ratio-ally";
        }
      }
      if (!targetAllies && resolved === "sunder-first" && pool.length > 0) {
        const sunderPool = pool.filter((t) => getSunderDebuff(t));
        if (sunderPool.length > 0) pool = sunderPool;
        rule = "lowest-hp";
      } else if (resolved === "sunder-first") {
        rule = "lowest-hp";
      }
      const needsThreatOpts = threat && (rule === "highest-threat" || rule === "highest-threat-on-actor" || rule === "lowest-threat" || rule === "first-top-threat-not-self" || rule === "threat-not-tank-random" || rule === "threat-not-tank-lowest-hp" || rule === "threat-tank-top-random" || rule === "threat-tank-top-lowest-on-tank" || rule === "threat-tank-top-highest-on-tank" || rule === "self-if-enemy-targeting");
      const pickOpts = needsThreatOpts ? {
        threat,
        actor,
        heroes,
        tankId: designatedTank?.id,
        monsters,
        monsterLastTarget,
        tauntState: tauntState ?? {}
      } : rule === "tank" && threat ? { threat, heroes, monsters, getTank: getTankFn } : rule === "self" ? { actor } : {};
      const chosen = pickTargetByRule(pool, rule, rng, pickOpts);
      if (chosen) {
        if (typeof step === "object" && step !== null && !evaluateTargetRuleStepPostPickGates(step, chosen, actor, heroes, monsters, stepCtx)) {
          continue;
        }
        return chosen;
      }
    }
    const aliveFiltered = filtered.filter((u) => (u.currentHP ?? 0) > 0);
    if (!skillId && aliveFiltered.length > 0) {
      return pickTargetByRule(aliveFiltered, "first", rng, {});
    }
    return null;
  }
  function actorDamage(actor, rng, round) {
    if (actor.side === "hero") {
      const coef = CLASS_COEFFICIENTS[actor.class];
      const spellOnlyClass = coef != null && coef.k_PhysAtk == null;
      if (spellOnlyClass) {
        const effSpell2 = getEffectiveSpellPower(actor, rng);
        return {
          action: "basic",
          damageType: "magic",
          rawDamage: Math.round(effSpell2 * SPELL_BASIC_ATTACK_COEFF)
        };
      }
      const effPhys2 = getEffectivePhysAtk(actor, rng);
      return { action: "basic", damageType: "physical", rawDamage: effPhys2 };
    }
    const skillDef = getMonsterSkillById(actor.skill);
    const cooldown = skillDef?.cooldown ?? 0;
    const lastUsed = actor.lastSkillRound ?? 0;
    const onCooldown = cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown;
    const canUseSkill = actor.skillChance > 0 && actor.skill && !onCooldown && rng() < actor.skillChance;
    const effPhys = getEffectivePhysAtk(actor, rng);
    const effSpell = getEffectiveSpellPower(actor, rng);
    if (!canUseSkill) {
      if (actor.damageType === "magic") return { action: "basic", damageType: "magic", rawDamage: effSpell };
      if (actor.damageType === "mixed") {
        const chooseMagic = rng() < 0.5;
        return {
          action: "basic",
          damageType: chooseMagic ? "magic" : "physical",
          rawDamage: chooseMagic ? effSpell : effPhys
        };
      }
      return { action: "basic", damageType: "physical", rawDamage: effPhys };
    }
    const skillId = skillDef?.id ?? actor.skill;
    const skillName = skillDef?.name ?? "\u6280\u80FD";
    const coeff = skillDef?.coefficient ?? 1.25;
    if (actor.damageType === "magic") {
      return { action: "skill", skillId, skillName, damageType: "magic", rawDamage: Math.round(effSpell * coeff) };
    }
    if (actor.damageType === "mixed") {
      const chooseMagic = rng() < 0.5;
      return {
        action: "skill",
        skillId,
        skillName,
        damageType: chooseMagic ? "magic" : "physical",
        rawDamage: Math.round((chooseMagic ? effSpell : effPhys) * coeff)
      };
    }
    return { action: "skill", skillId, skillName, damageType: "physical", rawDamage: Math.round(effPhys * coeff) };
  }
  function computePartyDropModifiers(heroes) {
    let goldFindPct = 0;
    let magicFindPct = 0;
    let heroCount = 0;
    for (const hero of heroes || []) {
      heroCount += 1;
      const eq = getEquipmentBonuses(hero?.equipment);
      goldFindPct += eq?.goldFindPct ?? 0;
      magicFindPct += eq?.magicFindPct ?? 0;
    }
    if (heroCount <= 0) {
      return { goldFindPct: 0, magicFindPct: 0 };
    }
    const avgGoldFind = goldFindPct / heroCount;
    const avgMagicFind = magicFindPct / heroCount;
    return {
      goldFindPct: Math.max(0, Math.min(300, avgGoldFind)),
      magicFindPct: Math.max(0, Math.min(300, avgMagicFind))
    };
  }
  function rewardForVictory(monsters, heroes, rng) {
    const dropModifiers = computePartyDropModifiers(heroes);
    const equipment = generateEquipmentDrop(monsters, rng, dropModifiers);
    const { exp, gold } = computeVictoryRewards(monsters, dropModifiers);
    return {
      exp,
      gold,
      equipment
    };
  }
  function runAutoCombat({ heroes, monsters, rng = Math.random, maxRounds = 40 }) {
    const heroUnits = heroes.map((h) => heroCombatStats(h));
    const monsterUnits = deepCopy(monsters).map((m) => ({ ...m, side: "monster", debuffs: [] }));
    const designatedTank = getDesignatedTank(heroes);
    const designatedTankUnit = designatedTank ? heroUnits.find((h) => h.id === designatedTank.id) ?? null : null;
    const threat = createThreatTables(heroUnits, monsterUnits);
    const tauntState = {};
    const monsterLastTarget = {};
    const monsterIntendedTargetIds = {};
    function snapshotStableIntentIdsForMonsters(monsterList) {
      const heroes2 = alive(heroUnits);
      const snap = {};
      for (const m of monsterList) {
        if ((m.currentHP ?? 0) <= 0) continue;
        const lastId = monsterLastTarget[m.id] ?? null;
        const t = getMonsterTargetStable(m, heroes2, threat, tauntState, lastId);
        snap[m.id] = t?.id ?? null;
      }
      return snap;
    }
    function emitMonsterIntentChangesIfNeeded(opts = {}) {
      const tauntExpiredIds = new Set(opts.tauntExpiredMonsterIds ?? []);
      const preStableIntentIds = opts.preStableIntentIds;
      const heroes2 = alive(heroUnits);
      for (const m of alive(monsterUnits)) {
        const tauntActive = tauntState[m.id]?.actionsRemaining > 0;
        const hasThreat = hasNonZeroThreatOnMonster(threat, m.id, heroes2);
        const meaningful = tauntActive || hasThreat || tauntExpiredIds.has(m.id);
        if (!meaningful) {
          monsterIntendedTargetIds[m.id] = null;
          continue;
        }
        const lastId = monsterLastTarget[m.id] ?? null;
        const next = getMonsterTargetStable(m, heroes2, threat, tauntState, lastId);
        const nextId = next?.id ?? null;
        if (nextId == null) continue;
        const prevId = preStableIntentIds != null && Object.prototype.hasOwnProperty.call(preStableIntentIds, m.id) ? preStableIntentIds[m.id] : monsterIntendedTargetIds[m.id];
        if (prevId === nextId) continue;
        const reason = tauntState[m.id]?.actionsRemaining > 0 ? "taunt" : "threat";
        let intentDetail = reason === "taunt" ? "taunt" : "threat";
        if (tauntExpiredIds.has(m.id)) intentDetail = "taunt-ended";
        monsterIntendedTargetIds[m.id] = nextId;
        const prevHero = prevId != null ? heroes2.find((h) => h.id === prevId) : null;
        const newHero = heroes2.find((h) => h.id === nextId);
        pushCombatLog({
          round,
          type: "monsterTargetIntent",
          monsterId: m.id,
          monsterName: m.name,
          monsterTier: m.tier ?? null,
          previousTargetId: prevId ?? null,
          previousTargetName: prevHero?.name ?? null,
          previousTargetClass: prevHero?.class ?? null,
          newTargetId: nextId,
          newTargetName: newHero?.name ?? "",
          newTargetClass: newHero?.class ?? null,
          intentReason: reason,
          intentDetail
        });
      }
    }
    const log = [];
    const steps = [];
    const battleStats = createBattleStatsAccumulator();
    const encounter = serializeEncounter(monsterUnits, heroUnits);
    const turnActedByRound = {};
    let round = 1;
    let initialOrder = [];
    let combatActionSteps = 0;
    function recordStatsForLogEntry(entry) {
      if (!entry || entry.type != null) return;
      if (entry.isMiss === true) return;
      const fd = Math.floor(Number(entry.finalDamage) || 0);
      if (fd <= 0) return;
      if (entry.actorClass && entry.targetTier != null && entry.actorId) {
        recordHeroDamageToMonster(battleStats, {
          actorId: entry.actorId,
          action: entry.action,
          skillId: entry.skillId,
          finalDamage: fd,
          isMiss: entry.isMiss
        });
      }
      if (entry.actorTier != null && entry.targetClass && entry.targetId) {
        recordMonsterDamageToHero(battleStats, {
          targetId: entry.targetId,
          action: entry.action,
          skillId: entry.skillId,
          finalDamage: fd,
          damageType: entry.damageType,
          isMiss: entry.isMiss
        });
      }
    }
    function pushCombatLog(entry) {
      log.push(entry);
      steps.push(serializePanelStep(heroUnits, monsterUnits));
      recordStatsForLogEntry(entry);
    }
    function appendSealRiderLog(paladin, target) {
      if (paladin.class !== "Paladin" || !hasActiveSeal(paladin) || (target.currentHP ?? 0) <= 0) return;
      const rider = executeSealRider(paladin, target, { rng });
      if (!rider || rider.finalDamage <= 0) return;
      const riderThreatMult = getEffectiveThreatMultiplierForHero(paladin, 1);
      addThreatFromDamage(threat, target.id, paladin.id, rider.finalDamage, 1, paladin);
      pushCombatLog({
        round,
        actorId: paladin.id,
        actorName: paladin.name,
        actorAgility: paladin.agility ?? 0,
        actorClass: paladin.class,
        actorTier: null,
        action: "skill",
        skillId: "seal-of-righteousness-rider",
        skillName: "\u5723\u5370\u9644\u52A0",
        skillSpec: "\u795E\u5723",
        targetId: target.id,
        targetName: target.name,
        targetClass: target.class || null,
        targetTier: target.tier || null,
        damageType: "magic",
        finalDamage: rider.finalDamage,
        sealRiderCoeff: rider.riderCoeff,
        targetDefense: rider.effectiveResistance,
        targetHPBefore: rider.targetHPBefore,
        targetHPAfter: rider.targetHPAfter,
        targetMaxHP: target.maxHP,
        threatAmount: Math.round(rider.finalDamage * riderThreatMult),
        threatTargetName: target.name
      });
    }
    function executeBasicAttackDamagePhase(actor, target) {
      const action = actorDamage(actor, rng, round);
      const critRate = action.damageType === "magic" ? actor.spellCrit || 0 : actor.physCrit || 0;
      const attackRoll = rng();
      const hitResult = rollHitCheck(actor, target, () => attackRoll);
      const isCrit = hitResult.isHit ? attackRoll < critRate : false;
      let rawBase = action.rawDamage;
      if (actor.side === "hero") {
        if (action.damageType === "physical") {
          rawBase = Math.round(rawBase * (1 + (actor.physDmgPct || 0) / 100));
        } else if (action.damageType === "magic") {
          rawBase = Math.round(rawBase * (1 + (actor.spellDmgPct || 0) / 100));
        }
      }
      const critMultUse = actor.side === "hero" ? action.damageType === "magic" ? actor.spellCritMult ?? CRIT_MULTIPLIER : actor.physCritMult ?? CRIT_MULTIPLIER : CRIT_MULTIPLIER;
      const rawAfterCrit = isCrit ? Math.round(rawBase * critMultUse) : rawBase;
      const targetHPBefore = target.currentHP;
      const weaponOpts = actor.side === "hero" && action.damageType === "physical" ? { armorPen: actor.physArmorPen ?? 0, ignoreArmorPct: actor.physIgnoreArmorPct ?? 0 } : actor.side === "hero" && action.damageType === "magic" ? { spellPen: actor.spellPen ?? 0, ignoreResistPct: actor.spellIgnoreResistPct ?? 0 } : actor.side === "monster" && action.damageType === "physical" ? { armorPen: actor.physArmorPen ?? 0 } : actor.side === "monster" && action.damageType === "magic" ? { spellPen: actor.spellPen ?? 0 } : {};
      let damage = hitResult.isHit ? actor.side === "hero" ? applyDamageWithWeaponAffixes(rawAfterCrit, action.damageType, target, weaponOpts) : applyDamage(rawAfterCrit, action.damageType, target, weaponOpts) : {
        damageType: action.damageType,
        absorbed: 0,
        finalDamage: 0,
        effectiveDefense: 0,
        nextHP: target.currentHP ?? 0
      };
      if (target.side === "hero") {
        const ds = applyDefensiveStanceToIncomingDamage(target, damage.finalDamage);
        if (ds.stanceMitigated > 0) {
          damage = {
            ...damage,
            finalDamage: ds.finalDamage,
            nextHP: Math.max(0, (target.currentHP || 0) - ds.finalDamage),
            defensiveStanceMitigated: ds.stanceMitigated
          };
        }
      }
      let physicalDamageBeforeBlock = null;
      if (target.side === "hero" && hitResult.isHit && damage.finalDamage > 0 && damage.damageType === "physical") {
        let fd = damage.finalDamage;
        const pdr = target.physDrPct || 0;
        if (pdr > 0) fd = Math.max(0, Math.floor(fd * (1 - Math.min(75, pdr) / 100)));
        let blockedPhysical = false;
        const bc = target.blockPct || 0;
        if (bc > 0 && rng() * 100 < Math.min(75, bc)) {
          physicalDamageBeforeBlock = fd;
          blockedPhysical = true;
          const bdr = target.blockDrPct || 0;
          fd = Math.max(0, Math.floor(fd * Math.max(0.1, 1 - Math.min(85, bdr) / 100)));
        }
        damage = {
          ...damage,
          finalDamage: fd,
          nextHP: Math.max(0, (target.currentHP || 0) - fd),
          blockedPhysical
        };
      }
      let blockCounterDamageToMonster = 0;
      if (actor.side === "monster" && target.side === "hero" && damage.blockedPhysical && (target.blockCounter || 0) > 0) {
        blockCounterDamageToMonster = Math.min(target.blockCounter || 0, actor.currentHP || 0);
        actor.currentHP = Math.max(0, (actor.currentHP || 0) - blockCounterDamageToMonster);
      }
      let shieldCasterIdForLog = null;
      if (target.side === "hero" && target.shield && damage.finalDamage > 0) {
        shieldCasterIdForLog = target.shield.casterId ?? null;
        const shieldResult = applyDamageToShieldedUnit(target, damage.finalDamage);
        damage.absorbedByShield = shieldResult.absorbed;
        damage.overflowDamage = shieldResult.overflow;
        damage.shieldBroke = shieldResult.shieldBroke;
        damage.shieldAbsorbRemainingAfter = target.shield?.absorbRemaining ?? 0;
        damage.shieldRemainingRoundsAfter = target.shield?.remainingRounds ?? null;
      } else {
        target.currentHP = damage.nextHP;
      }
      if (target.side === "hero" && damage.finalDamage > 0) target.hitThisRound = true;
      let thornsDamageToMonster = 0;
      if (actor.side === "monster" && target.side === "hero" && action.damageType === "physical" && damage.finalDamage > 0) {
        const tn = target.thorns || 0;
        if (tn > 0) {
          thornsDamageToMonster = Math.min(tn, actor.currentHP || 0);
          actor.currentHP = Math.max(0, (actor.currentHP || 0) - thornsDamageToMonster);
        }
      }
      let lifeOnKillHeal = 0;
      let rageOnKillGain = 0;
      if (actor.side === "hero" && target.side === "monster" && targetHPBefore > 0 && (target.currentHP ?? 0) <= 0) {
        const lk = actor.lifeOnKill || 0;
        if (lk > 0) {
          lifeOnKillHeal = lk;
          actor.currentHP = Math.min(actor.maxHP ?? 99999, (actor.currentHP || 0) + lk);
        }
        if (actor.class === "Warrior" && (actor.rageOnKill || 0) > 0) {
          rageOnKillGain = actor.rageOnKill;
          actor.currentMP = Math.min(100, (actor.currentMP || 0) + rageOnKillGain);
        }
      }
      const shieldOnMain = damage.absorbedByShield != null && damage.absorbedByShield > 0;
      let weaponAddedMagicDamage = 0;
      let weaponArcaneFollowupDamage = 0;
      let weaponLifeStealHeal = 0;
      let weaponLifeOnHitHeal = 0;
      let weaponManaReflux = 0;
      let weaponManaOnCast = 0;
      let actorHPBeforeWeaponHeal = null;
      if (actor.side === "hero" && action.damageType === "physical" && damage.finalDamage > 0) {
        actorHPBeforeWeaponHeal = actor.currentHP ?? 0;
        if (actor.lifeStealPct) {
          weaponLifeStealHeal += Math.floor(damage.finalDamage * (actor.lifeStealPct / 100));
        }
        if (actor.lifeOnHit) {
          weaponLifeOnHitHeal += actor.lifeOnHit;
        }
        const lsHeal = weaponLifeStealHeal + weaponLifeOnHitHeal;
        if (lsHeal > 0) {
          actor.currentHP = Math.min(actor.maxHP ?? 99999, (actor.currentHP || 0) + lsHeal);
        }
        const maxA = actor.addedMagicDmgMax ?? 0;
        const minA = actor.addedMagicDmgMin ?? 0;
        if (maxA > 0 && minA <= maxA) {
          const addRoll = randomInRange5(minA, maxA, rng);
          const md = applyDamageWithWeaponAffixes(addRoll, "magic", target, { spellPen: 0, ignoreResistPct: 0 });
          if (target.side === "hero" && target.shield && md.finalDamage > 0) {
            applyDamageToShieldedUnit(target, md.finalDamage);
          } else {
            target.currentHP = md.nextHP;
          }
          weaponAddedMagicDamage = md.finalDamage;
          if (actor.side === "hero" && target.side === "monster" && md.finalDamage > 0) {
            addThreatFromDamage(threat, target.id, actor.id, md.finalDamage, 1);
          }
        }
      }
      if (actor.side === "hero" && action.damageType === "magic" && damage.finalDamage > 0) {
        if (actor.manaRefluxPct) {
          weaponManaReflux += Math.floor(damage.finalDamage * (actor.manaRefluxPct / 100));
        }
        if (actor.manaOnCast) {
          weaponManaOnCast += actor.manaOnCast;
        }
        const mpGain = weaponManaReflux + weaponManaOnCast;
        if (mpGain > 0) {
          actor.currentMP = Math.min(actor.maxMP ?? 99999, (actor.currentMP || 0) + mpGain);
        }
        const fMax = actor.arcaneFollowupMax ?? 0;
        const fMin = actor.arcaneFollowupMin ?? 0;
        if (fMax > 0 && fMin <= fMax) {
          const fu = randomInRange5(fMin, fMax, rng);
          const md = applyDamageWithWeaponAffixes(fu, "magic", target, {
            spellPen: actor.spellPen ?? 0,
            ignoreResistPct: actor.spellIgnoreResistPct ?? 0
          });
          if (target.side === "hero" && target.shield && md.finalDamage > 0) {
            applyDamageToShieldedUnit(target, md.finalDamage);
          } else {
            target.currentHP = md.nextHP;
          }
          weaponArcaneFollowupDamage = md.finalDamage;
          if (actor.side === "hero" && target.side === "monster" && md.finalDamage > 0) {
            addThreatFromDamage(threat, target.id, actor.id, md.finalDamage, 1);
          }
        }
      }
      let doubleStrikeDamage = 0;
      if (actor.side === "hero" && action.action === "basic" && action.damageType === "physical" && hitResult.isHit && target.side === "monster" && (target.currentHP ?? 0) > 0 && (actor.doubleStrikePct || 0) > 0 && rng() * 100 < (actor.doubleStrikePct || 0)) {
        const dsRaw = Math.round(rawBase * 0.6);
        const dsCritRoll = rng();
        const dsIsCrit = dsCritRoll < (actor.physCrit || 0);
        const dsAfterCrit = dsIsCrit ? Math.round(dsRaw * (actor.physCritMult ?? CRIT_MULTIPLIER)) : dsRaw;
        const dsDmg = applyDamageWithWeaponAffixes(dsAfterCrit, "physical", target, weaponOpts);
        if (dsDmg.finalDamage > 0) {
          target.currentHP = dsDmg.nextHP;
          doubleStrikeDamage = dsDmg.finalDamage;
          addThreatFromDamage(threat, target.id, actor.id, dsDmg.finalDamage, 1, actor);
          if ((target.currentHP ?? 0) <= 0) {
            const lk = actor.lifeOnKill || 0;
            if (lk > 0) {
              actor.currentHP = Math.min(actor.maxHP ?? 99999, (actor.currentHP || 0) + lk);
            }
            if (actor.class === "Warrior" && (actor.rageOnKill || 0) > 0) {
              actor.currentMP = Math.min(100, (actor.currentMP || 0) + (actor.rageOnKill || 0));
            }
          }
        }
      }
      const reportedFinalDamage = damage.finalDamage + weaponAddedMagicDamage + weaponArcaneFollowupDamage + doubleStrikeDamage;
      const hasWeaponDamageSegments = weaponAddedMagicDamage > 0 || weaponArcaneFollowupDamage > 0;
      const primaryFinalDamage = actor.side === "hero" && hasWeaponDamageSegments && !shieldOnMain ? damage.finalDamage : void 0;
      if (actor.side === "hero" && target.side === "monster" && damage.finalDamage > 0) {
        addThreatFromDamage(threat, target.id, actor.id, damage.finalDamage, 1, actor);
      }
      const targetReason = actor.side === "monster" ? tauntState[actor.id]?.actionsRemaining > 0 ? "taunted" : "highest-threat" : null;
      let pendingOtEntry = null;
      if (actor.side === "monster") {
        const lastTargetId = monsterLastTarget[actor.id];
        if (lastTargetId != null && lastTargetId !== target.id) {
          const tank = getTank(heroUnits, monsterUnits, threat, designatedTankUnit);
          if (tank && target.id !== tank.id) {
            const stablePreviewId = monsterIntendedTargetIds[actor.id];
            const redundantWithIntent = stablePreviewId != null && target.id === stablePreviewId;
            if (!redundantWithIntent) {
              const lastTarget = heroUnits.find((h) => h.id === lastTargetId);
              const lastTargetName = lastTarget?.name ?? "Unknown";
              pendingOtEntry = {
                round,
                type: "ot",
                monsterId: actor.id,
                monsterName: actor.name,
                monsterTier: actor.tier ?? null,
                previousTargetName: lastTargetName,
                newTargetId: target.id,
                newTargetName: target.name,
                newTargetClass: target.class || null
              };
            }
          }
        }
        if (action.skillId) actor.lastSkillRound = round;
      }
      let debuffResult = null;
      if (actor.side === "monster" && action.skillId) {
        const skillDef = getMonsterSkillById(actor.skill);
        debuffResult = applyMonsterSkillDebuff(target, skillDef);
      }
      if (damage.finalDamage > 0) {
        if (actor.side === "hero" && actor.class === "Warrior") {
          let gained = rageFromAttack(isCrit);
          gained = Math.floor(gained * (1 + (actor.rageGenPct || 0) / 100));
          actor.currentMP = Math.min(100, (actor.currentMP || 0) + gained);
        }
        if (target.side === "hero" && target.class === "Warrior") {
          let gained = rageFromAttack(isCrit);
          gained = Math.floor(gained * (1 + (target.rageGenPct || 0) / 100));
          target.currentMP = Math.min(100, (target.currentMP || 0) + gained);
        }
      }
      const logEntry = {
        round,
        actorId: actor.id,
        actorName: actor.name,
        actorAgility: actor.agility ?? 0,
        actorClass: actor.class || null,
        actorTier: actor.tier || null,
        action: action.action,
        ...action.skillId && { skillId: action.skillId },
        ...damage.absorbedByShield != null && damage.absorbedByShield > 0 && {
          shieldAbsorbed: damage.absorbedByShield,
          shieldBroke: damage.shieldBroke,
          shieldAbsorbRemainingAfter: damage.shieldAbsorbRemainingAfter ?? 0,
          shieldRemainingRoundsAfter: damage.shieldRemainingRoundsAfter ?? null,
          ...shieldCasterIdForLog != null && shieldCasterIdForLog !== "" ? { shieldCasterId: shieldCasterIdForLog } : {}
        },
        ...action.skillName && { skillName: action.skillName },
        targetId: target.id,
        targetName: target.name,
        targetClass: target.class || null,
        targetTier: target.tier || null,
        damageType: damage.damageType,
        rawDamage: action.rawDamage,
        isCrit,
        isMiss: !hitResult.isHit,
        finalHitChance: hitResult.finalHitChance,
        missChance: hitResult.missChance,
        attackerHit: hitResult.attackerHit,
        defenderDodge: hitResult.defenderDodge,
        levelAdjust: hitResult.levelAdjust,
        finalDamage: reportedFinalDamage,
        absorbed: damage.absorbed,
        targetDefense: damage.effectiveDefense,
        targetHPBefore,
        targetHPAfter: target.currentHP,
        targetMaxHP: target.maxHP
      };
      if (primaryFinalDamage != null) logEntry.primaryFinalDamage = primaryFinalDamage;
      if (weaponAddedMagicDamage > 0) logEntry.weaponAddedMagicDamage = weaponAddedMagicDamage;
      if (weaponArcaneFollowupDamage > 0) logEntry.weaponArcaneFollowupDamage = weaponArcaneFollowupDamage;
      if (weaponLifeStealHeal > 0) logEntry.weaponLifeStealHeal = weaponLifeStealHeal;
      if (weaponLifeOnHitHeal > 0) logEntry.weaponLifeOnHitHeal = weaponLifeOnHitHeal;
      if (weaponManaReflux > 0) logEntry.weaponManaReflux = weaponManaReflux;
      if (weaponManaOnCast > 0) logEntry.weaponManaOnCast = weaponManaOnCast;
      if (thornsDamageToMonster > 0) logEntry.thornsDamageToMonster = thornsDamageToMonster;
      if (blockCounterDamageToMonster > 0) logEntry.blockCounterDamageToMonster = blockCounterDamageToMonster;
      if (lifeOnKillHeal > 0) logEntry.lifeOnKillHeal = lifeOnKillHeal;
      if (rageOnKillGain > 0) logEntry.rageOnKillGain = rageOnKillGain;
      if (doubleStrikeDamage > 0) logEntry.doubleStrikeDamage = doubleStrikeDamage;
      if (damage.blockedPhysical) logEntry.blockedPhysical = true;
      if (physicalDamageBeforeBlock != null) logEntry.physicalDamageBeforeBlock = physicalDamageBeforeBlock;
      if (actorHPBeforeWeaponHeal != null && (weaponLifeStealHeal > 0 || weaponLifeOnHitHeal > 0)) {
        logEntry.actorHPBefore = actorHPBeforeWeaponHeal;
        logEntry.actorHPAfter = actor.currentHP;
        logEntry.actorMaxHP = actor.maxHP;
      }
      if ((weaponManaReflux > 0 || weaponManaOnCast > 0) && actor.side === "hero" && actor.class === "Mage") {
        logEntry.weaponAffixManaAfter = actor.currentMP;
        logEntry.weaponAffixMaxMana = actor.maxMP;
      }
      const mh = heroMitigationNoteKind(actor, damage.damageType);
      if (mh) logEntry.heroMitigationKind = mh;
      if (targetReason) logEntry.targetReason = targetReason;
      if (actor.side === "hero" && target.side === "monster" && reportedFinalDamage > 0) {
        const threatMult = getEffectiveThreatMultiplierForHero(actor, 1);
        logEntry.threatAmount = Math.round(reportedFinalDamage * threatMult);
        logEntry.threatTargetName = target.name;
      }
      if (actor.side === "hero" && actor.class === "Warrior") {
        logEntry.actorRageAfter = actor.currentMP;
      }
      if (target.side === "hero" && target.class === "Warrior") {
        logEntry.targetRageAfter = target.currentMP;
      }
      if (debuffResult) {
        logEntry.debuffApplied = !debuffResult.refreshed;
        logEntry.debuffRefreshed = debuffResult.refreshed;
        logEntry.debuffType = debuffResult.type;
        logEntry.debuffDuration = debuffResult.duration ?? 2;
        if (debuffResult.armorReduction != null) logEntry.debuffArmorReduction = debuffResult.armorReduction;
        if (debuffResult.resistanceReduction != null) logEntry.debuffResistanceReduction = debuffResult.resistanceReduction;
        if (debuffResult.damagePerRound != null) logEntry.debuffDamagePerRound = debuffResult.damagePerRound;
        if (debuffResult.damageType != null) logEntry.debuffDamageType = debuffResult.damageType;
      }
      if (pendingOtEntry) pushCombatLog(pendingOtEntry);
      pushCombatLog(logEntry);
      if (actor.side === "hero" && actor.class === "Paladin" && hitResult.isHit && reportedFinalDamage > 0 && target.side === "monster") {
        appendSealRiderLog(actor, target);
      }
      let tauntExpiredMonsterIdsAfterSwing = [];
      if (actor.side === "monster") {
        monsterLastTarget[actor.id] = target.id;
        const tauntDec = decrementTauntActions(tauntState, actor.id);
        if (tauntDec.expired) tauntExpiredMonsterIdsAfterSwing = [actor.id];
      }
      return tauntExpiredMonsterIdsAfterSwing;
    }
    function tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx) {
      const conditionsForBasicAttack = conditions || [];
      const target = pickTarget(actor, heroUnits, monsterUnits, {
        skillId: "basic-attack",
        conditions: conditionsForBasicAttack,
        rng,
        threat,
        tauntState,
        designatedTank: designatedTankUnit,
        monsterLastTarget
      });
      if (!target) {
        return { ok: false };
      }
      const baCond = conditions.find((c) => c.skillId === "basic-attack");
      if (baCond && tacticsConditionWhenRequiresPickedTarget(baCond) && !checkCondition(baCond, actor, target, heroUnits, monsterUnits, ctx)) {
        pushCombatLog({
          round,
          type: "actionSkipped",
          skipReason: "tactics-gate",
          actorId: actor.id,
          actorName: actor.name,
          actorClass: actor.class || null,
          actorTier: null,
          actorAgility: actor.agility ?? 0
        });
        return { ok: false };
      }
      const tauntExpiredMonsterIds = executeBasicAttackDamagePhase(actor, target);
      return { ok: true, tauntExpiredMonsterIds };
    }
    while (round <= maxRounds && alive(heroUnits).length > 0 && alive(monsterUnits).length > 0) {
      for (const h of heroUnits) h.hitThisRound = false;
      const roundOrder = buildRoundOrder(heroUnits, monsterUnits, rng, {
        round,
        designatedTank: designatedTankUnit
      });
      if (round === 1) {
        initialOrder = roundOrder.map((u) => u.name);
      }
      turnActedByRound[round] = [];
      for (const actor of roundOrder) {
        let tauntExpiredMonsterIds = [];
        if (actor.currentHP <= 0) continue;
        combatActionSteps += 1;
        if (consumeFreezeTurn(actor)) {
          pushCombatLog({
            round,
            type: "actionSkipped",
            skipReason: "freeze",
            actorId: actor.id,
            actorName: actor.name,
            actorClass: actor.class || null,
            actorTier: actor.tier ?? null,
            actorAgility: actor.agility ?? 0
          });
          emitMonsterIntentChangesIfNeeded();
          continue;
        }
        if (consumeStunTurn(actor)) {
          pushCombatLog({
            round,
            type: "actionSkipped",
            skipReason: "stun",
            actorId: actor.id,
            actorName: actor.name,
            actorClass: actor.class || null,
            actorTier: actor.tier ?? null,
            actorAgility: actor.agility ?? 0
          });
          emitMonsterIntentChangesIfNeeded();
          continue;
        }
        const defaultTarget = pickTarget(actor, heroUnits, monsterUnits, {
          rng,
          threat,
          tauntState,
          designatedTank: designatedTankUnit,
          monsterLastTarget
        });
        if (!defaultTarget) break;
        turnActedByRound[round].push(actor.id);
        const ctx = {
          round,
          rng,
          threat,
          monsterLastTarget,
          isAllyOT: (h, m, t) => isAllyOT(h, m, t, designatedTankUnit, monsterLastTarget),
          tankId: designatedTankUnit?.id
        };
        const conditions = getConditions(actor);
        let magePriorityNoCastThisTurn = false;
        let priestPriorityNoCastThisTurn = false;
        let druidPriorityNoCastThisTurn = false;
        let paladinPriorityNoCastThisTurn = false;
        let heroConsumedExplicitPriorityBasicAttack = false;
        const skillPriority = getSkillPriority(actor);
        if (actor.side === "hero" && actor.class === "Warrior" && skillPriority.length > 0) {
          let usedSkill = false;
          for (const skillId of skillPriority) {
            if (skillId === "basic-attack") {
              const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx);
              if (!ba.ok) {
                emitMonsterIntentChangesIfNeeded();
                continue;
              }
              usedSkill = true;
              heroConsumedExplicitPriorityBasicAttack = true;
              break;
            }
            const skill = getSkillWithEnhancements(actor, skillId) ?? getAnyWarriorSkillById(skillId);
            if (!skill || (skill.rageCost ?? 0) > (actor.currentMP || 0)) continue;
            const cooldown = skill.cooldown ?? 0;
            const lastUsed = actor.skillCooldowns?.[skillId] ?? 0;
            if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue;
            if (skillId === "defensive-stance") {
              const dsCond = conditions.find((c) => c.skillId === skillId);
              if (dsCond && !checkCondition(dsCond, actor, null, heroUnits, monsterUnits, ctx)) continue;
              actor.currentMP = Math.max(0, (actor.currentMP || 0) - (skill.rageCost ?? 0));
              if (!actor.buffs) actor.buffs = [];
              actor.buffs = actor.buffs.filter((b) => b.type !== "defensive-stance");
              actor.buffs.push({
                type: "defensive-stance",
                remainingRounds: skill.stanceDuration ?? 3,
                damageReductionPct: skill.damageReductionPct ?? 12
              });
              if (!actor.skillCooldowns) actor.skillCooldowns = {};
              actor.skillCooldowns[skillId] = round;
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: "defensive-stance",
                skillName: "\u9632\u5FA1\u59FF\u6001",
                skillSpec: "\u9632\u62A4",
                defensiveStanceApplied: true,
                defensiveStancePct: skill.damageReductionPct ?? 12,
                defensiveStanceRounds: skill.stanceDuration ?? 3,
                rageConsumed: skill.rageCost ?? 0,
                rageAfter: actor.currentMP
              });
              usedSkill = true;
              break;
            }
            const cond = conditions.find((c) => c.skillId === skillId);
            let target2;
            if (cond && tacticsConditionWhenRequiresPickedTarget(cond)) {
              target2 = pickTarget(actor, heroUnits, monsterUnits, {
                skillId,
                conditions,
                rng,
                round,
                threat,
                tauntState,
                designatedTank: designatedTankUnit,
                monsterLastTarget
              });
              if (!target2) continue;
              if (!checkCondition(cond, actor, target2, heroUnits, monsterUnits, ctx)) continue;
            } else {
              if (cond && !checkCondition(cond, actor, null, heroUnits, monsterUnits, ctx)) continue;
              target2 = pickTarget(actor, heroUnits, monsterUnits, {
                skillId,
                conditions,
                rng,
                round,
                threat,
                tauntState,
                designatedTank: designatedTankUnit,
                monsterLastTarget
              });
              if (!target2) continue;
            }
            if (skillId === "taunt") {
              const tauntForced = skill.tauntForcedActions ?? 2;
              tauntState[target2.id] = { casterId: actor.id, actionsRemaining: tauntForced };
              applyTauntThreatBoost(threat, target2.id, actor.id, heroUnits);
              if (!actor.skillCooldowns) actor.skillCooldowns = {};
              actor.skillCooldowns[skillId] = round;
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: "taunt",
                skillName: "\u5632\u8BBD",
                skillSpec: "Protection",
                targetId: target2.id,
                targetName: target2.name,
                targetClass: target2.class || null,
                targetTier: target2.tier || null,
                tauntApplied: true,
                tauntActionsRemaining: tauntForced
              });
              usedSkill = true;
              break;
            }
            const skillRoll = rng();
            const hitResult = rollHitCheck(actor, target2, () => skillRoll);
            const isCrit = hitResult.isHit ? skillRoll < (actor.physCrit || 0) : false;
            if (skill.targets && skill.targets >= 2) {
              const aliveMonsters = alive(monsterUnits);
              if (aliveMonsters.length > 0) {
                const cleaveActorHPBefore = actor.currentHP;
                const sr = executeCleave(actor, aliveMonsters, skill, {
                  isCrit,
                  rng,
                  isHit: hitResult.isHit
                });
                if (!actor.skillCooldowns) actor.skillCooldowns = {};
                actor.skillCooldowns[skillId] = round;
                const firstHit = sr.hits[0];
                const primaryCleave = sr.weaponAddedMagicDamageTotal > 0 && firstHit?.physFinalDamage != null ? firstHit.physFinalDamage : void 0;
                const entry = {
                  round,
                  actorId: actor.id,
                  actorName: actor.name,
                  actorAgility: actor.agility ?? 0,
                  actorClass: actor.class,
                  actorTier: null,
                  action: "skill",
                  skillId: sr.skillId,
                  skillName: sr.skillName,
                  skillSpec: sr.skillSpec,
                  skillCoefficient: sr.skillCoefficient,
                  targetId: firstHit?.targetId ?? target2.id,
                  targetName: firstHit?.targetName ?? target2.name,
                  targetClass: target2.class || null,
                  targetTier: target2.tier || null,
                  damageType: "physical",
                  rawDamage: firstHit?.baseRaw ?? 0,
                  isCrit,
                  isMiss: !hitResult.isHit,
                  finalHitChance: hitResult.finalHitChance,
                  missChance: hitResult.missChance,
                  attackerHit: hitResult.attackerHit,
                  defenderDodge: hitResult.defenderDodge,
                  levelAdjust: hitResult.levelAdjust,
                  finalDamage: sr.totalDamage,
                  absorbed: 0,
                  targetDefense: firstHit?.effectiveArmor ?? 0,
                  targetHPBefore: firstHit?.targetHPBefore ?? target2.currentHP,
                  targetHPAfter: firstHit ? aliveMonsters[0]?.currentHP ?? 0 : target2.currentHP,
                  targetMaxHP: target2.maxHP,
                  rageConsumed: sr.rageConsumed,
                  rageAfter: actor.currentMP,
                  cleaveTargets: sr.targetCount
                };
                if (primaryCleave != null) entry.primaryFinalDamage = primaryCleave;
                if (sr.weaponAddedMagicDamageTotal > 0) {
                  entry.weaponAddedMagicDamage = sr.weaponAddedMagicDamageTotal;
                }
                if (sr.weaponLifeStealHeal > 0) entry.weaponLifeStealHeal = sr.weaponLifeStealHeal;
                if (sr.weaponLifeOnHitHeal > 0) entry.weaponLifeOnHitHeal = sr.weaponLifeOnHitHeal;
                if (sr.weaponLifeStealHeal > 0 || sr.weaponLifeOnHitHeal > 0) {
                  entry.actorHPBefore = cleaveActorHPBefore;
                  entry.actorHPAfter = actor.currentHP;
                  entry.actorMaxHP = actor.maxHP;
                }
                const mhCleave = heroMitigationNoteKind(actor, "physical");
                if (mhCleave) entry.heroMitigationKind = mhCleave;
                for (const hit of sr.hits) {
                  const mult = getThreatMultiplier(skillId);
                  addThreatFromDamage(threat, hit.target.id, actor.id, hit.finalDamage, mult);
                }
                if (firstHit) {
                  const mult = getThreatMultiplier(skillId);
                  entry.threatAmount = Math.round(firstHit.finalDamage * mult);
                  entry.threatTargetName = firstHit.target.name;
                }
                pushCombatLog(entry);
                usedSkill = true;
                break;
              }
            } else {
              const actorHPBefore = actor.currentHP;
              const targetHPBefore = target2.currentHP;
              const sr = executeWarriorSkill(actor, target2, skill, {
                isCrit,
                rng,
                isHit: hitResult.isHit
              });
              if (!actor.skillCooldowns) actor.skillCooldowns = {};
              actor.skillCooldowns[skillId] = round;
              const entry = {
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                skillCoefficient: sr.skillCoefficient,
                targetId: target2.id,
                targetName: target2.name,
                targetClass: target2.class || null,
                targetTier: target2.tier || null,
                damageType: "physical",
                rawDamage: sr.rawDamage,
                isCrit: sr.isCrit,
                isMiss: !sr.isHit,
                finalHitChance: hitResult.finalHitChance,
                missChance: hitResult.missChance,
                attackerHit: hitResult.attackerHit,
                defenderDodge: hitResult.defenderDodge,
                levelAdjust: hitResult.levelAdjust,
                finalDamage: sr.finalDamage,
                absorbed: Math.max(0, sr.rawAfterCrit - sr.finalDamage),
                targetDefense: sr.effectiveArmor,
                targetHPBefore,
                targetHPAfter: target2.currentHP,
                targetMaxHP: target2.maxHP,
                rageConsumed: sr.rageConsumed,
                rageAfter: actor.currentMP
              };
              if (sr.weaponAddedMagicDamage > 0) {
                entry.weaponAddedMagicDamage = sr.weaponAddedMagicDamage;
                entry.primaryFinalDamage = sr.primaryPhysDamage;
              }
              if (sr.weaponLifeStealHeal > 0) entry.weaponLifeStealHeal = sr.weaponLifeStealHeal;
              if (sr.weaponLifeOnHitHeal > 0) entry.weaponLifeOnHitHeal = sr.weaponLifeOnHitHeal;
              if (sr.healFromSkill != null && sr.healFromSkill > 0) entry.healFromSkill = sr.healFromSkill;
              const mhWar = heroMitigationNoteKind(actor, "physical");
              if (mhWar) entry.heroMitigationKind = mhWar;
              if (sr.heal > 0) {
                entry.heal = sr.heal;
                entry.actorHPBefore = actorHPBefore;
                entry.actorHPAfter = actor.currentHP;
                entry.actorMaxHP = actor.maxHP;
                const healThreatCount = addThreatFromHeal(
                  threat,
                  alive(monsterUnits),
                  alive(heroUnits),
                  tauntState,
                  actor.id,
                  actor.id,
                  sr.heal,
                  monsterLastTarget
                );
                entry.threatHealAmount = healThreatCount > 0 ? Math.round(sr.heal * 0.5) : null;
                if (entry.threatHealAmount != null) {
                  entry.threatBeneficiaryName = actor.name;
                  entry.threatBeneficiaryClass = actor.class || null;
                }
              }
              const sunderThreatOpts = skillId === "sunder-armor" && sr.debuffArmorReduction != null ? { sunderArmorReduction: sr.debuffArmorReduction } : {};
              addThreatFromSkillDamage(threat, target2.id, actor.id, skillId, sr.finalDamage, sunderThreatOpts);
              entry.threatAmount = computeSkillDamageThreat(skillId, sr.finalDamage, sunderThreatOpts);
              entry.threatTargetName = target2.name;
              if (sr.debuffApplied || sr.debuffRefreshed) {
                entry.debuffApplied = sr.debuffApplied;
                entry.debuffRefreshed = sr.debuffRefreshed;
                entry.debuffType = "sunder";
                entry.debuffArmorReduction = sr.debuffArmorReduction;
                entry.debuffDuration = sr.debuffDuration;
              }
              pushCombatLog(entry);
              usedSkill = true;
              break;
            }
          }
          if (usedSkill) {
            emitMonsterIntentChangesIfNeeded();
            continue;
          }
        }
        const mageSkillPriority = getSkillPriority(actor);
        if (actor.side === "hero" && actor.class === "Mage" && mageSkillPriority.length > 0) {
          let usedSkill = false;
          for (const skillId of mageSkillPriority) {
            if (skillId === "basic-attack") {
              const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx);
              if (!ba.ok) {
                emitMonsterIntentChangesIfNeeded();
                continue;
              }
              usedSkill = true;
              heroConsumedExplicitPriorityBasicAttack = true;
              break;
            }
            const skill = getMageSkillWithEnhancements(actor, skillId) ?? getAnyMageSkillById(skillId);
            const manaCost = skill?.manaCost ?? skill?.rageCost ?? 999;
            if (!skill || manaCost > (actor.currentMP || 0)) continue;
            const cooldown = skill.cooldown ?? 0;
            const lastUsed = actor.skillCooldowns?.[skillId] ?? 0;
            if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue;
            const mageCond = conditions.find((c) => c.skillId === skillId);
            let mageTarget;
            if (mageCond && tacticsConditionWhenRequiresPickedTarget(mageCond)) {
              mageTarget = pickTarget(actor, heroUnits, monsterUnits, {
                skillId,
                conditions,
                rng,
                round,
                threat,
                tauntState,
                designatedTank: designatedTankUnit,
                monsterLastTarget
              });
              if (!mageTarget) continue;
              if (!checkCondition(mageCond, actor, mageTarget, heroUnits, monsterUnits, ctx)) continue;
            } else {
              if (mageCond && !checkCondition(mageCond, actor, null, heroUnits, monsterUnits, ctx)) continue;
              mageTarget = pickTarget(actor, heroUnits, monsterUnits, {
                skillId,
                conditions,
                rng,
                round,
                threat,
                tauntState,
                designatedTank: designatedTankUnit,
                monsterLastTarget
              });
              if (!mageTarget) continue;
            }
            const critBonus = skill.spellCritBonus ?? 0;
            const skillRoll = rng();
            const hitResult = rollHitCheck(actor, mageTarget, () => skillRoll);
            const isCrit = hitResult.isHit ? skillRoll < Math.min(1, (actor.spellCrit || 0) + critBonus) : false;
            if (skillId === "frost-nova") {
              const aliveMonsters = alive(monsterUnits);
              if (aliveMonsters.length === 0) continue;
              const sr2 = executeFrostNova(actor, aliveMonsters, skill, {
                isCrit,
                rng,
                isHit: hitResult.isHit
              });
              if (!actor.skillCooldowns) actor.skillCooldowns = {};
              actor.skillCooldowns[skillId] = round;
              const firstHit = sr2.hits[0];
              let targetHPBefore2 = mageTarget.currentHP;
              let targetHPAfter = mageTarget.currentHP;
              if (firstHit) {
                const m0 = aliveMonsters.find((m) => m.id === firstHit.targetId);
                if (m0) {
                  targetHPAfter = m0.currentHP;
                  targetHPBefore2 = targetHPAfter + firstHit.finalDamage;
                }
              }
              const entry2 = {
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr2.skillId,
                skillName: sr2.skillName,
                skillSpec: sr2.skillSpec,
                skillCoefficient: sr2.skillCoefficient,
                targetId: firstHit?.targetId ?? mageTarget.id,
                targetName: firstHit?.targetName ?? mageTarget.name,
                targetClass: (firstHit?.targetClass ?? mageTarget.class) || null,
                targetTier: (firstHit?.targetTier ?? mageTarget.tier) || null,
                damageType: "magic",
                rawDamage: sr2.rawDamage,
                isCrit,
                isMiss: !hitResult.isHit,
                finalHitChance: hitResult.finalHitChance,
                missChance: hitResult.missChance,
                attackerHit: hitResult.attackerHit,
                defenderDodge: hitResult.defenderDodge,
                levelAdjust: hitResult.levelAdjust,
                finalDamage: sr2.totalDamage,
                absorbed: 0,
                targetDefense: firstHit?.effectiveResistance ?? 0,
                targetHPBefore: targetHPBefore2,
                targetHPAfter,
                targetMaxHP: mageTarget.maxHP,
                manaConsumed: sr2.manaConsumed,
                manaAfter: actor.currentMP,
                cleaveTargets: sr2.hits.length,
                frostNovaHits: sr2.hits.map((h) => ({
                  targetId: h.targetId,
                  targetName: h.targetName,
                  freezeProcced: h.freezeProcced,
                  finalDamage: h.finalDamage
                }))
              };
              if (sr2.manaRefluxGain > 0) entry2.weaponManaReflux = sr2.manaRefluxGain;
              if (sr2.manaOnCastGain > 0) entry2.weaponManaOnCast = sr2.manaOnCastGain;
              if (sr2.spellPowerWeaponScaled != null) {
                entry2.spellPowerWeaponScaled = sr2.spellPowerWeaponScaled;
                entry2.spellPowerFlatBonus = sr2.spellPowerFlatBonus ?? 0;
              }
              const mhMag2 = heroMitigationNoteKind(actor, "magic");
              if (mhMag2) entry2.heroMitigationKind = mhMag2;
              if (sr2.hits.some((h) => h.freezeProcced)) {
                entry2.debuffApplied = true;
                entry2.debuffType = "freeze";
                entry2.debuffFreezeActions = 1;
              }
              for (const h of sr2.hits) {
                if (h.finalDamage > 0) {
                  addThreatFromDamage(threat, h.targetId, actor.id, h.finalDamage, 1);
                }
              }
              if (firstHit && firstHit.finalDamage > 0) {
                entry2.threatAmount = firstHit.finalDamage;
                entry2.threatTargetName = firstHit.targetName;
              }
              pushCombatLog(entry2);
              usedSkill = true;
              break;
            }
            const targetHPBefore = mageTarget.currentHP;
            const sr = executeMageSkill(actor, mageTarget, skill, {
              isCrit,
              rng,
              isHit: hitResult.isHit
            });
            if (!actor.skillCooldowns) actor.skillCooldowns = {};
            actor.skillCooldowns[skillId] = round;
            const entry = {
              round,
              actorId: actor.id,
              actorName: actor.name,
              actorAgility: actor.agility ?? 0,
              actorClass: actor.class,
              actorTier: null,
              action: "skill",
              skillId: sr.skillId,
              skillName: sr.skillName,
              skillSpec: sr.skillSpec,
              skillCoefficient: sr.skillCoefficient,
              targetId: mageTarget.id,
              targetName: mageTarget.name,
              targetClass: mageTarget.class || null,
              targetTier: mageTarget.tier || null,
              damageType: "magic",
              rawDamage: sr.rawDamage,
              isCrit: sr.isCrit,
              isMiss: !sr.isHit,
              finalHitChance: hitResult.finalHitChance,
              missChance: hitResult.missChance,
              attackerHit: hitResult.attackerHit,
              defenderDodge: hitResult.defenderDodge,
              levelAdjust: hitResult.levelAdjust,
              finalDamage: sr.finalDamage,
              absorbed: Math.max(0, sr.rawAfterCrit - sr.finalDamage),
              targetDefense: sr.effectiveResistance,
              targetHPBefore,
              targetHPAfter: mageTarget.currentHP,
              targetMaxHP: mageTarget.maxHP,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP
            };
            if (sr.arcaneFollowupDamage > 0) {
              entry.weaponArcaneFollowupDamage = sr.arcaneFollowupDamage;
              entry.primaryFinalDamage = sr.primaryMagicDamage;
            }
            if (sr.manaRefluxGain > 0) entry.weaponManaReflux = sr.manaRefluxGain;
            if (sr.manaOnCastGain > 0) entry.weaponManaOnCast = sr.manaOnCastGain;
            if (sr.spellPowerWeaponScaled != null) {
              entry.spellPowerWeaponScaled = sr.spellPowerWeaponScaled;
              entry.spellPowerFlatBonus = sr.spellPowerFlatBonus ?? 0;
            }
            const mhMag = heroMitigationNoteKind(actor, "magic");
            if (mhMag) entry.heroMitigationKind = mhMag;
            if (sr.debuffApplied || sr.debuffRefreshed) {
              entry.debuffApplied = sr.debuffApplied;
              entry.debuffRefreshed = sr.debuffRefreshed;
              entry.debuffType = sr.debuffType ?? (skill.id === "frostbolt" ? "freeze" : void 0);
              if (sr.debuffResistanceReduction != null) entry.debuffResistanceReduction = sr.debuffResistanceReduction;
              if (sr.debuffDuration != null) entry.debuffDuration = sr.debuffDuration;
              if (sr.debuffDamagePerRound != null) entry.debuffDamagePerRound = sr.debuffDamagePerRound;
              if (sr.debuffDamageType != null) entry.debuffDamageType = sr.debuffDamageType;
              if (sr.freezeSkipActions != null) entry.debuffFreezeActions = sr.freezeSkipActions;
            }
            if (skill.id === "frostbolt" && sr.freezeProcced !== void 0) {
              entry.frostboltFreezeProcced = sr.freezeProcced;
            }
            if (sr.finalDamage > 0) {
              addThreatFromDamage(threat, mageTarget.id, actor.id, sr.finalDamage, 1);
              entry.threatAmount = sr.finalDamage;
              entry.threatTargetName = mageTarget.name;
            }
            pushCombatLog(entry);
            usedSkill = true;
            break;
          }
          if (usedSkill) {
            emitMonsterIntentChangesIfNeeded();
            continue;
          }
          magePriorityNoCastThisTurn = true;
        }
        const priestSkillPriority = getSkillPriority(actor);
        if (actor.side === "hero" && actor.class === "Priest" && priestSkillPriority.length > 0) {
          let usedSkill = false;
          for (const skillId of priestSkillPriority) {
            if (skillId === "basic-attack") {
              const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx);
              if (!ba.ok) {
                emitMonsterIntentChangesIfNeeded();
                continue;
              }
              emitMonsterIntentChangesIfNeeded({ tauntExpiredMonsterIds: ba.tauntExpiredMonsterIds });
              usedSkill = true;
              heroConsumedExplicitPriorityBasicAttack = true;
              break;
            }
            const skill = getPriestSkillWithEnhancements(actor, skillId) ?? getAnyPriestSkillById(skillId);
            const manaCost = skill?.manaCost ?? 999;
            if (!skill || manaCost > (actor.currentMP || 0)) continue;
            const priestCond = conditions.find((c) => c.skillId === skillId);
            if (skillId === "flash-heal") {
              if (priestCond && !checkPriestFlashHealSkillAllowed(priestCond, actor, heroUnits, monsterUnits, ctx)) {
                continue;
              }
            } else if (priestCond && !tacticsConditionWhenRequiresPickedTarget(priestCond) && !checkCondition(priestCond, actor, null, heroUnits, monsterUnits, ctx)) {
              continue;
            }
            let priestTarget = null;
            if (skillId === "fade-mind") {
              priestTarget = actor;
            } else {
              priestTarget = pickTarget(actor, heroUnits, monsterUnits, {
                skillId,
                conditions,
                rng,
                round,
                threat,
                tauntState,
                designatedTank: designatedTankUnit,
                monsterLastTarget
              });
              if (!priestTarget) continue;
            }
            if (priestCond && tacticsConditionWhenRequiresPickedTarget(priestCond) && !checkCondition(priestCond, actor, priestTarget, heroUnits, monsterUnits, ctx)) {
              continue;
            }
            if (skillId === "flash-heal" || skillId === "greater-heal") {
              const sr = skillId === "greater-heal" ? executeGreaterHeal(actor, priestTarget, skill, { rng }) : executeFlashHeal(actor, priestTarget, skill, { rng });
              const entry = {
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                targetId: priestTarget.id,
                targetName: priestTarget.name,
                targetClass: priestTarget.class || null,
                targetTier: null,
                heal: sr.heal,
                targetHPBefore: sr.targetHPBefore,
                targetHPAfter: sr.targetHPAfter,
                targetMaxHP: sr.targetMaxHP,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP
              };
              const preStableIntentIds = snapshotStableIntentIdsForMonsters(alive(monsterUnits));
              const healThreatCount = addThreatFromHeal(
                threat,
                alive(monsterUnits),
                alive(heroUnits),
                tauntState,
                priestTarget.id,
                actor.id,
                sr.heal,
                monsterLastTarget
              );
              entry.threatHealAmount = healThreatCount > 0 ? Math.round(sr.heal * 0.5) : null;
              if (entry.threatHealAmount != null) {
                entry.threatBeneficiaryName = priestTarget.name;
                entry.threatBeneficiaryClass = priestTarget.class || null;
              }
              pushCombatLog(entry);
              emitMonsterIntentChangesIfNeeded({ preStableIntentIds });
              usedSkill = true;
              break;
            }
            if (skillId === "power-word-shield") {
              const sr = executePowerWordShield(actor, priestTarget, skill, { rng });
              const preStableIntentIds = snapshotStableIntentIdsForMonsters(alive(monsterUnits));
              const shieldThreatCount = addThreatFromShield(
                threat,
                alive(monsterUnits),
                alive(heroUnits),
                tauntState,
                priestTarget.id,
                actor.id,
                sr.absorbAmount,
                monsterLastTarget
              );
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                targetId: priestTarget.id,
                targetName: priestTarget.name,
                targetClass: priestTarget.class || null,
                targetTier: null,
                absorbAmount: sr.absorbAmount,
                shieldDuration: sr.shieldDuration,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP,
                threatShieldAmount: shieldThreatCount > 0 ? Math.round(sr.absorbAmount * 0.25) : null,
                threatBeneficiaryName: shieldThreatCount > 0 ? priestTarget.name : void 0,
                threatBeneficiaryClass: shieldThreatCount > 0 ? priestTarget.class || null : void 0
              });
              emitMonsterIntentChangesIfNeeded({ preStableIntentIds });
              usedSkill = true;
              break;
            }
            if (skillId === "fade-mind") {
              let cleared = 0;
              for (const m of alive(monsterUnits)) {
                if (!threat[m.id]) continue;
                const before = threat[m.id][actor.id] ?? 0;
                if (before > 0) cleared += before;
                threat[m.id][actor.id] = 0;
              }
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: skill.id,
                skillName: skill.name,
                skillSpec: skill.spec,
                targetId: actor.id,
                targetName: actor.name,
                targetClass: actor.class || null,
                targetTier: null,
                manaConsumed: skill.manaCost ?? 0,
                manaAfter: actor.currentMP,
                threatCleared: cleared
              });
              emitMonsterIntentChangesIfNeeded();
              usedSkill = true;
              break;
            }
            if (skillId === "shadow-word-pain") {
              const skillRoll = rng();
              const hitResult = rollHitCheck(actor, priestTarget, () => skillRoll);
              const sr = executeShadowWordPain(actor, priestTarget, skill, { rng, isHit: hitResult.isHit });
              if (sr.finalDamage > 0) {
                addThreatFromDamage(threat, priestTarget.id, actor.id, sr.finalDamage, 1);
              }
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                targetId: priestTarget.id,
                targetName: priestTarget.name,
                targetClass: priestTarget.class || null,
                targetTier: priestTarget.tier || null,
                damageType: "magic",
                isMiss: !sr.isHit,
                finalHitChance: hitResult.finalHitChance,
                missChance: hitResult.missChance,
                attackerHit: hitResult.attackerHit,
                defenderDodge: hitResult.defenderDodge,
                levelAdjust: hitResult.levelAdjust,
                finalDamage: sr.finalDamage,
                targetHPBefore: sr.targetHPBefore,
                targetHPAfter: sr.targetHPAfter,
                targetMaxHP: sr.targetMaxHP,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP,
                debuffApplied: sr.debuffApplied,
                debuffRefreshed: sr.debuffRefreshed,
                debuffType: sr.debuffType,
                debuffDuration: sr.debuffDuration,
                debuffDamagePerRound: sr.debuffDamagePerRound,
                debuffDamageType: sr.debuffDamageType,
                threatAmount: sr.finalDamage > 0 ? sr.finalDamage : null,
                threatTargetName: sr.finalDamage > 0 ? priestTarget.name : null
              });
              emitMonsterIntentChangesIfNeeded();
              usedSkill = true;
              break;
            }
          }
          if (usedSkill) {
            continue;
          }
          priestPriorityNoCastThisTurn = true;
        }
        const druidSkillPriority = getSkillPriority(actor);
        if (actor.side === "hero" && actor.class === "Druid" && druidSkillPriority.length > 0) {
          let usedSkill = false;
          for (const skillId of druidSkillPriority) {
            if (skillId === "basic-attack") {
              const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx);
              if (!ba.ok) {
                emitMonsterIntentChangesIfNeeded();
                continue;
              }
              emitMonsterIntentChangesIfNeeded({ tauntExpiredMonsterIds: ba.tauntExpiredMonsterIds });
              usedSkill = true;
              heroConsumedExplicitPriorityBasicAttack = true;
              break;
            }
            const skill = getDruidSkillWithEnhancements(actor, skillId) ?? getAnyDruidSkillById(skillId);
            const manaCost = skill?.manaCost ?? 999;
            if (!skill || manaCost > (actor.currentMP || 0)) continue;
            const cooldown = skill.cooldown ?? 0;
            const lastUsed = actor.skillCooldowns?.[skillId] ?? 0;
            if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue;
            const druidCond = conditions.find((c) => c.skillId === skillId);
            if (skillId === "rejuvenation" || skillId === "regrowth") {
              if (druidCond && !checkAllyEmergencyHealSkillAllowed(druidCond, actor, heroUnits, monsterUnits, ctx)) {
                continue;
              }
            } else if (druidCond && skillId !== "bear-form" && !tacticsConditionWhenRequiresPickedTarget(druidCond) && !checkCondition(druidCond, actor, null, heroUnits, monsterUnits, ctx)) {
              continue;
            }
            if (skillId === "bear-form") {
              if (druidCond && !checkCondition(druidCond, actor, null, heroUnits, monsterUnits, ctx)) continue;
              const sr = executeBearForm(actor, skill);
              if (!actor.skillCooldowns) actor.skillCooldowns = {};
              actor.skillCooldowns[skillId] = round;
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                targetId: actor.id,
                targetName: actor.name,
                targetClass: actor.class || null,
                targetTier: null,
                bearFormApplied: true,
                bearFormPct: sr.damageReductionPct,
                bearFormRounds: sr.stanceDuration,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP
              });
              usedSkill = true;
              break;
            }
            let druidTarget = pickTarget(actor, heroUnits, monsterUnits, {
              skillId,
              conditions,
              rng,
              round,
              threat,
              tauntState,
              designatedTank: designatedTankUnit,
              monsterLastTarget
            });
            if (!druidTarget) continue;
            if (druidCond && tacticsConditionWhenRequiresPickedTarget(druidCond) && !checkCondition(druidCond, actor, druidTarget, heroUnits, monsterUnits, ctx)) {
              continue;
            }
            if (skillId === "rejuvenation") {
              const sr = executeRejuvenation(actor, druidTarget, skill, { rng });
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                targetId: druidTarget.id,
                targetName: druidTarget.name,
                targetClass: druidTarget.class || null,
                targetTier: null,
                hotApplied: sr.hotApplied,
                hotRefreshed: sr.hotRefreshed,
                hotHealPerRound: sr.hotHealPerRound,
                hotDuration: sr.hotDuration,
                targetHPBefore: sr.targetHPBefore,
                targetHPAfter: sr.targetHPAfter,
                targetMaxHP: sr.targetMaxHP,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP
              });
              usedSkill = true;
              break;
            }
            if (skillId === "regrowth") {
              const sr = executeRegrowth(actor, druidTarget, skill, { rng });
              const preStableIntentIds = snapshotStableIntentIdsForMonsters(alive(monsterUnits));
              const healThreatCount = addThreatFromHeal(
                threat,
                alive(monsterUnits),
                alive(heroUnits),
                tauntState,
                druidTarget.id,
                actor.id,
                sr.heal,
                monsterLastTarget,
                actor
              );
              const healThreatMult = getEffectiveThreatMultiplierForHero(actor, 1);
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                skillCoefficient: sr.skillCoefficient,
                targetId: druidTarget.id,
                targetName: druidTarget.name,
                targetClass: druidTarget.class || null,
                targetTier: null,
                heal: sr.heal,
                hotApplied: sr.hotApplied,
                hotRefreshed: sr.hotRefreshed,
                hotHealPerRound: sr.hotHealPerRound,
                hotDuration: sr.hotDuration,
                targetHPBefore: sr.targetHPBefore,
                targetHPAfter: sr.targetHPAfter,
                targetMaxHP: sr.targetMaxHP,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP,
                threatHealAmount: healThreatCount > 0 ? Math.round(sr.heal * 0.5 * healThreatMult) : null,
                threatBeneficiaryName: healThreatCount > 0 ? druidTarget.name : void 0,
                threatBeneficiaryClass: healThreatCount > 0 ? druidTarget.class || null : void 0
              });
              emitMonsterIntentChangesIfNeeded({ preStableIntentIds });
              usedSkill = true;
              break;
            }
            if (skillId === "maul" || skillId === "rake") {
              const skillRoll = rng();
              const hitResult = rollHitCheck(actor, druidTarget, () => skillRoll);
              const isCrit = hitResult.isHit ? skillRoll < (actor.physCrit || 0) : false;
              const sr = skillId === "maul" ? executeMaul(actor, druidTarget, skill, { rng, isCrit, isHit: hitResult.isHit }) : executeRake(actor, druidTarget, skill, { rng, isCrit, isHit: hitResult.isHit });
              const baseThreatMult = skillId === "maul" ? skill.threatMultiplier ?? getThreatMultiplier(skillId) : 1;
              if (sr.finalDamage > 0) {
                addThreatFromDamage(threat, druidTarget.id, actor.id, sr.finalDamage, baseThreatMult, actor);
              }
              const entry = {
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                skillCoefficient: sr.skillCoefficient,
                targetId: druidTarget.id,
                targetName: druidTarget.name,
                targetClass: druidTarget.class || null,
                targetTier: druidTarget.tier || null,
                damageType: "physical",
                rawDamage: sr.rawDamage,
                isCrit: sr.isCrit,
                isMiss: !sr.isHit,
                finalHitChance: hitResult.finalHitChance,
                missChance: hitResult.missChance,
                attackerHit: hitResult.attackerHit,
                defenderDodge: hitResult.defenderDodge,
                levelAdjust: hitResult.levelAdjust,
                finalDamage: sr.finalDamage,
                absorbed: sr.effectiveArmor != null ? Math.max(0, (sr.rawDamage ?? 0) - sr.finalDamage) : void 0,
                targetDefense: sr.effectiveArmor,
                targetHPBefore: sr.targetHPBefore ?? druidTarget.currentHP,
                targetHPAfter: druidTarget.currentHP,
                targetMaxHP: druidTarget.maxHP,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP
              };
              if (sr.weaponAddedMagicDamage > 0) {
                entry.weaponAddedMagicDamage = sr.weaponAddedMagicDamage;
                entry.primaryFinalDamage = sr.primaryPhysDamage;
              }
              if (sr.weaponLifeStealHeal > 0) entry.weaponLifeStealHeal = sr.weaponLifeStealHeal;
              if (sr.weaponLifeOnHitHeal > 0) entry.weaponLifeOnHitHeal = sr.weaponLifeOnHitHeal;
              if (skillId === "rake") {
                entry.debuffApplied = sr.debuffApplied;
                entry.debuffRefreshed = sr.debuffRefreshed;
                entry.debuffType = sr.debuffType;
                entry.debuffDuration = sr.debuffDuration;
                entry.debuffDamagePerRound = sr.debuffDamagePerRound;
                entry.debuffDamageType = sr.debuffDamageType;
              }
              if (sr.finalDamage > 0) {
                entry.threatAmount = Math.round(sr.finalDamage * getEffectiveThreatMultiplierForHero(actor, baseThreatMult));
                entry.threatTargetName = druidTarget.name;
              }
              pushCombatLog(entry);
              usedSkill = true;
              break;
            }
          }
          if (usedSkill) {
            continue;
          }
          druidPriorityNoCastThisTurn = true;
        }
        const paladinSkillPriority = getSkillPriority(actor);
        if (actor.side === "hero" && actor.class === "Paladin" && paladinSkillPriority.length > 0) {
          let usedSkill = false;
          for (const skillId of paladinSkillPriority) {
            if (skillId === "basic-attack") {
              const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx);
              if (!ba.ok) {
                emitMonsterIntentChangesIfNeeded();
                continue;
              }
              emitMonsterIntentChangesIfNeeded({ tauntExpiredMonsterIds: ba.tauntExpiredMonsterIds });
              usedSkill = true;
              heroConsumedExplicitPriorityBasicAttack = true;
              break;
            }
            const skill = getPaladinSkillWithEnhancements(actor, skillId) ?? getAnyPaladinSkillById(skillId);
            const manaCost = skill?.manaCost ?? 999;
            if (!skill || manaCost > (actor.currentMP || 0)) continue;
            const cooldown = skill.cooldown ?? 0;
            const lastUsed = actor.skillCooldowns?.[skillId] ?? 0;
            if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue;
            const paladinCond = conditions.find((c) => c.skillId === skillId);
            if (skillId === "lay-on-hands") {
              if (paladinCond && !checkAllyEmergencyHealSkillAllowed(paladinCond, actor, heroUnits, monsterUnits, ctx)) {
                continue;
              }
            } else if (paladinCond && skillId !== "seal-of-righteousness" && !tacticsConditionWhenRequiresPickedTarget(paladinCond) && !checkCondition(paladinCond, actor, null, heroUnits, monsterUnits, ctx)) {
              continue;
            }
            if (skillId === "seal-of-righteousness") {
              if (paladinCond && !checkCondition(paladinCond, actor, null, heroUnits, monsterUnits, ctx)) continue;
              const sr = executeSealOfRighteousness(actor, skill);
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                targetId: actor.id,
                targetName: actor.name,
                targetClass: actor.class || null,
                targetTier: null,
                sealApplied: sr.sealApplied,
                sealRefreshed: sr.sealRefreshed,
                sealRounds: sr.sealRounds,
                sealRiderCoeff: sr.sealRiderCoeff,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP
              });
              usedSkill = true;
              break;
            }
            if (skillId === "consecration") {
              const aliveMonsters = alive(monsterUnits);
              if (aliveMonsters.length === 0) continue;
              const skillRoll = rng();
              const sampleTarget = aliveMonsters[0];
              const hitResult = rollHitCheck(actor, sampleTarget, () => skillRoll);
              const isCrit = hitResult.isHit ? skillRoll < (actor.spellCrit || 0) : false;
              const sr = executeConsecration(actor, aliveMonsters, skill, {
                rng,
                isCrit,
                isHit: hitResult.isHit
              });
              if (!actor.skillCooldowns) actor.skillCooldowns = {};
              actor.skillCooldowns[skillId] = round;
              const threatMult = sr.threatMultiplier ?? 1.4;
              for (const hit of sr.hits) {
                if (hit.finalDamage > 0) {
                  addThreatFromDamage(threat, hit.targetId, actor.id, hit.finalDamage, threatMult, actor);
                  const m = aliveMonsters.find((x) => x.id === hit.targetId);
                  if (m) appendSealRiderLog(actor, m);
                }
              }
              const firstHit = sr.hits[0];
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                skillCoefficient: sr.skillCoefficient,
                targetId: firstHit?.targetId ?? sampleTarget.id,
                targetName: firstHit?.targetName ?? sampleTarget.name,
                targetClass: firstHit?.targetClass ?? null,
                targetTier: firstHit?.targetTier ?? null,
                damageType: "magic",
                finalDamage: sr.totalDamage,
                isCrit: sr.isCrit,
                isMiss: !sr.isHit,
                finalHitChance: hitResult.finalHitChance,
                missChance: hitResult.missChance,
                attackerHit: hitResult.attackerHit,
                defenderDodge: hitResult.defenderDodge,
                levelAdjust: hitResult.levelAdjust,
                consecrationHits: sr.hits,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP,
                threatAmount: sr.totalDamage > 0 ? Math.round(sr.totalDamage * getEffectiveThreatMultiplierForHero(actor, threatMult)) : null,
                threatTargetName: sr.totalDamage > 0 ? firstHit?.targetName ?? sampleTarget.name : null
              });
              usedSkill = true;
              break;
            }
            let paladinTarget = pickTarget(actor, heroUnits, monsterUnits, {
              skillId,
              conditions,
              rng,
              round,
              threat,
              tauntState,
              designatedTank: designatedTankUnit,
              monsterLastTarget
            });
            if (!paladinTarget) continue;
            if (paladinCond && tacticsConditionWhenRequiresPickedTarget(paladinCond) && !checkCondition(paladinCond, actor, paladinTarget, heroUnits, monsterUnits, ctx)) {
              continue;
            }
            if (skillId === "lay-on-hands") {
              const sr = executeLayOnHands(actor, paladinTarget, skill);
              if (!actor.skillCooldowns) actor.skillCooldowns = {};
              actor.skillCooldowns[skillId] = round;
              const preStableIntentIds = snapshotStableIntentIdsForMonsters(alive(monsterUnits));
              const healThreatCount = addThreatFromHeal(
                threat,
                alive(monsterUnits),
                alive(heroUnits),
                tauntState,
                paladinTarget.id,
                actor.id,
                sr.heal,
                monsterLastTarget
              );
              pushCombatLog({
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                targetId: paladinTarget.id,
                targetName: paladinTarget.name,
                targetClass: paladinTarget.class || null,
                targetTier: null,
                heal: sr.heal,
                targetHPBefore: sr.targetHPBefore,
                targetHPAfter: sr.targetHPAfter,
                targetMaxHP: sr.targetMaxHP,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP,
                threatHealAmount: healThreatCount > 0 ? Math.round(sr.heal * 0.5) : null,
                threatBeneficiaryName: healThreatCount > 0 ? paladinTarget.name : void 0,
                threatBeneficiaryClass: healThreatCount > 0 ? paladinTarget.class || null : void 0
              });
              emitMonsterIntentChangesIfNeeded({ preStableIntentIds });
              usedSkill = true;
              break;
            }
            if (skillId === "judgement" || skillId === "hammer-of-justice") {
              const skillRoll = rng();
              const hitResult = rollHitCheck(actor, paladinTarget, () => skillRoll);
              const isCrit = skillId === "hammer-of-justice" ? hitResult.isHit && skillRoll < (actor.physCrit || 0) : hitResult.isHit && skillRoll < (actor.spellCrit || 0);
              const sr = skillId === "hammer-of-justice" ? executeHammerOfJustice(actor, paladinTarget, skill, { rng, isCrit, isHit: hitResult.isHit }) : executeJudgement(actor, paladinTarget, skill, { rng, isCrit, isHit: hitResult.isHit });
              if (skillId === "hammer-of-justice" && cooldown > 0) {
                if (!actor.skillCooldowns) actor.skillCooldowns = {};
                actor.skillCooldowns[skillId] = round;
              }
              const judgementThreatMult = skillId === "judgement" ? skill.threatMultiplier ?? 1.25 : 1;
              if (sr.finalDamage > 0) {
                addThreatFromDamage(
                  threat,
                  paladinTarget.id,
                  actor.id,
                  sr.finalDamage,
                  judgementThreatMult,
                  actor
                );
              }
              const entry = {
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: "skill",
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                skillCoefficient: sr.skillCoefficient,
                targetId: paladinTarget.id,
                targetName: paladinTarget.name,
                targetClass: paladinTarget.class || null,
                targetTier: paladinTarget.tier || null,
                damageType: skillId === "judgement" ? "magic" : "physical",
                rawDamage: sr.rawDamage,
                isCrit: sr.isCrit,
                isMiss: !sr.isHit,
                finalHitChance: hitResult.finalHitChance,
                missChance: hitResult.missChance,
                attackerHit: hitResult.attackerHit,
                defenderDodge: hitResult.defenderDodge,
                levelAdjust: hitResult.levelAdjust,
                finalDamage: sr.finalDamage,
                targetHPBefore: sr.targetHPBefore,
                targetHPAfter: sr.targetHPAfter,
                targetMaxHP: sr.targetMaxHP,
                manaConsumed: sr.manaConsumed,
                manaAfter: actor.currentMP
              };
              if (skillId === "judgement") {
                entry.targetDefense = sr.effectiveResistance;
                if (sr.sealBonusDamage > 0) entry.sealJudgementBonus = sr.sealBonusDamage;
                if (sr.sealRefreshed) entry.sealRefreshed = true;
              }
              if (skillId === "hammer-of-justice") {
                entry.primaryFinalDamage = sr.primaryPhysDamage;
                entry.holyDamage = sr.holyDamage;
                entry.targetDefense = sr.effectiveArmor;
                entry.debuffApplied = sr.debuffApplied;
                entry.debuffRefreshed = sr.debuffRefreshed;
                entry.debuffType = sr.debuffType;
                entry.debuffSkipActions = sr.debuffSkipActions;
              }
              if (sr.finalDamage > 0) {
                const baseThreatMult = skillId === "judgement" ? judgementThreatMult : 1;
                entry.threatAmount = Math.round(
                  sr.finalDamage * getEffectiveThreatMultiplierForHero(actor, baseThreatMult)
                );
                entry.threatTargetName = paladinTarget.name;
                appendSealRiderLog(actor, paladinTarget);
              }
              pushCombatLog(entry);
              usedSkill = true;
              break;
            }
          }
          if (usedSkill) {
            continue;
          }
          paladinPriorityNoCastThisTurn = true;
        }
        if (actor.side === "hero" && heroConsumedExplicitPriorityBasicAttack) {
          emitMonsterIntentChangesIfNeeded();
          continue;
        }
        const priorityForResource = getSkillPriority(actor);
        const basicAttackInPriority = priorityForResource.includes("basic-attack");
        if (actor.side === "hero" && basicAttackInPriority) {
          emitMonsterIntentChangesIfNeeded();
          continue;
        }
        const relaxBasicAttackTacticGates = actor.side === "hero" && (actor.class === "Mage" || actor.class === "Priest" || actor.class === "Druid" || actor.class === "Paladin") && !basicAttackInPriority && (heroAllPrioritySkillsUnaffordable(actor, priorityForResource) || actor.class === "Mage" && magePriorityNoCastThisTurn || actor.class === "Priest" && priestPriorityNoCastThisTurn || actor.class === "Druid" && druidPriorityNoCastThisTurn || actor.class === "Paladin" && paladinPriorityNoCastThisTurn);
        const conditionsForBasicAttack = relaxBasicAttackTacticGates && actor.side === "hero" ? relaxBasicAttackConditionsKeepingTargetRules(conditions || []) : conditions;
        let target = defaultTarget;
        if (actor.side === "hero") {
          target = pickTarget(actor, heroUnits, monsterUnits, {
            skillId: "basic-attack",
            conditions: conditionsForBasicAttack,
            rng,
            threat,
            tauntState,
            designatedTank: designatedTankUnit,
            monsterLastTarget
          }) ?? null;
          if (!target) {
            emitMonsterIntentChangesIfNeeded();
            continue;
          }
        }
        if (actor.side === "hero") {
          const baCond = conditions.find((c) => c.skillId === "basic-attack");
          if (baCond && !relaxBasicAttackTacticGates && tacticsConditionWhenRequiresPickedTarget(baCond) && !checkCondition(baCond, actor, target, heroUnits, monsterUnits, ctx)) {
            pushCombatLog({
              round,
              type: "actionSkipped",
              skipReason: "tactics-gate",
              actorId: actor.id,
              actorName: actor.name,
              actorClass: actor.class || null,
              actorTier: null,
              actorAgility: actor.agility ?? 0
            });
            continue;
          }
        }
        const tauntExpiredMonsterIdsAfterSwing = executeBasicAttackDamagePhase(actor, target);
        emitMonsterIntentChangesIfNeeded({ tauntExpiredMonsterIds: tauntExpiredMonsterIdsAfterSwing });
      }
      for (const unit of [...heroUnits, ...monsterUnits]) {
        if (unit.currentHP <= 0) continue;
        const dotDebuffs = (unit.debuffs || []).filter(
          (d) => (d.type === "bleed" || d.type === "burn" || d.type === "shadow-pain") && d.damagePerRound > 0
        );
        for (const d of dotDebuffs) {
          let dotDamage = d.damagePerRound;
          if (unit.side === "hero") {
            dotDamage = applyDefensiveStanceToIncomingDamage(unit, dotDamage).finalDamage;
          }
          const hpBefore = unit.currentHP;
          const dotShieldCasterId = unit.shield?.casterId ?? null;
          const sr = applyDamageToShieldedUnit(unit, dotDamage);
          pushCombatLog({
            round,
            type: "dot",
            targetId: unit.id,
            targetName: unit.name,
            targetClass: unit.class || null,
            targetTier: unit.tier || null,
            debuffType: d.type,
            damage: dotDamage,
            ...sr.absorbed > 0 ? {
              shieldAbsorbed: sr.absorbed,
              shieldBroke: sr.shieldBroke,
              shieldAbsorbRemainingAfter: unit.shield?.absorbRemaining ?? 0,
              shieldRemainingRoundsAfter: unit.shield?.remainingRounds ?? null,
              ...dotShieldCasterId != null && dotShieldCasterId !== "" ? { shieldCasterId: dotShieldCasterId } : {}
            } : {},
            targetHPBefore: hpBefore,
            targetHPAfter: unit.currentHP,
            targetMaxHP: unit.maxHP,
            debuffDamagePerRound: dotDamage,
            debuffDamageType: d.damageType || "magic"
          });
        }
      }
      for (const unit of heroUnits) {
        if (unit.currentHP <= 0) continue;
        const hotBuffs = (unit.buffs || []).filter(
          (b) => DRUID_HOT_BUFF_TYPES.includes(b.type) && (b.remainingRounds ?? 0) > 0 && (b.healPerRound ?? 0) > 0
        );
        for (const h of hotBuffs) {
          const hpBefore = unit.currentHP;
          unit.currentHP = Math.min(unit.maxHP, hpBefore + h.healPerRound);
          const actualHeal = unit.currentHP - hpBefore;
          if (actualHeal <= 0) continue;
          const caster = heroUnits.find((x) => x.id === h.casterId);
          pushCombatLog({
            round,
            type: "hot",
            targetId: unit.id,
            targetName: unit.name,
            targetClass: unit.class || null,
            targetTier: null,
            hotType: h.type,
            sourceSkillId: h.sourceSkillId,
            heal: actualHeal,
            hotHealPerRound: h.healPerRound,
            targetHPBefore: hpBefore,
            targetHPAfter: unit.currentHP,
            targetMaxHP: unit.maxHP,
            casterId: h.casterId,
            casterName: caster?.name
          });
          if (caster) {
            const healThreatMult = getEffectiveThreatMultiplierForHero(caster, 1);
            const healThreatCount = addThreatFromHeal(
              threat,
              alive(monsterUnits),
              alive(heroUnits),
              tauntState,
              unit.id,
              caster.id,
              actualHeal,
              monsterLastTarget,
              caster
            );
            if (healThreatCount > 0) {
              log[log.length - 1].threatHealAmount = Math.round(actualHeal * 0.5 * healThreatMult);
              log[log.length - 1].threatBeneficiaryName = unit.name;
              log[log.length - 1].threatBeneficiaryClass = unit.class || null;
            }
          }
        }
      }
      const monstersAliveForRegen = alive(monsterUnits).length > 0;
      if (monstersAliveForRegen) {
        const manaRegenUpdates = [];
        for (const hero of heroUnits) {
          if (hero.currentHP <= 0) continue;
          if (hero.class !== "Mage" && hero.class !== "Priest" && hero.class !== "Druid") continue;
          const manaBefore = Math.min(hero.maxMP, Math.max(0, hero.currentMP || 0));
          if (manaBefore >= hero.maxMP) continue;
          const regenRaw = (hero.spirit || 0) * MANA_REGEN_SPIRIT_SCALE + (hero.equipmentRecoveryBonus ?? 0);
          const regenFloored = Math.floor(regenRaw);
          if (regenFloored <= 0) continue;
          const manaGained = Math.min(hero.maxMP - manaBefore, regenFloored);
          hero.currentMP = manaBefore + manaGained;
          manaRegenUpdates.push({
            actorId: hero.id,
            actorName: hero.name,
            actorClass: hero.class,
            manaBefore,
            manaGained,
            regenRaw,
            regenFloored,
            manaRegenSpiritScale: MANA_REGEN_SPIRIT_SCALE,
            manaAfter: hero.currentMP,
            maxMP: hero.maxMP,
            spirit: hero.spirit || 0,
            equipmentRecoveryBonus: hero.equipmentRecoveryBonus || 0
          });
        }
        if (manaRegenUpdates.length > 0) {
          pushCombatLog({ round, type: "manaRegenBatch", updates: manaRegenUpdates });
        }
        const hpRegenUpdates = [];
        for (const hero of heroUnits) {
          if (hero.currentHP <= 0) continue;
          const regen = Math.floor(hero.hpRegen || 0);
          if (regen <= 0) continue;
          const hpBefore = Math.min(hero.maxHP, Math.max(0, hero.currentHP || 0));
          if (hpBefore >= hero.maxHP) continue;
          const hpGained = Math.min(hero.maxHP - hpBefore, regen);
          hero.currentHP = hpBefore + hpGained;
          hpRegenUpdates.push({
            actorId: hero.id,
            actorName: hero.name,
            actorClass: hero.class,
            hpBefore,
            hpGained,
            regenFloored: regen,
            hpAfter: hero.currentHP,
            maxHP: hero.maxHP
          });
        }
        if (hpRegenUpdates.length > 0) {
          pushCombatLog({ round, type: "hpRegenBatch", updates: hpRegenUpdates });
        }
      }
      for (const unit of heroUnits) {
        if (unit.currentHP <= 0 || !unit.shield) continue;
        unit.shield.remainingRounds = (unit.shield.remainingRounds ?? 1) - 1;
        if (unit.shield.remainingRounds <= 0) delete unit.shield;
      }
      for (const unit of [...heroUnits, ...monsterUnits]) {
        tickDebuffs(unit);
      }
      for (const unit of heroUnits) {
        tickHeroBuffs(unit);
      }
      pushCombatLog({ round, type: "roundMaintenance" });
      round += 1;
    }
    const heroesAlive = alive(heroUnits).length > 0;
    const monstersAlive = alive(monsterUnits).length > 0;
    let outcome = "draw";
    if (heroesAlive && !monstersAlive) outcome = "victory";
    if (!heroesAlive && monstersAlive) outcome = "defeat";
    return {
      outcome,
      rounds: round - 1,
      combatActionSteps,
      log,
      steps,
      encounter,
      battleStats,
      initialOrder,
      turnActedByRound,
      rewards: outcome === "victory" ? rewardForVictory(monsterUnits, heroes, rng) : { exp: 0, gold: 0, equipment: [] },
      heroesAfter: heroUnits,
      monstersAfter: monsterUnits
    };
  }
  var REST_EXTRA_STEPS_PER_DEATH = 5;
  function heroesFullyRecovered(heroes) {
    return heroes.every((hero) => {
      const hpFull = hero.currentHP >= hero.maxHP;
      const mpFull = hero.class === "Warrior" ? true : hero.currentMP >= hero.maxMP;
      return hpFull && mpFull;
    });
  }
  function startRestPhase(heroes, { deathCount = 0, base = 3, spiritScale = 1, extraStepsPerDeath = REST_EXTRA_STEPS_PER_DEATH } = {}) {
    const deaths = Math.max(0, Math.floor(Number(deathCount) || 0));
    const perDeath = Math.max(0, Math.floor(Number(extraStepsPerDeath) || 0));
    return {
      heroes: heroes.map((hero) => ({
        ...hero,
        currentHP: hero.currentHP ?? hero.maxHP,
        // Warriors: Rage resets to 0 after combat; does not recover during rest
        currentMP: hero.class === "Warrior" ? 0 : hero.currentMP ?? hero.maxMP
      })),
      config: { deathCount: deaths, base, spiritScale, extraStepsPerDeath: perDeath },
      penaltyStepsRemaining: deaths * perDeath,
      isComplete: false,
      step: 0
    };
  }
  function applyRestStep(restState) {
    if (restState.isComplete) return restState;
    const next = deepCopy(restState);
    if (typeof next.penaltyStepsRemaining !== "number") {
      next.penaltyStepsRemaining = 0;
    }
    const wasFullyRecovered = heroesFullyRecovered(next.heroes);
    const { base, spiritScale } = next.config;
    for (const hero of next.heroes) {
      const baseRecovery = base + hero.spirit * spiritScale + (hero.equipmentRecoveryBonus || 0);
      const effectiveRecovery = Math.max(1, Math.floor(baseRecovery));
      hero.currentHP = clamp(hero.currentHP + effectiveRecovery, 0, hero.maxHP);
      if (hero.class !== "Warrior") {
        hero.currentMP = clamp(hero.currentMP + effectiveRecovery, 0, hero.maxMP);
      }
    }
    next.step += 1;
    const fullyRecovered = heroesFullyRecovered(next.heroes);
    if (fullyRecovered && wasFullyRecovered && next.penaltyStepsRemaining > 0) {
      next.penaltyStepsRemaining -= 1;
    }
    next.isComplete = fullyRecovered && next.penaltyStepsRemaining <= 0;
    return next;
  }

  // frontend/src/game/battleLogFormat.js
  function netDamageToHp(entry) {
    if (entry == null) return 0;
    if (entry.type === "dot") {
      const gross = entry.damage ?? 0;
      const absorbed2 = entry.shieldAbsorbed ?? 0;
      return Math.max(0, gross - absorbed2);
    }
    if (entry.finalDamage == null) return 0;
    const absorbed = entry.shieldAbsorbed ?? 0;
    if (absorbed > 0) return Math.max(0, entry.finalDamage - absorbed);
    return entry.finalDamage;
  }

  // frontend/src/game/xpContributionRollup.js
  var XP_CONTRIBUTION_WEIGHTS = {
    damage: 1,
    heal: 0.6,
    shield: 0.5,
    taken: 0.45
  };
  function emptyContributionRecord() {
    return {
      damageDealt: 0,
      healingDone: 0,
      shieldMitigated: 0,
      damageTaken: 0,
      score: 0
    };
  }
  function rollupXpContributionFromBattleLog(log, weights = XP_CONTRIBUTION_WEIGHTS) {
    const byId = {};
    const ensure = (id) => {
      if (!byId[id]) byId[id] = emptyContributionRecord();
      return byId[id];
    };
    const addShieldAbsorb = (entry) => {
      const absorbed = Math.floor(Number(entry.shieldAbsorbed) || 0);
      if (absorbed <= 0) return;
      const casterRaw = entry.shieldCasterId;
      if (casterRaw == null || casterRaw === "") return;
      ensure(String(casterRaw)).shieldMitigated += absorbed;
    };
    if (!Array.isArray(log)) return byId;
    for (const raw of log) {
      if (!raw || typeof raw !== "object") continue;
      const e = (
        /** @type {Record<string, unknown>} */
        raw
      );
      if (e.type === "hot") {
        const heal = Math.floor(Number(e.heal) || 0);
        if (heal > 0 && e.casterId != null && e.casterId !== "") {
          ensure(String(e.casterId)).healingDone += heal;
        }
        continue;
      }
      if (e.type === "dot") {
        if (e.targetClass != null && e.targetId != null && e.targetId !== "") {
          const net = netDamageToHp(e);
          if (net > 0) ensure(String(e.targetId)).damageTaken += net;
        }
        addShieldAbsorb(e);
        continue;
      }
      if (e.type != null) continue;
      if (e.heal != null && Number(e.heal) > 0 && e.finalDamage == null && e.actorId != null && e.actorId !== "") {
        ensure(String(e.actorId)).healingDone += Math.floor(Number(e.heal));
      }
      if (e.isMiss === true) continue;
      const fd = Number(e.finalDamage);
      if (Number.isFinite(fd) && fd > 0 && e.actorClass && e.targetTier != null && e.actorId != null && e.actorId !== "") {
        const action = e.action;
        if (action === "skill" || action === "basic") {
          ensure(String(e.actorId)).damageDealt += Math.floor(fd);
        }
      }
      if (e.actorTier != null && e.targetClass != null && e.targetId != null && e.targetId !== "") {
        const net = netDamageToHp(e);
        if (net > 0) ensure(String(e.targetId)).damageTaken += net;
        addShieldAbsorb(e);
      }
    }
    for (const rec of Object.values(byId)) {
      rec.score = rec.damageDealt * weights.damage + rec.healingDone * weights.heal + rec.shieldMitigated * weights.shield + rec.damageTaken * weights.taken;
    }
    return byId;
  }
  function contributionScoresForHeroes(contributions, heroIds) {
    const scores = {};
    for (const id of heroIds) {
      scores[id] = contributions[id]?.score ?? 0;
    }
    return scores;
  }

  // frontend/src/game/experience.js
  var BASE_XP = 50;
  var CURVE_EXPONENT = 1.8;
  var MAX_LEVEL = 60;
  var POINTS_PER_LEVEL = 3;
  var XP_MIN_SHARE_RATIO = 0.5;
  function calculateXPRequired(level, baseXp = BASE_XP, exponent = CURVE_EXPONENT) {
    if (level >= MAX_LEVEL) return Infinity;
    return Math.floor(baseXp * Math.pow(level, exponent));
  }
  function distributeXP(totalXP, heroCount) {
    if (heroCount <= 0) return 0;
    return Math.floor(totalXP / heroCount);
  }
  function allocateXPByWeights(totalXP, heroIds, weights) {
    const out = Object.fromEntries(heroIds.map((id) => [id, 0]));
    if (totalXP <= 0 || heroIds.length <= 0) return out;
    const sum = heroIds.reduce((acc, id) => acc + Math.max(0, weights[id] ?? 0), 0);
    if (sum <= 0) {
      const base = Math.floor(totalXP / heroIds.length);
      let remainder2 = totalXP - base * heroIds.length;
      for (const id of heroIds) out[id] = base;
      for (let i = 0; remainder2 > 0; i += 1, remainder2 -= 1) {
        out[heroIds[i % heroIds.length]] += 1;
      }
      return out;
    }
    const parts = heroIds.map((id) => {
      const exact = totalXP * Math.max(0, weights[id] ?? 0) / sum;
      const base = Math.floor(exact);
      return { id, base, frac: exact - base };
    });
    let allocated = parts.reduce((acc, p) => acc + p.base, 0);
    let remainder = totalXP - allocated;
    for (const p of parts) out[p.id] = p.base;
    parts.sort((a, b) => b.frac - a.frac);
    for (let i = 0; remainder > 0; i += 1, remainder -= 1) {
      out[parts[i % parts.length].id] += 1;
    }
    return out;
  }
  function distributeXPByContribution(totalXP, heroIds, scores, opts = {}) {
    const out = Object.fromEntries(heroIds.map((id) => [id, 0]));
    if (totalXP <= 0 || heroIds.length <= 0) return out;
    const scoreSum = heroIds.reduce((acc, id) => acc + Math.max(0, scores[id] ?? 0), 0);
    if (scoreSum <= 0) {
      return allocateXPByWeights(totalXP, heroIds, Object.fromEntries(heroIds.map((id) => [id, 1])));
    }
    const minShareRatio = opts.minShareRatio ?? XP_MIN_SHARE_RATIO;
    const minEach = Math.floor(totalXP / heroIds.length * minShareRatio);
    const reserved = minEach * heroIds.length;
    let pool = totalXP - reserved;
    if (pool < 0) {
      return allocateXPByWeights(totalXP, heroIds, scores);
    }
    for (const id of heroIds) out[id] = minEach;
    const extra = allocateXPByWeights(pool, heroIds, scores);
    for (const id of heroIds) out[id] += extra[id] ?? 0;
    return out;
  }
  function planBattleXpDistribution(heroes, totalXP, log, opts = {}) {
    const heroIds = heroes.map((h) => h.id);
    const contributions = rollupXpContributionFromBattleLog(log, opts.weights ?? XP_CONTRIBUTION_WEIGHTS);
    for (const id of heroIds) {
      if (!contributions[id]) contributions[id] = { damageDealt: 0, healingDone: 0, shieldMitigated: 0, damageTaken: 0, score: 0 };
    }
    const scores = contributionScoresForHeroes(contributions, heroIds);
    const xpByHeroId = distributeXPByContribution(totalXP, heroIds, scores, opts);
    return { xpByHeroId, contributions, scores };
  }
  function applyXP(hero, xpGain, opts = {}) {
    const baseXp = opts.baseXp ?? BASE_XP;
    const exponent = opts.exponent ?? CURVE_EXPONENT;
    let xp = (hero.xp ?? 0) + xpGain;
    let level = hero.level ?? 1;
    let levelsGained = 0;
    let unassigned = hero.unassignedPoints ?? 0;
    if (level >= MAX_LEVEL) {
      hero.xp = 0;
      hero.unassignedPoints = unassigned;
      return { leveledUp: false, levelsGained: 0 };
    }
    let required = calculateXPRequired(level, baseXp, exponent);
    while (xp >= required && level < MAX_LEVEL) {
      xp -= required;
      level += 1;
      levelsGained += 1;
      unassigned += POINTS_PER_LEVEL;
      required = calculateXPRequired(level, baseXp, exponent);
    }
    hero.xp = xp;
    hero.level = level;
    hero.unassignedPoints = unassigned;
    return { leveledUp: levelsGained > 0, levelsGained };
  }
  function applyXPToHeroes(heroes, totalXP, opts = {}) {
    const { log, minShareRatio, weights, baseXp, exponent, ...rest } = opts;
    let xpByHeroId;
    let contributions;
    if (log != null) {
      const plan = planBattleXpDistribution(heroes, totalXP, log, { minShareRatio, weights });
      xpByHeroId = plan.xpByHeroId;
      contributions = plan.contributions;
    } else {
      const per = distributeXP(totalXP, heroes.length);
      xpByHeroId = Object.fromEntries(heroes.map((h) => [h.id, per]));
      contributions = {};
    }
    const applyOpts = { baseXp, exponent, ...rest };
    const results = heroes.map((h) => applyXP(h, xpByHeroId[h.id] ?? 0, applyOpts));
    const xpPerHero = heroes.length ? Math.floor(totalXP / heroes.length) : 0;
    return { xpPerHero, xpByHeroId, contributions, results };
  }

  // frontend/src/game/combatLogDefeat.js
  function shouldEmitUnitDefeated(entry) {
    if (entry == null || entry.type === "unitDefeated" || entry.type === "manaRegenBatch") return false;
    const targetHpAfter = entry.type === "dot" ? entry.targetHPAfter : entry.targetHPAfter;
    return targetHpAfter != null && targetHpAfter <= 0 && !!entry.targetId && !!entry.targetName;
  }

  // frontend/src/game/combatPacing.js
  var import_meta = {};
  var DEFAULT_COMBAT_LOG_STEP_DELAY_MS = 3e3;
  var COMBAT_PACING_MS = {
    /** Poll interval when squad is empty (waiting for recruitment). */
    emptySquadPoll: 1e3,
    /** Separator log line before next map / battle. */
    betweenBattleSeparator: 300,
    /** After map entry log with description (read time). */
    mapDescriptionRead: 1800,
    /** After encounter message before battle resolution. */
    afterEncounterMessage: 1e3,
    /** After defeat summary before rest phase starts. */
    defeatBeforeRest: 2e3,
    /** After a battle ends before the next loop iteration. */
    postBattleGap: 500,
    /** After victory summary before the first level-up log line (read time + SFX gap). */
    afterVictoryBeforeLevelUp: 1400,
    /** Between consecutive level-up log reveals when multiple heroes level. */
    betweenLevelUpReveals: 700
  };
  var REGEN_HERO_STAGGER_MS = 200;
  var REGEN_BAR_SETTLE_MS = 280;
  var LS_KEY = "textIdleCombatLogStepDelayMs";
  var VITE_KEY = "VITE_COMBAT_LOG_STEP_DELAY_MS";
  function parseNonNegativeInt(raw) {
    if (raw == null || raw === "") return null;
    const n = Number.parseInt(String(raw).trim(), 10);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }
  function getCombatLogStepDelayMs() {
    try {
      if (typeof localStorage !== "undefined") {
        const fromLs = parseNonNegativeInt(localStorage.getItem(LS_KEY));
        if (fromLs != null) return fromLs;
      }
    } catch {
    }
    try {
      const envVal = typeof import_meta !== "undefined" && import_meta.env && import_meta.env[VITE_KEY] != null ? import_meta.env[VITE_KEY] : null;
      const fromEnv = parseNonNegativeInt(envVal);
      if (fromEnv != null) return fromEnv;
    } catch {
    }
    return DEFAULT_COMBAT_LOG_STEP_DELAY_MS;
  }
  function estimateRegenBatchRevealMs(entry) {
    if (entry?.type !== "manaRegenBatch" && entry?.type !== "hpRegenBatch") return 0;
    const updates = Array.isArray(entry.updates) ? entry.updates : [];
    let floatIdx = 0;
    let ms = 0;
    const isMana = entry.type === "manaRegenBatch";
    for (const u of updates) {
      const gained = isMana ? u.manaGained : u.hpGained;
      if (!u?.actorId || (gained ?? 0) <= 0) continue;
      if (floatIdx > 0) ms += REGEN_HERO_STAGGER_MS;
      floatIdx += 1;
      ms += REGEN_BAR_SETTLE_MS;
    }
    return ms;
  }
  function estimateVisibleBattleCycleMs(result, options = {}) {
    const stepMs = getCombatLogStepDelayMs();
    const restSteps = Math.max(0, Math.floor(Number(options.restSteps) || 0));
    const levelUpCount = Math.max(0, Math.floor(Number(options.levelUpCount) || 0));
    const outcome = options.outcome ?? "victory";
    let ms = COMBAT_PACING_MS.afterEncounterMessage;
    if (options.hadBetweenBattleSeparator) ms += COMBAT_PACING_MS.betweenBattleSeparator;
    if (options.hadMapDescription) ms += COMBAT_PACING_MS.mapDescriptionRead;
    const log = Array.isArray(result?.log) ? result.log : [];
    for (let i = 0; i < log.length; i += 1) {
      const entry = log[i];
      if (entry?.type === "roundMaintenance") {
        const nextEntry2 = log[i + 1];
        if (!nextEntry2 || nextEntry2.round !== entry.round) {
          ms += stepMs;
        }
        continue;
      }
      ms += stepMs;
      if (entry?.type === "manaRegenBatch" || entry?.type === "hpRegenBatch") {
        ms += estimateRegenBatchRevealMs(entry);
      }
      if (shouldEmitUnitDefeated(entry)) ms += stepMs;
      const nextEntry = log[i + 1];
      if (!nextEntry || nextEntry.round !== entry.round) {
        if (nextEntry?.type !== "roundMaintenance") ms += stepMs;
      }
    }
    if (levelUpCount > 0) {
      ms += COMBAT_PACING_MS.afterVictoryBeforeLevelUp;
      ms += Math.max(0, levelUpCount - 1) * COMBAT_PACING_MS.betweenLevelUpReveals;
    }
    if (outcome !== "victory") ms += COMBAT_PACING_MS.defeatBeforeRest;
    ms += restSteps * stepMs;
    ms += COMBAT_PACING_MS.postBattleGap;
    return ms;
  }

  // frontend/src/game/inventory.js
  var INVENTORY_MAX = 100;

  // frontend/src/game/serverCombatCycle.js
  function getSquadMaxLevel(squad) {
    if (!Array.isArray(squad) || squad.length === 0) return 1;
    return Math.max(...squad.map((h) => Math.max(1, h.level ?? 1)));
  }
  function getSquadAverageLevel(squad) {
    if (!Array.isArray(squad) || squad.length === 0) return 1;
    const sum = squad.reduce((acc, h) => acc + Math.max(1, h.level ?? 1), 0);
    return sum / squad.length;
  }
  function createSeededRng(seed) {
    let s = seed >>> 0;
    return () => {
      s = s * 1664525 + 1013904223 >>> 0;
      return s / 4294967296;
    };
  }
  function addToInventoryOnSave(save, item) {
    if (!Array.isArray(save.inventory)) save.inventory = [];
    if (save.inventory.length >= INVENTORY_MAX) return false;
    save.inventory.push(item);
    return true;
  }
  function runRestPhase(heroesAfter) {
    const deathCount = heroesAfter.filter((h) => (h.currentHP ?? 0) <= 0).length;
    let rest = startRestPhase(heroesAfter, { deathCount, base: 4, spiritScale: 1 });
    let steps = 0;
    while (!rest.isComplete) {
      rest = applyRestStep(rest);
      steps += 1;
    }
    return { heroes: rest.heroes, restSteps: steps };
  }
  function mergeCombatStateIntoSquad(originalSquad, restedCombatHeroes) {
    if (!Array.isArray(originalSquad) || originalSquad.length === 0) {
      return Array.isArray(restedCombatHeroes) ? restedCombatHeroes : [];
    }
    const byId = new Map((restedCombatHeroes || []).map((h) => [h.id, h]));
    return originalSquad.map((orig) => {
      const combat = byId.get(orig.id);
      if (!combat) return orig;
      const merged = { ...orig };
      if (combat.currentHP != null) merged.currentHP = combat.currentHP;
      if (combat.currentMP != null) merged.currentMP = combat.currentMP;
      if (combat.level != null) merged.level = combat.level;
      if (combat.xp != null) merged.xp = combat.xp;
      if (combat.unassignedPoints != null) merged.unassignedPoints = combat.unassignedPoints;
      if (combat.skillEnhancements != null) merged.skillEnhancements = combat.skillEnhancements;
      if (combat.skillMilestonesResolved != null) {
        merged.skillMilestonesResolved = combat.skillMilestonesResolved;
      }
      return merged;
    });
  }
  function runServerCombatCycle(save, opts = {}) {
    const out = JSON.parse(JSON.stringify(save));
    const squad = out.squad;
    if (!Array.isArray(squad) || squad.length === 0) {
      return {
        save: out,
        skipped: true,
        reason: "empty_squad",
        nextCycleDelayMs: 0,
        events: []
      };
    }
    const preCombatSquad = JSON.parse(JSON.stringify(squad));
    const rngSeed = Number(opts.rngSeed) || 1;
    const tickNowMs = Number(opts.nowMs) || Date.now();
    const rng = createSeededRng(rngSeed);
    const progress = out.combatProgress || {};
    const squadLevel = getSquadMaxLevel(squad);
    const squadAverageLevel = getSquadAverageLevel(squad);
    const squadMinLevel = getSquadMinLevel(squad);
    const monsters = buildEncounterMonsters({
      mapId: progress.currentMapId,
      squadSize: squad.length,
      level: squadLevel,
      squadAverageLevel,
      squadMinLevel,
      explorationProgress: progress.currentProgress,
      forceBoss: progress.bossAvailable,
      rng
    });
    const result = runAutoCombat({ heroes: squad, monsters, rng });
    const { damageByHeroDelta, injuryByHeroDelta } = battleStatsToDeltas(result.battleStats);
    let levelUpCount = 0;
    let restStepsThisBattle = 0;
    const events = [];
    let pendingExpansionRecruit = out.pendingExpansionRecruit ?? null;
    if (result.outcome === "victory") {
      const prevUnlockedMapCount = progress.unlockedMapCount ?? 1;
      for (const eq of result.rewards.equipment || []) {
        addToInventoryOnSave(out, eq);
      }
      const victoryExploration = settleVictoryExploration(progress, monsters, {
        referenceLevel: squadLevel
      });
      out.combatProgress = victoryExploration.progress;
      out.gold = Math.max(0, Math.floor(Number(out.gold) || 0)) + Math.max(0, result.rewards.gold || 0);
      const heroesAfterVictory = result.heroesAfter;
      const xpResults = applyXPToHeroes(heroesAfterVictory, result.rewards.exp, { log: result.log });
      for (const r of xpResults.results || []) {
        if (r?.leveledUp && r.levelsGained > 0) levelUpCount += 1;
      }
      if (shouldPromptExpansionRecruitAfterBoss({
        prevUnlockedMapCount,
        progress: out.combatProgress,
        squadLength: heroesAfterVictory.length,
        explorationSettlement: victoryExploration.exploration
      })) {
        pendingExpansionRecruit = {
          mapId: out.combatProgress.currentMapId,
          level: getExpansionHeroLevel(out.combatProgress, heroesAfterVictory),
          druidOnly: isDruidOnlyExpansionSlot(out.combatProgress, heroesAfterVictory.length)
        };
        out.pendingExpansionRecruit = pendingExpansionRecruit;
        events.push({
          type: "combat.pending_expansion",
          payload: pendingExpansionRecruit
        });
      }
      out.playerStats = applyBattleToPlayerStats(out.playerStats || {}, {
        combatActionSteps: result.combatActionSteps ?? 0,
        goldGained: result.rewards.gold,
        xpGained: result.rewards.exp,
        outcome: "victory",
        damageByHeroDelta,
        injuryByHeroDelta,
        endedAtMs: tickNowMs
      });
      out.leaderboardTrack = applyBattleToLeaderboardTrack(
        normalizeLeaderboardTrack(out.leaderboardTrack),
        {
          combatActionSteps: result.combatActionSteps ?? 0,
          goldGained: result.rewards.gold,
          xpGained: result.rewards.exp
        }
      );
      const rest = runRestPhase(heroesAfterVictory);
      out.squad = mergeCombatStateIntoSquad(preCombatSquad, rest.heroes);
      restStepsThisBattle = rest.restSteps;
      out.playerStats = applyRestToPlayerStats(out.playerStats, restStepsThisBattle);
      out.leaderboardTrack = applyRestToLeaderboardTrack(out.leaderboardTrack, restStepsThisBattle);
    } else {
      const defeatExploration = settleDefeatExploration(progress);
      out.combatProgress = defeatExploration.progress;
      out.playerStats = applyBattleToPlayerStats(out.playerStats || {}, {
        combatActionSteps: result.combatActionSteps ?? 0,
        goldGained: 0,
        xpGained: 0,
        outcome: result.outcome === "draw" ? "draw" : "defeat",
        damageByHeroDelta,
        injuryByHeroDelta,
        endedAtMs: tickNowMs
      });
      out.leaderboardTrack = applyBattleToLeaderboardTrack(
        normalizeLeaderboardTrack(out.leaderboardTrack),
        {
          combatActionSteps: result.combatActionSteps ?? 0,
          goldGained: 0,
          xpGained: 0
        }
      );
      const rest = runRestPhase(result.heroesAfter);
      out.squad = mergeCombatStateIntoSquad(preCombatSquad, rest.heroes);
      restStepsThisBattle = rest.restSteps;
      out.playerStats = applyRestToPlayerStats(out.playerStats, restStepsThisBattle);
      out.leaderboardTrack = applyRestToLeaderboardTrack(out.leaderboardTrack, restStepsThisBattle);
    }
    const nextCycleDelayMs = estimateVisibleBattleCycleMs(result, {
      restSteps: restStepsThisBattle,
      levelUpCount,
      outcome: result.outcome
    });
    events.push({
      type: "combat.cycle_complete",
      payload: {
        outcome: result.outcome,
        rounds: result.rounds,
        goldGained: result.outcome === "victory" ? result.rewards.gold : 0,
        xpGained: result.outcome === "victory" ? result.rewards.exp : 0,
        equipmentDropped: result.outcome === "victory" ? result.rewards.equipment || [] : [],
        restSteps: restStepsThisBattle,
        combatActionSteps: result.combatActionSteps ?? 0
      }
    });
    return {
      save: out,
      skipped: false,
      outcome: result.outcome,
      nextCycleDelayMs,
      events,
      log: result.log,
      encounter: result.encounter,
      steps: result.steps,
      nextRngSeed: rngSeed + 1 + (result.combatActionSteps ?? 0)
    };
  }
  function runServerCombatCycleFromJSON(inputStr) {
    const input = JSON.parse(inputStr);
    const result = runServerCombatCycle(input.save, { rngSeed: input.rngSeed, nowMs: input.nowMs });
    return JSON.stringify(result);
  }
  if (typeof globalThis !== "undefined") {
    globalThis.runServerCombatCycleFromJSON = runServerCombatCycleFromJSON;
  }
  return __toCommonJS(serverCombatCycle_exports);
})();
