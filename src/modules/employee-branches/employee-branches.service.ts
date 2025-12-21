/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { EmployeeBranch } from '.prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEmployeeBranchDto } from './dto/create-employee-branch.dto';
import { UpdateEmployeeBranchDto } from './dto/update-employee-branch.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeBranchesService {
    constructor(private prismaService: PrismaService) {}

    private async validateUniqueEmail(
        email: string,
        excludeUserId?: number,
    ): Promise<void> {
        const existingUser = await this.prismaService.user.findUnique({
            where: { email },
        });

        if (existingUser && existingUser.id !== excludeUserId) {
            throw new BadRequestException(`Email ${email} is already in use.`);
        }
    }

    private async validateBranchExists(branchId: number): Promise<void> {
        const branch = await this.prismaService.branch.findUnique({
            where: { id: branchId },
        });

        if (!branch) {
            throw new BadRequestException(
                `Branch with ID ${branchId} does not exist.`,
            );
        }
    }
    private async validateRoleExists(roleId: number): Promise<void> {
        const role = await this.prismaService.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw new BadRequestException(
                `Role with ID ${roleId} does not exist.`,
            );
        }
    }

    async create(
        createEmployeeBranchDto: CreateEmployeeBranchDto,
    ): Promise<EmployeeBranch> {
        await Promise.all([
            this.validateUniqueEmail(createEmployeeBranchDto.email),
            this.validateBranchExists(createEmployeeBranchDto.branch_id),
            this.validateRoleExists(createEmployeeBranchDto.role_id),
        ]);

        // &transaction = jika salah satu operasi di dalam blok tersebut gagal, maka seluruh operasi akan dibatalkan (rollback)
        return this.prismaService.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    name: createEmployeeBranchDto.name,
                    email: createEmployeeBranchDto.email,
                    phoneNumber: createEmployeeBranchDto.phone_number,
                    password: await bcrypt.hash(
                        createEmployeeBranchDto.password,
                        10,
                    ),
                    avatar: createEmployeeBranchDto.avatar,
                    roleId: createEmployeeBranchDto.role_id,
                },
            });

            const employeeBranch = await prisma.employeeBranch.create({
                data: {
                    userId: user.id,
                    branchId: createEmployeeBranchDto.branch_id,
                    type: createEmployeeBranchDto.type,
                },
            });
            return employeeBranch;
        });
    }

    findAll() {
        return `This action returns all employeeBranches`;
    }

    findOne(id: number) {
        return `This action returns a #${id} employeeBranch`;
    }

    update(id: number, updateEmployeeBranchDto: UpdateEmployeeBranchDto) {
        return `This action updates a #${id} employeeBranch`;
    }

    remove(id: number) {
        return `This action removes a #${id} employeeBranch`;
    }
}
