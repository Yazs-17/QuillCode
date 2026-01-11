import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Article } from './article.entity';
import { Comment } from './comment.entity';

@Entity('shares')
export class Share {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'article_id' })
  articleId: string;

  @ManyToOne(() => Article)
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column({ unique: true })
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @OneToMany(() => Comment, (comment) => comment.share)
  comments: Comment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
