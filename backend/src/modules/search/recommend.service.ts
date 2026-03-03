import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Article, ArticleTag } from '../../entities';

export interface RecommendedArticle {
  id: string;
  title: string;
  type: string;
  language: string;
  tags: string[];
  similarity: number;
  reason: string;
}

@Injectable()
export class RecommendService implements OnModuleInit {
  private readonly logger = new Logger(RecommendService.name);
  private isDevMode = false;
  private ollamaAvailable = false;
  private ollamaBaseUrl: string;
  private ollamaModel: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(ArticleTag)
    private articleTagRepository: Repository<ArticleTag>,
  ) {
    this.ollamaBaseUrl =
      this.configService.get<string>('ollama.baseUrl') ||
      'http://localhost:11434';
    this.ollamaModel =
      this.configService.get<string>('ollama.model') || 'llama3.2';
  }

  async onModuleInit() {
    this.isDevMode = this.configService.get<string>('app.mode') === 'dev';

    if (this.isDevMode) {
      await this.checkOllamaConnection();
    }
  }

  private async checkOllamaConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`);
      if (response.ok) {
        this.ollamaAvailable = true;
        this.logger.log('Ollama connected successfully');
      } else {
        this.ollamaAvailable = false;
        this.logger.warn('Ollama not available');
      }
    } catch {
      this.ollamaAvailable = false;
      this.logger.warn('Ollama not available, RAG features disabled');
    }
  }

  async getRecommendations(
    articleId: string,
    userId: string,
  ): Promise<RecommendedArticle[]> {
    // Get the source article with tags
    const sourceArticle = await this.articleRepository.findOne({
      where: { id: articleId },
      relations: ['articleTags', 'articleTags.tag'],
    });

    if (!sourceArticle) {
      return [];
    }

    const sourceTags =
      sourceArticle.articleTags?.map((at) => at.tag?.name).filter(Boolean) ||
      [];

    // If no tags, return empty
    if (sourceTags.length === 0) {
      return [];
    }

    // Find articles with similar tags (tag-based recommendation)
    const tagBasedRecommendations = await this.getTagBasedRecommendations(
      articleId,
      userId,
      sourceTags,
    );

    // If Ollama is available in dev mode, enhance with AI recommendations
    if (this.isDevMode && this.ollamaAvailable) {
      return this.enhanceWithAI(sourceArticle, tagBasedRecommendations);
    }

    return tagBasedRecommendations;
  }

  private async getTagBasedRecommendations(
    excludeArticleId: string,
    userId: string,
    tags: string[],
  ): Promise<RecommendedArticle[]> {
    // Find articles that share tags with the source article
    const articleTags = await this.articleTagRepository
      .createQueryBuilder('at')
      .innerJoinAndSelect('at.article', 'article')
      .innerJoinAndSelect('at.tag', 'tag')
      .where('tag.name IN (:...tags)', { tags })
      .andWhere('article.id != :excludeId', { excludeId: excludeArticleId })
      .andWhere('article.userId = :userId', { userId })
      .getMany();

    // Group by article and count matching tags
    const articleScores = new Map<
      string,
      { article: Article; matchingTags: string[]; score: number }
    >();

    for (const at of articleTags) {
      const existing = articleScores.get(at.article.id);
      if (existing) {
        existing.matchingTags.push(at.tag.name);
        existing.score += 1;
      } else {
        articleScores.set(at.article.id, {
          article: at.article,
          matchingTags: [at.tag.name],
          score: 1,
        });
      }
    }

    // Sort by score and take top 5
    const sorted = Array.from(articleScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Get full article data with all tags
    const articleIds = sorted.map((s) => s.article.id);
    if (articleIds.length === 0) return [];

    const fullArticles = await this.articleRepository.find({
      where: { id: In(articleIds) },
      relations: ['articleTags', 'articleTags.tag'],
    });

    const articleMap = new Map(fullArticles.map((a) => [a.id, a]));

    return sorted.map((s) => {
      const fullArticle = articleMap.get(s.article.id);
      const allTags =
        fullArticle?.articleTags?.map((at) => at.tag?.name).filter(Boolean) ||
        [];

      return {
        id: s.article.id,
        title: s.article.title,
        type: s.article.type,
        language: s.article.language,
        tags: allTags,
        similarity: s.score / tags.length,
        reason: `共享标签: ${s.matchingTags.join(', ')}`,
      };
    });
  }

  private async enhanceWithAI(
    sourceArticle: Article,
    tagRecommendations: RecommendedArticle[],
  ): Promise<RecommendedArticle[]> {
    if (tagRecommendations.length === 0) {
      return [];
    }

    try {
      // Create a prompt for Ollama to analyze and rank recommendations
      const prompt = this.buildAnalysisPrompt(
        sourceArticle,
        tagRecommendations,
      );

      const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 500,
          },
        }),
      });

      if (!response.ok) {
        return tagRecommendations;
      }

      const result = await response.json();
      const aiAnalysis = result.response || '';

      // Parse AI response and enhance recommendations
      return this.parseAIResponse(tagRecommendations, aiAnalysis);
    } catch (error) {
      this.logger.error('AI enhancement failed', error);
      return tagRecommendations;
    }
  }

  private buildAnalysisPrompt(
    source: Article,
    recommendations: RecommendedArticle[],
  ): string {
    const sourceTags =
      source.articleTags?.map((at) => at.tag?.name).join(', ') || '';

    const recList = recommendations
      .map((r, i) => `${i + 1}. "${r.title}" (标签: ${r.tags.join(', ')})`)
      .join('\n');

    return `分析以下文章推荐的相关性。

源文章: "${source.title}"
类型: ${source.type}
标签: ${sourceTags}

推荐文章:
${recList}

请为每篇推荐文章提供一句话的推荐理由，格式如下:
1. [理由]
2. [理由]
...

只输出理由，不要其他内容。`;
  }

  private parseAIResponse(
    recommendations: RecommendedArticle[],
    aiResponse: string,
  ): RecommendedArticle[] {
    const lines = aiResponse.split('\n').filter((l) => l.trim());

    return recommendations.map((rec, index) => {
      const line = lines[index];
      if (line) {
        // Extract reason from line like "1. [reason]" or "1. reason"
        const match = line.match(/^\d+\.\s*\[?(.+?)\]?$/);
        if (match) {
          return { ...rec, reason: match[1].trim() };
        }
      }
      return rec;
    });
  }

  isAvailable(): boolean {
    return this.isDevMode && this.ollamaAvailable;
  }

  isDevModeEnabled(): boolean {
    return this.isDevMode;
  }
}
