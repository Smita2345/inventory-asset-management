import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';

export enum AssetStatus {
  AVAILABLE = 'Available',
  ASSIGNED = 'Assigned',
  UNDER_REPAIR = 'Under Repair',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  department: string;

  @OneToMany(() => AssetAssignment, (assignment) => assignment.employee)
  assignments: AssetAssignment[];
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  assetTag: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.AVAILABLE })
  status: AssetStatus;

  @Column({ type: 'date', nullable: true })
  warrantyExpiry: string;

  @OneToMany(() => AssetAssignment, (assignment) => assignment.asset)
  assignments: AssetAssignment[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('asset_assignments')
export class AssetAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Asset, (asset) => asset.assignments, { onDelete: 'CASCADE' })
  asset: Asset;

  @ManyToOne(() => Employee, (employee) => employee.assignments)
  employee: Employee;

  @CreateDateColumn()
  assignedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnedDate: Date | null;

  @Column({ nullable: true })
  returnCondition: string;
}