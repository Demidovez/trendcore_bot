export const MyScenes = {
  QUIT: "",
  BLACKLIST: "BLACKLIST",
};

export interface IData {
  coins: ICoin[];
}

export interface ICoin {
  coinName: string;
  dollarsValue: number;
  price: number;
  level: number;
  levelPrev: number;
  isPlus: boolean;
  isRepeated: boolean;
  timestampOff: number;
  isShowed: boolean;
  isActive: boolean;
}
