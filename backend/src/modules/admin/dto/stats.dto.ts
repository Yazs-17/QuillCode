export class SiteStatsDto {
  totalUsers: number;
  totalArticles: number;
  totalTags: number;
  totalShares: number;
  totalComments: number;
  articlesByType: {
    algorithm: number;
    snippet: number;
    html: number;
  };
  recentUsers: number; // 最近7天注册
  recentArticles: number; // 最近7天发布
}

export class UserStatsDto {
  userId: string;
  username: string;
  email: string;
  articleCount: number;
  algorithmCount: number;
  snippetCount: number;
  htmlCount: number;
  totalShares: number;
  registeredAt: Date;
}

export class PopularTagDto {
  tagId: string;
  tagName: string;
  usageCount: number;
}

export class OperationLogDto {
  id: number;
  tableName: string;
  operationType: string;
  recordId: string;
  oldData: any;
  newData: any;
  operatedAt: Date;
}

export class ArticleDetailDto {
  articleId: string;
  title: string;
  type: string;
  language: string;
  authorName: string;
  authorEmail: string;
  shareCount: number;
  tagNames: string;
  createdAt: Date;
  updatedAt: Date;
}
