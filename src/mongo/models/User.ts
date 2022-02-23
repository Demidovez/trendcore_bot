import { Schema, Types } from "mongoose";
const ObjectId = Schema.Types.ObjectId;

interface User {
  id: Types.ObjectId;
  user_id: number;
  name: string;
  username: string;
  scene: string;
  blockedCoins: string[];
}

export const UserSchema = new Schema<User>({
  id: ObjectId,
  user_id: { type: Number, unique: true, required: true },
  name: String,
  username: String,
  scene: { type: String, default: "" },
  blockedCoins: { type: [String], default: [] },
});
