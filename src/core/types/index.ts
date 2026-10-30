export type Scene = 'boot' | 'windows' | 'macos' | 'ending' | 'menu';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WindowBounds {
  position: Position;
  size: Size;
}

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  position: Position;
  size: Size;
  isMinimized: boolean;
  isMaximized: boolean;
  isHidden: boolean;
  isFocused: boolean;
  zIndex: number;
}

export interface OpenWindowInput {
  appId: string;
  title: string;
  position?: Position;
  size?: Size;
}