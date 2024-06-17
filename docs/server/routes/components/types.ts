export type ComponentDropdownType<V> =
  | (SelectTypeProps<V> & DisableSelectTypeProps)
  | SelectTypeProps<V>;

type SelectTypeProps<V> = {
  description: string;
  options: V[];
  value: V;
};

type DisableSelectTypeProps = {
  disabled: boolean;
  disabledLabel: string; //when the component is disabled we explain why here
};

export type ComponentDropdownMapType<T> = {
  [K in keyof T]: ComponentDropdownType<T[K]>;
};
