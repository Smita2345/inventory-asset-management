import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetStatus } from './entities';

@Controller('api')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get('employees')
  getEmployees() {
    return this.service.getEmployees();
  }

  @Get('employees/:id/assets')
  getEmployeeAssets(@Param('id') id: string) {
    return this.service.getEmployeeAssets(+id);
  }

  @Get('assets')
  getAssets(@Query('search') search?: string, @Query('status') status?: string) {
    return this.service.getAssets(search, status);
  }

  @Post('assets')
  createAsset(@Body() body: any) {
    return this.service.createAsset(body);
  }

  @Post('assets/:id/assign')
  assignAsset(@Param('id') id: string, @Body('employeeId') employeeId: number) {
    return this.service.assignAsset(+id, Number(employeeId));
  }

  @Post('assets/:id/return')
  returnAsset(@Param('id') id: string, @Body('returnCondition') returnCondition: string) {
    return this.service.returnAsset(+id, returnCondition);
  }

  @Get('assets/:id/history')
  getHistory(@Param('id') id: string) {
    return this.service.getAssetHistory(+id);
  }

  @Patch('assets/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: AssetStatus) {
    return this.service.updateStatus(+id, status);
  }
}