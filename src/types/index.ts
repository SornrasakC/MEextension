// Reader types
export enum READERS {
  NICO_DOUGA = 'Nico-douga',
  NICO_MANGA = 'Nico-manga',
  COMIC_WALKER = 'Comic-walker',
  SPEED_BINB = 'Speed-binb-reader',
  COMIC_PIXIV = 'Comic-pixiv',
  KINDLE = 'Kindle',
  COMICBUSHI = 'Comicbushi (CORS blocked)',
  TAKECOMIC = 'Takecomic (Comici)',
}

export enum PROGRESS_STATUS {
  IDLE = 'IDLE',
  READING = 'READING',
  FINALIZING = 'FINALIZING',
  FINISHED = 'FINISHED',
}

export enum FRONT_STATE {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR',
}

// Component props
export interface ReaderOption {
  key: READERS;
  value: READERS;
}

export interface ReaderSelectorProps {
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  value: READERS;
  options: ReaderOption[];
}

export interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
}

export interface TitleProps {
  children: React.ReactNode;
}

// State types
export interface MetaState {
  chapter: number;
  title: string;
  filenamePrefix: string;
}

export interface PageRangesState {
  startPage: number;
  endPage: number;
}

export interface FrontState {
  status: FRONT_STATE;
}

export interface FrontStateActions {
  toIdle: () => void;
  toProcessing: () => void;
  toFinish: () => void;
  toError?: () => void;
}

// Chrome extension types
export interface StorageData {
  reader?: READERS;
  zipName?: string;
  pageName?: string;
}

export interface ProgressMessage {
  status: PROGRESS_STATUS;
  progress?: number;
  message?: string;
}

// Utility types
export type UnpackReducerAction<T> = Partial<T>;

export interface ChromeMessage {
  type: string;
  data?: any;
} 