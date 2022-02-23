import { HTMLElement, parse } from "node-html-parser";
import axios from "axios";
import { sendErrorNotify, sendNotify } from "./notify";
import { Scenes, Telegraf } from "telegraf";
import { ICoin } from "../types/types";

export const getCoinsWithNotify = async (
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>,
  currentCoins: ICoin[]
): Promise<ICoin[]> => {
  const coins = await axios("https://trendcore.io/level/indexsee.php")
    .then((data) => {
      try {
        const root = parse(data.data);

        let responseCoins: ICoin[] = [];

        root.querySelector("table")?.childNodes.map((childNode, index) => {
          const child = childNode as HTMLElement;
          if (
            child.rawTagName == "tr" &&
            index > 0 &&
            child.childNodes.length > 5
          ) {
            const coinName = child.childNodes[1].childNodes[0].rawText;

            const dollars =
              child.childNodes[2].childNodes[0].rawText.split(" ")[0];
            const dollarsSymbol = dollars.replace(/[^a-zA-Z]+/g, "");
            const dollarsValue =
              dollarsSymbol == "K"
                ? parseFloat(dollars) * 1000
                : dollarsSymbol == "M"
                ? parseFloat(dollars) * 1000000
                : parseFloat(dollars);

            if (dollarsValue < 500000) return;

            const price = parseFloat(child.childNodes[4].childNodes[0].rawText);
            const level = parseFloat(child.childNodes[6].childNodes[0].rawText);
            const isPlus = level >= 0;

            responseCoins = [
              ...responseCoins,
              {
                coinName,
                dollarsValue,
                price,
                level,
                isPlus,
                isRepeated: false,
              },
            ];
          }
        });

        return (currentCoins = responseCoins.map((responseCoin) => {
          const currentCoin = currentCoins.find(
            (currentCoin) =>
              currentCoin.coinName == responseCoin.coinName &&
              currentCoin.isPlus == responseCoin.isPlus
          );

          if (currentCoin) {
            const deltaLevel = currentCoin.isPlus
              ? currentCoin.level - responseCoin.level
              : responseCoin.level - currentCoin.level;

            if (deltaLevel >= 0.5 && !currentCoin.isRepeated) {
              sendNotify(bot, responseCoin, true);

              return { ...responseCoin, isRepeated: true };
            } else {
              return responseCoin;
            }
          } else {
            sendNotify(bot, responseCoin);

            return responseCoin;
          }
        }));
      } catch (e) {
        console.log("ERROR BOT: " + e);

        return currentCoins;
      }
    })
    .catch((e) => {
      try {
        sendErrorNotify(bot, e);
      } catch (e) {
        console.log("ERROR BOT: " + e);
      }

      return currentCoins;
    });

  return coins;
};

export const getCurrentCoins = async (
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>
): Promise<ICoin[]> => {
  const coins = await axios("https://trendcore.io/level/indexsee.php")
    .then((data) => {
      try {
        const root = parse(data.data);

        let responseCoins: ICoin[] = [];

        root.querySelector("table")?.childNodes.map((childNode, index) => {
          const child = childNode as HTMLElement;
          if (
            child.rawTagName == "tr" &&
            index > 0 &&
            child.childNodes.length > 5
          ) {
            const coinName = child.childNodes[1].childNodes[0].rawText;

            const dollars =
              child.childNodes[2].childNodes[0].rawText.split(" ")[0];
            const dollarsSymbol = dollars.replace(/[^a-zA-Z]+/g, "");
            const dollarsValue =
              dollarsSymbol == "K"
                ? parseFloat(dollars) * 1000
                : dollarsSymbol == "M"
                ? parseFloat(dollars) * 1000000
                : parseFloat(dollars);

            if (dollarsValue < 500000) return;

            const price = parseFloat(child.childNodes[4].childNodes[0].rawText);
            const level = parseFloat(child.childNodes[6].childNodes[0].rawText);
            const isPlus = level >= 0;

            responseCoins = [
              ...responseCoins,
              {
                coinName,
                dollarsValue,
                price,
                level,
                isPlus,
                isRepeated: false,
              },
            ];
          }
        });

        return responseCoins;
      } catch (e) {
        console.log("ERROR BOT: " + e);

        return [];
      }
    })
    .catch((e) => {
      try {
        sendErrorNotify(bot, e);
      } catch (e) {
        console.log("ERROR BOT: " + e);
      }

      return [];
    });

  return coins;
};
