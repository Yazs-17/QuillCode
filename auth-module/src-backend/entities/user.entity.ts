/**
 * ============================================
 * 用户实体 - User Entity
 * ============================================
 * 
 * 📌 作用：定义用户数据表结构
 * 📌 框架：TypeORM
 * 
 * 🔧 自定义指南：
 * - 添加更多字段：如 avatar, phone, nickname 等
 * - 修改角色枚举：根据业务需求扩展 UserRole
 * - 添加关联关系：如 @OneToMany 关联用户的文章等
 */

import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

/**
 * 用户角色枚举
 * 
 * 🔧 扩展示例：
 * export enum UserRole {
 *   USER = 'user',
 *   ADMIN = 'admin',
 *   VIP = 'vip',        // 新增 VIP 角色
 *   MODERATOR = 'mod',  // 新增版主角色
 * }
 */
export enum UserRole {
	USER = 'user',    // 普通用户
	ADMIN = 'admin',  // 管理员
}

@Entity('users')  // 数据库表名
export class User {

	// ========== 主键 ==========
	@PrimaryGeneratedColumn('uuid')
	id: string;

	// ========== 基本信息 ==========

	@Column({ unique: true })
	username: string;  // 用户名，唯一

	@Column({ unique: true })
	email: string;     // 邮箱，唯一

	@Column({ name: 'password_hash' })
	passwordHash: string;  // 密码哈希值（bcrypt 加密）

	// ========== 角色权限 ==========

	@Column({
		type: 'varchar',  // SQLite 兼容，MySQL 可改为 'enum'
		default: UserRole.USER,
	})
	role: UserRole;

	// ========== 时间戳 ==========

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;  // 创建时间，自动生成

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;  // 更新时间，自动更新

	// ========== 🔧 可扩展字段示例 ==========

	// @Column({ nullable: true })
	// avatar: string;  // 头像 URL

	// @Column({ nullable: true })
	// phone: string;   // 手机号

	// @Column({ default: true })
	// isActive: boolean;  // 账号是否激活
}
