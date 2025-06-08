// Reader types
export enum READERS {
  NICO_DOUGA = 'NICO_DOUGA',
  COMIC_WALKER = 'COMIC_WALKER',
  SPEED_BINB = 'SPEED_BINB',
  COMIC_PIXIV = 'COMIC_PIXIV',
  KINDLE = 'KINDLE',
  COMICBUSHI = 'COMICBUSHI',
}

export enum PROGRESS_STATUS {
  IDLE = 'IDLE',
  READING = 'READING',
  FINALIZING = 'FINALIZING',
  FINISHED = 'FINISHED',
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
  status: PROGRESS_STATUS;
}

export interface FrontStateActions {
  toIdle: () => void;
  toProcessing: () => void;
  toFinish: () => void;
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