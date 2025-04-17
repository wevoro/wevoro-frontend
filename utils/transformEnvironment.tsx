export const transformEnvironment = (environment: string) => {
  const devOrQa =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_NODE_ENV === "qa";
  return devOrQa ? "development" : environment;
};
