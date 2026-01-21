require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                isAdmin: true,
                isGuest: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (users.length === 0) {
            console.log("No users found in the database.");
        } else {
            console.log(`\nFound ${users.length} users:\n`);
            console.table(users);
        }

    } catch (e) {
        console.error('Error fetching users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
