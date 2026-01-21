require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    rl.question('Enter email of user to promote to Admin: ', async (email) => {
        try {
            const user = await prisma.user.update({
                where: { email: email.trim() },
                data: { isAdmin: true }
            });
            console.log(`\n✅ User ${email} is now an Admin!`);
            console.log('ID:', user.id);
            console.log('IsAdmin:', user.isAdmin);
        } catch (e) {
            if (e.code === 'P2025') {
                console.error(`\n❌ User with email "${email}" not found.`);
            } else {
                console.error('\n❌ Error promoting user:', e);
            }
        } finally {
            await prisma.$disconnect();
            rl.close();
        }
    });
}

main();
