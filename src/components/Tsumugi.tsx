import React from 'react';
import { useFrontState } from '../hooks/useFrontState';
import { FRONT_STATE } from '../types';

import idealImage from '../../static/assets/ideal.png';
import processingImage from '../../static/assets/processing.png';
import successImage from '../../static/assets/success.png';

export default function Tsumugi(): JSX.Element {
  const [state] = useFrontState();
  const className =
    'filter drop-shadow-ideal transform scale-90 -translate-y-8';

  console.log('Tsumugi', state);
  
  if (state === FRONT_STATE.FINISHED) {
    // FINISH WITH SUCCESS
    return <img src={successImage} className={className} alt="Success" />;
  } else if (state === FRONT_STATE.PROCESSING) {
    // PROCESSING
    return <img src={processingImage} className={className} alt="Processing" />;
  } else {
    // IDLE
    return <img src={idealImage} className={className} alt="Idle" />;
  }
} 