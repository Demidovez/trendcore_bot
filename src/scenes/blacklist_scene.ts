import { MyScenes } from "../types/types";

import { Context, Markup, Scenes } from "telegraf";
import {
  getAllUsersIds,
  getBlockedCoins,
  restoreBlockedCoin,
  setBlockCoin,
  setSceneUserToDB,
} from "../mongo/utils/db_utils";
import { getCoinsDirtyList } from "../utils";
const { enter, leave } = Scenes.Stage;

export const blacklistScene = () => {
  const blacklist = new Scenes.BaseScene<Scenes.SceneContext>(
    MyScenes.BLACKLIST
  );

  // blacklist.use((ctx, next) => {
  //   getAllUsersIds().then((ids) => {
  //     ids.some((id) => id == ctx.message!.from.id) && next();
  //   });
  // });

  blacklist.enter(async (ctx) => {
    ctx.reply(
      "Какую монету заблокировать?",
      Markup.keyboard([["Назад", "Список"]]).resize()
    );

    setSceneUserToDB(ctx.message!.from, MyScenes.BLACKLIST);
  });

  blacklist.hears(/назад/i, leave<Scenes.SceneContext>());

  blacklist.hears(/список/i, async (ctx) => {
    const coins = await getBlockedCoins(ctx.message!.from.id);

    if (coins.length > 0) {
      coins.map((coin) =>
        ctx.reply(
          coin.toUpperCase(),
          Markup.inlineKeyboard([
            Markup.button.callback("Восстановить", `restore ${coin}`),
          ])
        )
      );
    } else {
      ctx.reply("Черный список пуст! Какую монету добавить?");
    }
  });

  blacklist.action(/restore (.+)/i, (ctx) => {
    restoreBlockedCoin(ctx.callbackQuery.from, ctx.match[1])
      .then(() => {
        ctx.deleteMessage();
      })
      .catch(() => {
        ctx.reply("Ошибка восстановления!");
      });
  });

  blacklist.on("text", (ctx) => {
    ctx.replyWithChatAction("typing");

    getCoinsDirtyList().then((dirtyList) => {
      const coinName = ctx.message.text.toLowerCase();

      if (dirtyList.includes(coinName + "usdt")) {
        setBlockCoin(ctx.message!.from, coinName)
          .then(() => {
            ctx.reply("Готово! Какую еще?");
          })
          .catch(() => ctx.reply("Монета уже в списке! Какую еще?"));
      } else {
        ctx.reply("Нет такой монеты! Давай еще раз:");
      }
    });
  });

  blacklist.leave((ctx) => {
    ctx.reply("Выход в режим прослушивания", Markup.removeKeyboard());
    setSceneUserToDB(ctx.message!.from, MyScenes.QUIT);
  });

  return blacklist;
};
