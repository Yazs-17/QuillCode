import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { ArticleTag } from './article-tag.entity';

export enum ArticleType {
  ALGORITHM = 'algorithm',
  SNIPPET = 'snippet',
  HTML = 'html',
}

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  code: string;

  // Use simple type for SQLite compatibility (SQLite doesn't support enum)
  @Column({
    type: 'simple-enum',
    enum: ArticleType,
    default: ArticleType.SNIPPET,
  })
  type: ArticleType;

  @Column({ default: 'javascript' })
  language: string;

  @OneToMany(() => ArticleTag, (articleTag) => articleTag.article)
  articleTags: ArticleTag[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
