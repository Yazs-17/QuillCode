import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ArticleTag } from './article-tag.entity';
import { User } from './user.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @OneToMany(() => ArticleTag, (articleTag) => articleTag.tag)
  articleTags: ArticleTag[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
