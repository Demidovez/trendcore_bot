import { Telegraf, Scenes, Markup } from "telegraf";
import { blacklistScene } from "./scenes/blacklist_scene";
import { ICoin, MyScenes } from "./types/types";
import LocalSession from "telegraf-session-local";
import mongoose from "mongoose";
import { getAllUsersIds, saveUserToDB } from "./mongo/utils/db_utils";
import { requestAddUser, sendMessageToAdmin } from "./utils";
import { getCoinsWithNotify, getCurrentCoins } from "./utils/get_data";
import { sendRestartNotify } from "./utils/notify";

// Подключение к БД
mongoose.connect(process.env.MONGO_URL as string);

// Инициализируем бота
const bot = new Telegraf<Scenes.SceneContext>(process.env.BOT_TOKEN as string);
const localSession = new LocalSession({
  database: process.env.SESSION_DB as string,
});

bot.use((ctx, next) => {
  getAllUsersIds().then((ids) => {
    const hasUser = ids.some((id) => id == ctx.from!.id);

    if (hasUser) {
      next();
    } else {
      ctx.reply(`У Вас нету доступа :(`, Markup.removeKeyboard());
      requestAddUser(bot, ctx.from!);
    }
  });
});

bot.use(localSession.middleware());

// Создаем сцены
const stage = new Scenes.Stage<Scenes.SceneContext>([blacklistScene()]);

// Подключаем сцены к боту
bot.use(stage.middleware());

// Достаем данные по монетам с периодичностью и делаем рассылку всем активным пользователям
let intervalId: ReturnType<typeof setInterval>;
let currentCoins: ICoin[] = [];

getCurrentCoins(bot).then((coins) => {
  currentCoins = coins;
  // Уведомляем о перезапуске и показываем текущие данные
  sendRestartNotify(bot, coins);

  // Повторяем сбор каждые мс
  intervalId = setInterval(async () => {
    currentCoins = await getCoinsWithNotify(bot, currentCoins);
  }, 10000);
});

bot.action(/addUser \|(.+)\| \|(.+)\| \|(.+)\|/, async (ctx) => {
  try {
    const id = ctx.match[1];
    const username = ctx.match[2];
    const fio = ctx.match[3];

    const lineToFile = `${id}|${username}|${fio}\n`;

    const ids = await getAllUsersIds();

    if (ids.some((idInArray) => idInArray.toString() == id)) {
      ctx.reply(`Доступ уже предоставлен раньше!!!`);
    } else {
      saveUserToDB({
        id: parseInt(id),
        is_bot: false,
        first_name: fio,
        username,
      }).then((result) => ctx.reply(result));

      sendMessageToAdmin(
        bot,
        `Доступ предоставлен: ${ctx.match[3]}, ${
          ctx.match[2] == "-" ? "-" : "@" + ctx.match[2]
        }, ${ctx.match[1]}`
      );

      bot.telegram.sendMessage(id, "Доступ предоставлен.\nОжидайте данные!");
    }

    ctx.deleteMessage();
  } catch (err) {
    console.log(err);
  }
});

// Точка входа в сцену "Черный список"
bot.command("blacklist", async (ctx) => {
  ctx.scene.enter(MyScenes.BLACKLIST);
});

// bot.hears("add", (ctx) => {
//   saveUserToDB(ctx.message.from).then((result) => ctx.reply(result));
// });

// Слушаем остановку сбора данных (временно)
bot.hears("stop", (ctx) => {
  clearInterval(intervalId);
  ctx.reply(`Не слушаем`);
});

// Проверка пользователем на работоспособность
bot.on("text", (ctx) => {
  ctx.reply(`Работает`);
});

bot.launch();
console.log("Started bot " + new Date());
