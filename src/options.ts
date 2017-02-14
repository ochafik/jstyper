export type Options = {
  format: boolean,
  differentiateComputedProperties: boolean,
  updateImports: boolean,
  updateExports: boolean,
  declarations: boolean,
  updateVars: boolean,
  maxIterations: number,
  debugPasses: boolean,
  // maxSubInferenceCount: number,
  currentWorkingDir: string,
  methodThresholdAfterWhichAssumeString: number,
  dependenciesFileName: string,
};

export const defaultOptions: Readonly<Options> = Object.freeze({
  format: true,
  differentiateComputedProperties: false,
  updateImports: true,
  updateExports: true,
  declarations: false,
  updateVars: false, // Not ready!
  maxIterations: 5,
  debugPasses: false,
  // maxSubInferenceCount: 5,
  currentWorkingDir: '.',
  methodThresholdAfterWhichAssumeString: 1,
  dependenciesFileName: 'dependencies.d.ts',
});