import { useCallback, useState } from 'react';

export function useToggle(initial: boolean = false) {
  const [value, setValue] = useState<boolean>(initial);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse, setValue } as const;
}

export default useToggle;


