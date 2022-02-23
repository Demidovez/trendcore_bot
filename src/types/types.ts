export const MyScenes = {
  QUIT: "",
  BLACKLIST: "BLACKLIST",
};

export interface ICoin {
  coinName: string;
  dollarsValue: number;
  price: number;
  level: number;
  isPlus: boolean;
  isRepeated: boolean;
}
