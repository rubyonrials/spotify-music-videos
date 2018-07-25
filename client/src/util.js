export const loadState = () => {
  try {
    const serializedState = localStorage.getItem('smv-state');
    if (serializedState === null) { return undefined; }
    return JSON.parse(serializedState);
  } catch (error) {
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('smv-state', serializedState);
  } catch (error) {
    // Ignore
  }
};
