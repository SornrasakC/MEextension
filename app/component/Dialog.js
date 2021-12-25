import React from "react";
import { useFrontState } from "../context/FrontStateContext";
import { FRONT_STATE } from "../utils/constants";

const DIALOGS = {};

const Dialog = () => {
  const [state] = useFrontState();
  const className =
    "max-h-48 vertical-rl p-1 bg-white bg-opacity-50 rounded-md border-2 border-tsumugi border-opacity-60";
  return state === FRONT_STATE.IDLE ? (
    <p className={className}>
      むきゅ～ <br />
      いらっしゃいませ！。
    </p>
  ) : state === FRONT_STATE.PROCESSING ? (
    <p className={className}>少々お待ちくださいませ。</p>
  ) : (
    <p className={className}>
      終了しました
      <br />
      また会おうね
      <br />
      むぎゅううー。
    </p>
  );
};

export default Dialog;
