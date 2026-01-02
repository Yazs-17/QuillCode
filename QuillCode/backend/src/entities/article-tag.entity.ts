import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Article } from './article.entity';
import { Tag } from './tag.entity';

@Entity('article_tags')
export class ArticleTag {
  @PrimaryColumn({ name: 'article_id' })
  articleId: string;

  @PrimaryColumn({ name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => Article, (article) => article.articleTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Tag, (tag) => tag.articleTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
