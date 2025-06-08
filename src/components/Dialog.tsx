import React from 'react';
import { useFrontState } from '../hooks/useFrontState';
import { FRONT_STATE } from '../types';

export default function Dialog(): JSX.Element {
  const [state] = useFrontState();
  const className =
    'max-h-48 vertical-rl p-1 bg-white bg-opacity-50 rounded-md border-2 border-tsumugi border-opacity-60';

  if (state === FRONT_STATE.IDLE) {
    return (
      <p className={className}>
        むきゅ～ <br />
        いらっしゃいませ！。
      </p>
    );
  } else if (state === FRONT_STATE.PROCESSING) {
    return <p className={className}>少々お待ちくださいませ。</p>;
  } else {
    return (
      <p className={className}>
        終了しました
        <br />
        また会おうね
        <br />
        むぎゅううー。
      </p>
    );
  }
} 