import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Share } from './share.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'share_id' })
  shareId: string;

  @ManyToOne(() => Share, (share) => share.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'share_id' })
  share: Share;

  @Column({ name: 'author_name' })
  authorName: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
