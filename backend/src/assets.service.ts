import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Asset, AssetAssignment, AssetStatus, Employee } from './entities';

@Injectable()
export class AssetsService implements OnModuleInit {
  constructor(
    @InjectRepository(Asset) private assetRepo: Repository<Asset>,
    @InjectRepository(Employee) private empRepo: Repository<Employee>,
    @InjectRepository(AssetAssignment) private assignRepo: Repository<AssetAssignment>,
    private dataSource: DataSource,
  ) {}

  // Automatically inserts sample employees when the app starts the first time
 // Automatically syncs this list with PostgreSQL whenever you edit and save this file
  async onModuleInit() {
    const employeesList = [
      { id: 1, name: 'Aarav Sharma', email: 'aarav@company.com', department: 'Engineering' },
      { id: 2, name: 'Priya Nair', email: 'priya@company.com', department: 'Operations' },
      { id: 3, name: 'Rohan Verma', email: 'rohan@company.com', department: 'IT Support' },
    ];

    // Inserts new IDs or updates existing names/emails/departments in PostgreSQL automatically
    await this.empRepo.save(employeesList);

    // Removes any extra sample employees that you deleted from the array above
    const activeIds = employeesList.map((e) => e.id);
    const allEmployees = await this.empRepo.find();
    for (const emp of allEmployees) {
      if (!activeIds.includes(emp.id)) {
        await this.empRepo.delete(emp.id).catch(() => null);
      }
    }
  }
  getEmployees() {
    return this.empRepo.find();
  }

  async getEmployeeAssets(employeeId: number) {
    return this.assignRepo.find({
      where: { employee: { id: employeeId }, returnedDate: IsNull() },
      relations: { asset: true},
    });
  }

  async getDashboard() {
    const [total, available, assigned, underRepair] = await Promise.all([
      this.assetRepo.count(),
      this.assetRepo.count({ where: { status: AssetStatus.AVAILABLE } }),
      this.assetRepo.count({ where: { status: AssetStatus.ASSIGNED } }),
      this.assetRepo.count({ where: { status: AssetStatus.UNDER_REPAIR } }),
    ]);
    return { total, available, assigned, underRepair };
  }

  async getAssets(search?: string, status?: string) {
    const query = this.assetRepo.createQueryBuilder('asset')
      .leftJoinAndSelect('asset.assignments', 'assignment', 'assignment.returnedDate IS NULL')
      .leftJoinAndSelect('assignment.employee', 'employee')
      .orderBy('asset.id', 'DESC');

    if (search) {
      query.andWhere('(LOWER(asset.name) LIKE :s OR LOWER(asset.assetTag) LIKE :s)', {
        s: `%${search.toLowerCase()}%`,
      });
    }
    if (status && status !== 'ALL') {
      query.andWhere('asset.status = :status', { status });
    }
    return query.getMany();
  }

  async createAsset(data: Partial<Asset>) {
    try {
      const asset = this.assetRepo.create(data);
      return await this.assetRepo.save(asset);
    } catch {
      throw new BadRequestException('Asset ID/Tag must be unique.');
    }
  }

  // Prevents assigning an asset to multiple employees simultaneously
  async assignAsset(assetId: number, employeeId: number) {
    return this.dataSource.transaction(async (manager) => {
      const asset = await manager.findOne(Asset, { where: { id: assetId } });
      if (!asset) throw new NotFoundException('Asset not found.');
      if (asset.status !== AssetStatus.AVAILABLE) {
        throw new BadRequestException('Asset is already assigned or under repair.');
      }

      const employee = await manager.findOne(Employee, { where: { id: employeeId } });
      if (!employee) throw new NotFoundException('Employee not found.');

      const assignment = manager.create(AssetAssignment, { asset, employee });
      await manager.save(assignment);

      asset.status = AssetStatus.ASSIGNED;
      return manager.save(asset);
    });
  }

  // Records return condition and updates status
  async returnAsset(assetId: number, returnCondition: string) {
    return this.dataSource.transaction(async (manager) => {
      const activeAssignment = await manager.findOne(AssetAssignment, {
        where: { asset: { id: assetId }, returnedDate: IsNull() },
        relations: {asset: true},
      });
      if (!activeAssignment) throw new BadRequestException('No active assignment found.');

      activeAssignment.returnedDate = new Date();
      activeAssignment.returnCondition = returnCondition;
      await manager.save(activeAssignment);

      activeAssignment.asset.status =
        returnCondition === 'Damaged' ? AssetStatus.UNDER_REPAIR : AssetStatus.AVAILABLE;
      return manager.save(activeAssignment.asset);
    });
  }

  getAssetHistory(assetId: number) {
    return this.assignRepo.find({
      where: { asset: { id: assetId } },
      relations: {employee: true},
      order: { assignedDate: 'DESC' },
    });
  }

  async updateStatus(assetId: number, status: AssetStatus) {
    await this.assetRepo.update(assetId, { status });
    return this.assetRepo.findOne({ where: { id: assetId } });
  }
}