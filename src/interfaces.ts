
import { ReactNode } from 'react';

export type Elt = ReactNode;
export type Elts = Elt | Elt[];
export interface Children {
  children?: Elts;
}

export interface Cls {
  className?: string;
}
