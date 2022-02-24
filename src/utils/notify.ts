import { Markup, Scenes, Telegraf } from "telegraf";
import {
  getActiveUsersIds,
  getAllUsersIds,
  getBlockedCoins,
} from "../mongo/utils/db_utils";
import { ICoin } from "../types/types";
import { User as UserTelegram } from "telegraf/typings/core/types/typegram";

export const sendNotify = async (
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>,
  coin: ICoin,
  isRepeated = false
) => {
  const users = await getActiveUsersIds();

  users.map((user_id) => {
    bot.telegram
      .getChat(user_id)
      .then(async (user) => {
        const { coinName, dollarsValue, price, level } = coin;

        let plotnost = "";
        let sticker = "";

        if (dollarsValue >= 3000000) {
          plotnost = "Огромная плотность";
          sticker = "🔴";
        } else if (dollarsValue >= 1000000) {
          plotnost = "Большая плотность";
          sticker = "🟣";
        } else if (dollarsValue >= 500000) {
          plotnost = "Средняя плотность";
          sticker = "🟡";
        } else {
          plotnost = "Плотность неизвестна";
          sticker = "❓";
        }

        const blockedCoins = await getBlockedCoins(user.id);

        if (!blockedCoins.includes(coinName.toLowerCase())) {
          bot.telegram.sendMessage(
            user.id,
            `${sticker} ${coinName}\n${plotnost}\nЦена: ${price}\nДо уровня:${
              isRepeated ? " ⬇️" : ""
            } ${level}%`
          );
        }
      })
      .catch((err) => console.log(err.response.description));
  });
};

export const sendErrorNotify = async (
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>,
  error: string
) => {
  const users = await getAllUsersIds();

  users.map((user_id) => {
    bot.telegram
      .getChat(user_id)
      .then((user) => {
        bot.telegram.sendMessage(user.id, `Ошибка: ${error}`);
      })
      .catch((err) => console.log(err.response.description));
  });
};

export const sendRestartNotify = async (
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>,
  coins: ICoin[]
) => {
  const users = await getAllUsersIds();

  users.map((user_id) => {
    bot.telegram
      .getChat(user_id)
      .then((user) => {
        let resultTablo = "Перезапуск бота!\nТекущие данные:\n";

        if (coins.length > 0) {
          coins.map((coin) => {
            const { coinName, dollarsValue, price, level } = coin;

            let plotnost = "";
            let sticker = "";

            if (dollarsValue >= 3000000) {
              plotnost = "Огромная плотность";
              sticker = "🔴";
            } else if (dollarsValue >= 1000000) {
              plotnost = "Большая плотность";
              sticker = "🟣";
            } else if (dollarsValue >= 500000) {
              plotnost = "Средняя плотность";
              sticker = "🟡";
            } else {
              plotnost = "Плотность неизвестна";
              sticker = "❓";
            }

            resultTablo += `\n\n${sticker} ${coinName}\n${plotnost}\nЦена: ${price}\nДо уровня: ${level}%`;
          });
        } else {
          resultTablo += `\n\nМонет нет :(`;
        }

        bot.telegram.sendMessage(user.id, resultTablo);
      })
      .catch((err) => console.log(err));
  });
};
