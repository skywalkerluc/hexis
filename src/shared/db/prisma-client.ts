import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var hexisPrismaClient: PrismaClient | undefined;
}

export const prismaClient =
  globalThis.hexisPrismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.hexisPrismaClient = prismaClient;
}
