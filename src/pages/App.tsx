import React, { useEffect, useState, useReducer } from 'react';
import {
  executeSpeedBinbReaderScript,
  executeNicoDougaScript,
  executeComicWalkerScript,
  executeComicPixivScript,
  executeKindleScript,
  executeComicbushiScript,
} from '../services/handlers';
import { unpackReducer } from '../utils/reducers';
import { storageSet } from '../utils/chrome/storage';
import { setListener } from '../utils/chrome/access';

import bgImage from '../../static/assets/bg.png';
import ReaderSelector from '../components/ReaderSelector';
import Label from '../components/Label';
import Tsumugi from '../components/Tsumugi';
import Input from '../components/Input';
import Title from '../components/Title';
import Dialog from '../components/Dialog';

import {
  READERS,
  PROGRESS_STATUS,
  type ReaderOption,
  type MetaState,
  type PageRangesState,
  type ProgressMessage,
} from '../types';
import { useFrontState } from '../hooks/useFrontState';

async function _kaishi(
  reader: READERS,
  zipName: string,
  pageName: string
): Promise<void> {
  return storageSet({ reader, zipName, pageName });
}

const readerOptions: ReaderOption[] = [
  { key: READERS.NICO_DOUGA, value: READERS.NICO_DOUGA },
  { key: READERS.COMIC_WALKER, value: READERS.COMIC_WALKER },
  { key: READERS.SPEED_BINB, value: READERS.SPEED_BINB },
  { key: READERS.COMIC_PIXIV, value: READERS.COMIC_PIXIV },
  { key: READERS.KINDLE, value: READERS.KINDLE },
  { key: READERS.COMICBUSHI, value: READERS.COMICBUSHI },
];

export default function App(): JSX.Element {
  const [_, action] = useFrontState();
  const [reader, setReader] = useState<READERS>(readerOptions[0].key);

  const [meta, _setMeta] = useReducer(unpackReducer<MetaState>, {
    chapter: 0,
    title: 'KoibitoMuriMuri',
    filenamePrefix: 'KoibitoMuriMuri Ch.0',
  });

  const [_pageRanges, _setPageRanges] = useReducer(unpackReducer<PageRangesState>, {
    startPage: 0,
    endPage: 60,
  });

  useEffect(() => {
    setListener((msg: ProgressMessage) => {
      const { status } = msg;
      if (
        status === PROGRESS_STATUS.READING ||
        status === PROGRESS_STATUS.FINALIZING
      ) {
        action.toProcessing();
      } else if (status === PROGRESS_STATUS.FINISHED) {
        action.toFinish();
      } else {
        action.toIdle();
      }
    });
  }, [action]);

  useEffect(() => {
    // TODO: Uncomment this line in production mode
    // setMeta({ filenamePrefix: `${meta.title} Ch.${meta.chapter}` });
  }, [meta.chapter, meta.title]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Handle submit form
    switch (reader) {
      case READERS.NICO_DOUGA:
        executeNicoDougaScript();
        break;
      case READERS.SPEED_BINB:
        executeSpeedBinbReaderScript();
        break;
      case READERS.COMIC_WALKER:
        executeComicWalkerScript();
        break;
      case READERS.COMIC_PIXIV:
        executeComicPixivScript();
        break;
      case READERS.KINDLE:
        executeKindleScript();
        break;
      case READERS.COMICBUSHI:
        executeComicbushiScript();
        break;
      default:
        return;
    }
  };

  const handleReaderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReader(e.target.value as READERS);
  };

  return (
    <div
      className="relative overflow-hidden h-full"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: '90% 40%',
      }}
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{ height: '650px' }}
          className="relative backdrop-filter backdrop-blur-md backdrop-brightness-80 flex flex-col p-4"
        >
          <section>
            <Title>Mugyu Extractor</Title>
            <div
              id="reader-select"
              className="relative grid grid-cols-2 grid-rows-2 gap-2"
            >
              <div className="row-start-1 row-end-2 col-start-1 col-end-3 flex flex-col">
                <Label htmlFor="reader">リーダー</Label>
                <ReaderSelector
                  onChange={handleReaderChange}
                  value={reader}
                  options={readerOptions}
                />
              </div>
              <div className="row-start-2 row-end-3 col-start-1 col-end-2 flex flex-col">
                <Label htmlFor="zip-name">シップ 名</Label>
                <Input
                  name="zip-name"
                  type="text"
                  placeholder="{Title}-{Chapter}"
                  className="px-1 rounded-sm focus:outline-none"
                />
              </div>
              <div className="row-start-2 row-end-3 col-start-2 col-end-3 flex flex-col">
                <Label htmlFor="page-name">ページ 名</Label>
                <Input
                  name="page-name"
                  type="text"
                  placeholder="{Chapter}-{PageNum}"
                  className="px-1 rounded-sm focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="min-h-full">
            <div className="absolute right-20 -left-20 top-1/3">
              <Tsumugi />
            </div>
            <div className="absolute right-5 top-1/3 m-3">
              <Dialog />
            </div>
            <div className="absolute left-3/4 top-2/3">
              <button
                type="submit"
                className="border-2 border-pink-300 rounded-md px-4 py-8 bg-gradient-to-br from-blue-400 to-green-300 text-white shadow-md transform -translate-x-1 -translate-y-1"
              >
                開
                <br />
                始
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
} 