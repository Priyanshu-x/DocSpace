require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'verified@test.com'; // Hardcoded for now based on context
        const user = await prisma.user.update({
            where: { email: email },
            data: { isAdmin: true }
        });
        console.log(`User ${email} promoted to admin successfully.`);
        console.log(user);
    } catch (e) {
        console.error('Error promoting user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
