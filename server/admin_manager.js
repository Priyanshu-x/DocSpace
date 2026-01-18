
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    try {
        console.log('--- Admin Management Tool ---');
        const email = await question('Enter user email: ');

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error('User not found!');
            return;
        }

        console.log(`User found: ${user.email} (Admin: ${user.isAdmin})`);
        console.log('1. Promote to Admin');
        console.log('2. Revoke Admin');
        console.log('3. Reset Password');

        const choice = await question('Choose action (1/2/3): ');

        switch (choice) {
            case '1':
                await prisma.user.update({
                    where: { email },
                    data: { isAdmin: true }
                });
                console.log('User promoted to Admin.');
                break;

            case '2':
                await prisma.user.update({
                    where: { email },
                    data: { isAdmin: false }
                });
                console.log('User revoked from Admin.');
                break;

            case '3':
                const newPass = await question('Enter new password: ');
                if (!newPass) {
                    console.log('Password cannot be empty.');
                    break;
                }
                const hashedPassword = await bcrypt.hash(newPass, 10);
                await prisma.user.update({
                    where: { email },
                    data: { password: hashedPassword }
                });
                console.log('Password updated successfully.');
                break;

            default:
                console.log('Invalid choice.');
        }

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

main();
