import { Module } from '@nestjs/common';
import { EmployeeBranchesService } from './employee-branches.service';
import { EmployeeBranchesController } from './employee-branches.controller';

@Module({
  controllers: [EmployeeBranchesController],
  providers: [EmployeeBranchesService],
})
export class EmployeeBranchesModule {}
