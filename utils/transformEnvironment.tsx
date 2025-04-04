export const transformEnvironment = (environment: string) => {
  return process.env.NODE_ENV === "development" ? "development" : environment;
};
