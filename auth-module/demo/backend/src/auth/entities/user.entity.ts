// 从 src-backend 复制的用户实体
// 详细注释请查看 src-backend/entities/user.entity.ts

import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
	USER = 'user',
	ADMIN = 'admin',
}

@Entity('users')
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ unique: true })
	username: string;

	@Column({ unique: true })
	email: string;

	@Column({ name: 'password_hash' })
	passwordHash: string;

	@Column({ type: 'varchar', default: UserRole.USER })
	role: UserRole;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;
}
