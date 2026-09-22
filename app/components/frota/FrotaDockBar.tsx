'use client';

import React from 'react';
import { DockMinimizados, DockMinimizadosProps, MinimizedWindow } from './DockMinimizados';

export type { MinimizedWindow };
export interface FrotaDockBarProps extends DockMinimizadosProps {}

export const FrotaDockBar: React.FC<FrotaDockBarProps> = (props) => {
  return <DockMinimizados {...props} />;
};

export default FrotaDockBar;
