// PRISMA SETUP: https://www.prisma.io/docs/guides/nextjs 2.6 Set up Prisma Client IN DOCS

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })

const globalForPrisma = global as unknown as {
    prisma: PrismaClient;
}
const prisma = globalForPrisma.prisma || new PrismaClient({adapter});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

// import "dotenv/config";
// import { PrismaPg } from '@prisma/adapter-pg'
// import { PrismaClient } from "./generated/prisma/client";


// const connectionString = `${process.env.DATABASE_URL}`

// const adapter = new PrismaPg({ connectionString })
// const prisma = new PrismaClient({ adapter })

// export { prisma }

