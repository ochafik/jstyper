function f(x: number) {
  return x ? 1 : 2;
}

export type Options = {
  format: boolean,
  updateImports: boolean,
  updateExports: boolean,
  updateVars: boolean,
  maxIterations: number,
  currentWorkingDir: string,
  methodThresholdAfterWhichAssumeString: number,
};

export const defaultOptions: Readonly<Options> = {
  format: true,
  updateImports: true,
  updateExports: true,
  updateVars: true,
  maxIterations: 5,
  currentWorkingDir: '.',
  methodThresholdAfterWhichAssumeString: 1,
};