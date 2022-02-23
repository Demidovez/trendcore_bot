import axios from "axios";
import { ICoin } from "../types/types";
import { User as UserTelegram } from "telegraf/typings/core/types/typegram";
import { Markup, Scenes, Telegraf } from "telegraf";

export const getCoinsDirtyList = async (): Promise<string> => {
  try {
    const response = await axios.get("https://trendcore.io/level/coins.txt");

    return (response.data as string).toLowerCase();
  } catch (error) {
    console.log(error);
    return "";
  }
};

export const requestAddUser = (
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>,
  fromUser: UserTelegram
) => {
  try {
    process.env.ADMINS_ID!.split(",").map((admin_id) => {
      const { id, username, first_name, last_name } = fromUser;
      const text = `
        Запрос на доступ:
        
        Имя: ${first_name} ${last_name}
        Nik: ${username ? "@" + username : "-"}
        ID: ${id}
            `;
      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback(
          "Добавить",
          `addUser |${id}| |${username || "-"}| |${
            first_name + " " + last_name
          }|`
        ),
      ]);

      bot.telegram
        .getChat(admin_id)
        .then((user) => bot.telegram.sendMessage(user.id, text, keyboard))
        .catch(() => console.log("ERROR ADD USER!"));
    });
  } catch {
    console.log("ERROR ADD USER!");
  }
};

export const sendMessageToAdmin = (
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>,
  message: string
) => {
  try {
    process.env.ADMINS_ID!.split(",").map((admin_id) => {
      bot.telegram
        .getChat(admin_id)
        .then((user) => bot.telegram.sendMessage(user.id, message))
        .catch(() => console.log("ERROR ADD USER!"));
    });
  } catch {
    console.log("ERROR ADD USER!");
  }
};
