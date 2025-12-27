/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function employeeBranchesSeed() {
    const employeeBranchesPath = path.resolve(
        __dirname,
        'data',
        'employee-branches.json',
    );
    const employeeBranchesRaw = fs.readFileSync(employeeBranchesPath, 'utf-8');
    const employeeBranches = JSON.parse(employeeBranchesRaw).data;

    for (const employeeBranch of employeeBranches) {
        const role = await prisma.role.findFirst({
            where: { key: employeeBranch.roleKey },
        });

        if (!role) {
            console.log(`⚠️ role ${employeeBranch.roleKey} not found`);
            continue;
        }

        const branch = await prisma.branch.findFirst({
            where: { name: employeeBranch.branchName },
        });

        if (!branch) {
            console.log(`⚠️ branch ${employeeBranch.branchName} not found`);
            continue;
        }

        const user = await prisma.user.upsert({
            where: { email: employeeBranch.email },
            update: {},
            create: {
                name: employeeBranch.name,
                email: employeeBranch.email,
                password: await bcrypt.hash(employeeBranch.password, 10),
                phoneNumber: employeeBranch.phoneNumber,
                roleId: role.id,
                avatar: employeeBranch.avatar || null,
            },
        });

        const existingEmployeeBranch = await prisma.employeeBranch.findFirst({
            where: { userId: user.id, branchId: branch.id },
        });

        if (existingEmployeeBranch) {
            console.log(
                `⚠️ employee ${employeeBranch.name} already exists, skipping`,
            );
            continue; // continue digunakan untuk menghentikan perulangan saat inilalu melanjutkan ke perulangan selanjutnya
        }
        await prisma.employeeBranch.create({
            data: {
                userId: user.id,
                branchId: branch.id,
                type: employeeBranch.type,
            },
        });
        console.log(
            `✅ employee branch for user ${user.email} at ${branch.name} created`,
        );
    }
}

// For running directly
if (require.main === module) {
    employeeBranchesSeed()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
