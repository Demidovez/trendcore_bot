import { HTMLElement, parse } from "node-html-parser";
import axios from "axios";
import { sendErrorNotify, sendNotify } from "./notify";
import { Scenes, Telegraf } from "telegraf";
import { ICoin, IData } from "../types/types";

export const getCoinsWithNotify = async (
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>,
  coinsData: IData
): Promise<any> => {
  coinsData.coins = await axios("https://trendcore.io/level/indexsee.php")
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
            const coinName = child.childNodes[1].childNodes[0].rawText.trim();

            const dollars =
              child.childNodes[2].childNodes[0].rawText.split(" ")[0];
            const dollarsSymbol = dollars.replace(/[^a-zA-Z]+/g, "");
            const dollarsValue =
              dollarsSymbol == "K"
                ? parseFloat(dollars) * 1000
                : dollarsSymbol == "M"
                ? parseFloat(dollars) * 1000000
                : parseFloat(dollars);

            if (dollarsValue < 1000000) return;

            const price = parseFloat(
              child.childNodes[4].childNodes[0].rawText.trim()
            );
            const level = parseFloat(
              child.childNodes[6].childNodes[0].rawText.trim()
            );
            const isPlus = level >= 0;

            if (Math.abs(level) > 0.5) return;

            responseCoins = [
              ...responseCoins,
              {
                coinName,
                dollarsValue,
                price,
                level,
                levelPrev: 0,
                isPlus,
                isRepeated: false,
                timestampOff: 0,
                isShowed: false,
                isActive: true,
              },
            ];
          }
        });

        // console.log(coinsData.coins);

        const newCoinsList = coinsData.coins.map((currentCoin) => {
          const responseCoin = responseCoins.find(
            (responseCoin) =>
              responseCoin.coinName == currentCoin.coinName &&
              currentCoin.isPlus == responseCoin.isPlus
          );

          if (responseCoin && currentCoin.isActive) {
            return {
              ...responseCoin,
              isShowed: currentCoin.isShowed,
              levelPrev: currentCoin.level,
            };
          } else if (responseCoin && !currentCoin.isActive) {
            return {
              ...responseCoin,
              isActive: Date.now() - currentCoin.timestampOff >= 60000,
              isShowed: Date.now() - currentCoin.timestampOff < 60000,
            };
          } else {
            return {
              ...currentCoin,
              isActive: false,
              timestampOff: currentCoin.timestampOff || Date.now(),
            };
          }
        });

        return [
          ...newCoinsList,
          ...responseCoins.filter(
            (responseCoin) =>
              !newCoinsList.some(
                (newCoin) =>
                  newCoin.coinName == responseCoin.coinName &&
                  newCoin.isPlus == responseCoin.isPlus
              )
          ),
        ].map((coin) => {
          if (coin.isActive && coin.isShowed) {
            if (
              Math.abs(coin.level) < Math.abs(coin.levelPrev) &&
              Math.abs(coin.levelPrev) >= 0.5 &&
              Math.abs(coin.level) <= 0.5 &&
              !coin.isRepeated
            ) {
              sendNotify(bot, coin, true);

              return { ...coin, isRepeated: true };
            } else {
              return coin;
            }
          } else if (coin.isActive && !coin.isShowed) {
            sendNotify(bot, coin);

            return { ...coin, isShowed: true, isRepeated: true };
          } else {
            return coin;
          }
        });
      } catch (e) {
        console.log("ERROR BOT: " + e);

        return coinsData.coins;
      }
    })
    .catch((e) => {
      try {
        sendErrorNotify(bot, e);
      } catch (e) {
        console.log("ERROR BOT: " + e);
      }

      return coinsData.coins;
    });

  return coinsData.coins;
};

export const getCurrentCoins = async (
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>,
  coinsData: IData
): Promise<any> => {
  coinsData.coins = await axios("https://trendcore.io/level/indexsee.php")
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
            const coinName = child.childNodes[1].childNodes[0].rawText.trim();

            const dollars =
              child.childNodes[2].childNodes[0].rawText.split(" ")[0];
            const dollarsSymbol = dollars.replace(/[^a-zA-Z]+/g, "");
            const dollarsValue =
              dollarsSymbol == "K"
                ? parseFloat(dollars) * 1000
                : dollarsSymbol == "M"
                ? parseFloat(dollars) * 1000000
                : parseFloat(dollars);

            if (dollarsValue < 1000000) return;

            const price = parseFloat(
              child.childNodes[4].childNodes[0].rawText.trim()
            );
            const level = parseFloat(
              child.childNodes[6].childNodes[0].rawText.trim()
            );
            const isPlus = level >= 0;

            if (Math.abs(level) > 0.5) return;

            responseCoins = [
              ...responseCoins,
              {
                coinName,
                dollarsValue,
                price,
                level,
                levelPrev: 0,
                isPlus,
                isRepeated: false,
                timestampOff: 0,
                isShowed: false,
                isActive: true,
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

  return null;
};
