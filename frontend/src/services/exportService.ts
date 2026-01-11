/**
 * Export Service
 * 
 * Provides data export functionality for QuillCode.
 * Supports JSON format (with complete metadata) and Markdown ZIP format.
 * 
 * @module services/exportService
 */

import { RepositoryFactory } from '../repositories/factory';
import type {
  Article,
  Tag,
  ExportData,
  ExportService as IExportService,
  ImportResult,
  ArticleRepository,
  TagRepository
} from '../repositories/types';

/**
 * Export format version
 */
const EXPORT_VERSION = '1.0';

/**
 * Required metadata fields for export validation
 */
export const REQUIRED_ARTICLE_FIELDS = [
  'id',
  'title',
  'content',
  'code',
  'type',
  'language',
  'tags',
  'createdAt',
  'updatedAt'
] as const;

/**
 * Browser Export Service Implementation
 * 
 * Implements ExportService interface for browser environments.
 * Uses IndexedDB repositories to fetch data for export.
 */
export class BrowserExportService implements IExportService {
  private articleRepository: ArticleRepository | null = null;
  private tagRepository: TagRepository | null = null;

  /**
   * Create a new BrowserExportService
   * @param articleRepo - Optional article repository (uses factory if not provided)
   * @param tagRepo - Optional tag repository (uses factory if not provided)
   */
  constructor(
    articleRepo?: ArticleRepository,
    tagRepo?: TagRepository
  ) {
    this.articleRepository = articleRepo || null;
    this.tagRepository = tagRepo || null;
  }

  /**
   * Initialize repositories
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.articleRepository) {
      this.articleRepository = await RepositoryFactory.createArticleRepository();
    }
    if (!this.tagRepository) {
      this.tagRepository = await RepositoryFactory.createTagRepository();
    }
  }

  /**
   * Export all data to JSON format
   * 
   * Creates a JSON blob containing all articles and tags with complete metadata.
   * The export includes version information and timestamp for tracking.
   * 
   * @returns Promise<Blob> - JSON blob ready for download
   */
  async exportToJSON(): Promise<Blob> {
    await this.ensureInitialized();

    const articles = await this.articleRepository!.findAll();
    const tags = await this.tagRepository!.findAll();

    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      articles: articles.map(article => this.serializeArticle(article)),
      tags: tags.map(tag => this.serializeTag(tag))
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Export all articles to Markdown ZIP format
   * 
   * Creates a ZIP archive containing each article as a separate Markdown file.
   * File names are generated from article titles (sanitized for filesystem).
   * 
   * @returns Promise<Blob> - ZIP blob ready for download
   */
  async exportToMarkdown(): Promise<Blob> {
    await this.ensureInitialized();

    const articles = await this.articleRepository!.findAll();
    
    // Create ZIP file using a simple implementation
    const zipBlob = await this.createMarkdownZip(articles);
    return zipBlob;
  }

  /**
   * Import data from JSON
   * 
   * Parses a JSON blob and imports articles and tags into the repository.
   * 
   * @param data - JSON blob to import
   * @returns Promise<ImportResult> - Result of the import operation
   */
  async importFromJSON(data: Blob): Promise<ImportResult> {
    await this.ensureInitialized();

    const result: ImportResult = {
      success: false,
      articlesImported: 0,
      tagsImported: 0,
      errors: []
    };

    try {
      const text = await data.text();
      const importData = JSON.parse(text) as ExportData;

      // Validate import data structure
      if (!importData.version || !importData.articles || !importData.tags) {
        result.errors.push('Invalid export data format');
        return result;
      }

      // Import tags first (articles may reference them)
      for (const tag of importData.tags) {
        try {
          await this.tagRepository!.create({
            name: tag.name,
            color: tag.color,
            userId: tag.userId
          });
          result.tagsImported++;
        } catch (error) {
          result.errors.push(`Failed to import tag "${tag.name}": ${error}`);
        }
      }

      // Import articles
      for (const article of importData.articles) {
        try {
          await this.articleRepository!.create({
            userId: article.userId,
            title: article.title,
            content: article.content,
            code: article.code,
            type: article.type,
            language: article.language,
            tags: article.tags || []
          });
          result.articlesImported++;
        } catch (error) {
          result.errors.push(`Failed to import article "${article.title}": ${error}`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`Failed to parse import data: ${error}`);
    }

    return result;
  }

  /**
   * Serialize article for export
   * Ensures all required fields are present and dates are properly formatted.
   */
  private serializeArticle(article: Article): Article {
    return {
      id: article.id,
      userId: article.userId,
      title: article.title,
      content: article.content,
      code: article.code,
      type: article.type,
      language: article.language,
      tags: article.tags || [],
      createdAt: article.createdAt instanceof Date 
        ? article.createdAt 
        : new Date(article.createdAt),
      updatedAt: article.updatedAt instanceof Date 
        ? article.updatedAt 
        : new Date(article.updatedAt)
    };
  }

  /**
   * Serialize tag for export
   */
  private serializeTag(tag: Tag): Tag {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      userId: tag.userId,
      createdAt: tag.createdAt instanceof Date 
        ? tag.createdAt 
        : new Date(tag.createdAt)
    };
  }

  /**
   * Create a ZIP file containing Markdown files for each article
   * Uses a simple ZIP implementation without external dependencies.
   */
  private async createMarkdownZip(articles: Article[]): Promise<Blob> {
    const files: Array<{ name: string; content: string }> = [];

    for (const article of articles) {
      const fileName = this.sanitizeFileName(article.title) + '.md';
      const content = this.articleToMarkdown(article);
      files.push({ name: fileName, content });
    }

    // Create ZIP using simple implementation
    return this.createZipBlob(files);
  }

  /**
   * Convert article to Markdown format
   */
  private articleToMarkdown(article: Article): string {
    const lines: string[] = [];

    // Title
    lines.push(`# ${article.title}`);
    lines.push('');

    // Metadata
    lines.push('---');
    lines.push(`type: ${article.type}`);
    lines.push(`language: ${article.language}`);
    if (article.tags && article.tags.length > 0) {
      lines.push(`tags: ${article.tags.map(t => t.name).join(', ')}`);
    }
    lines.push(`created: ${this.formatDate(article.createdAt)}`);
    lines.push(`updated: ${this.formatDate(article.updatedAt)}`);
    lines.push('---');
    lines.push('');

    // Content
    if (article.content) {
      lines.push(article.content);
      lines.push('');
    }

    // Code block
    if (article.code) {
      lines.push('## Code');
      lines.push('');
      lines.push('```' + article.language);
      lines.push(article.code);
      lines.push('```');
    }

    return lines.join('\n');
  }

  /**
   * Sanitize file name for filesystem compatibility
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100);
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Create a ZIP blob from files
   * Simple ZIP implementation without external dependencies.
   * Uses the ZIP format specification for uncompressed files.
   */
  private createZipBlob(files: Array<{ name: string; content: string }>): Blob {
    const encoder = new TextEncoder();
    const parts: BlobPart[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    for (const file of files) {
      const fileNameBytes = encoder.encode(file.name);
      const contentBytes = encoder.encode(file.content);
      const crc = this.crc32(contentBytes);

      // Local file header
      const localHeader = this.createLocalFileHeader(
        fileNameBytes,
        contentBytes.length,
        crc
      );
      parts.push(new Uint8Array(localHeader));
      parts.push(new Uint8Array(fileNameBytes));
      parts.push(new Uint8Array(contentBytes));

      // Central directory entry
      const centralEntry = this.createCentralDirectoryEntry(
        fileNameBytes,
        contentBytes.length,
        crc,
        offset
      );
      centralDirectory.push(centralEntry);

      offset += localHeader.length + fileNameBytes.length + contentBytes.length;
    }

    // Add central directory
    const centralDirOffset = offset;
    let centralDirSize = 0;
    for (const entry of centralDirectory) {
      parts.push(new Uint8Array(entry));
      centralDirSize += entry.length;
    }

    // End of central directory
    const endOfCentralDir = this.createEndOfCentralDirectory(
      files.length,
      centralDirSize,
      centralDirOffset
    );
    parts.push(new Uint8Array(endOfCentralDir));

    return new Blob(parts, { type: 'application/zip' });
  }

  /**
   * Create local file header for ZIP
   */
  private createLocalFileHeader(
    fileName: Uint8Array,
    fileSize: number,
    crc: number
  ): Uint8Array {
    const header = new Uint8Array(30);
    const view = new DataView(header.buffer);

    // Local file header signature
    view.setUint32(0, 0x04034b50, true);
    // Version needed to extract
    view.setUint16(4, 20, true);
    // General purpose bit flag
    view.setUint16(6, 0, true);
    // Compression method (0 = stored)
    view.setUint16(8, 0, true);
    // Last mod file time
    view.setUint16(10, 0, true);
    // Last mod file date
    view.setUint16(12, 0, true);
    // CRC-32
    view.setUint32(14, crc, true);
    // Compressed size
    view.setUint32(18, fileSize, true);
    // Uncompressed size
    view.setUint32(22, fileSize, true);
    // File name length
    view.setUint16(26, fileName.length, true);
    // Extra field length
    view.setUint16(28, 0, true);

    return header;
  }

  /**
   * Create central directory entry for ZIP
   */
  private createCentralDirectoryEntry(
    fileName: Uint8Array,
    fileSize: number,
    crc: number,
    localHeaderOffset: number
  ): Uint8Array {
    const entry = new Uint8Array(46 + fileName.length);
    const view = new DataView(entry.buffer);

    // Central file header signature
    view.setUint32(0, 0x02014b50, true);
    // Version made by
    view.setUint16(4, 20, true);
    // Version needed to extract
    view.setUint16(6, 20, true);
    // General purpose bit flag
    view.setUint16(8, 0, true);
    // Compression method
    view.setUint16(10, 0, true);
    // Last mod file time
    view.setUint16(12, 0, true);
    // Last mod file date
    view.setUint16(14, 0, true);
    // CRC-32
    view.setUint32(16, crc, true);
    // Compressed size
    view.setUint32(20, fileSize, true);
    // Uncompressed size
    view.setUint32(24, fileSize, true);
    // File name length
    view.setUint16(28, fileName.length, true);
    // Extra field length
    view.setUint16(30, 0, true);
    // File comment length
    view.setUint16(32, 0, true);
    // Disk number start
    view.setUint16(34, 0, true);
    // Internal file attributes
    view.setUint16(36, 0, true);
    // External file attributes
    view.setUint32(38, 0, true);
    // Relative offset of local header
    view.setUint32(42, localHeaderOffset, true);

    // File name
    entry.set(fileName, 46);

    return entry;
  }

  /**
   * Create end of central directory record for ZIP
   */
  private createEndOfCentralDirectory(
    fileCount: number,
    centralDirSize: number,
    centralDirOffset: number
  ): Uint8Array {
    const record = new Uint8Array(22);
    const view = new DataView(record.buffer);

    // End of central dir signature
    view.setUint32(0, 0x06054b50, true);
    // Number of this disk
    view.setUint16(4, 0, true);
    // Disk where central directory starts
    view.setUint16(6, 0, true);
    // Number of central directory records on this disk
    view.setUint16(8, fileCount, true);
    // Total number of central directory records
    view.setUint16(10, fileCount, true);
    // Size of central directory
    view.setUint32(12, centralDirSize, true);
    // Offset of start of central directory
    view.setUint32(16, centralDirOffset, true);
    // Comment length
    view.setUint16(20, 0, true);

    return record;
  }

  /**
   * Calculate CRC-32 checksum
   */
  private crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    
    return (crc ^ 0xffffffff) >>> 0;
  }
}

/**
 * Validate export data has all required fields
 * Used for property testing to verify export completeness.
 */
export function validateExportData(data: ExportData): {
  valid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!data.version) missingFields.push('version');
  if (!data.exportedAt) missingFields.push('exportedAt');
  if (!Array.isArray(data.articles)) missingFields.push('articles');
  if (!Array.isArray(data.tags)) missingFields.push('tags');

  // Validate each article has required fields
  if (Array.isArray(data.articles)) {
    data.articles.forEach((article, index) => {
      for (const field of REQUIRED_ARTICLE_FIELDS) {
        if (!(field in article)) {
          missingFields.push(`articles[${index}].${field}`);
        }
      }
    });
  }

  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Trigger browser download for a blob
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get default export file name with timestamp
 */
export function getExportFileName(format: 'json' | 'zip'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = format === 'json' ? 'json' : 'zip';
  return `quillcode-export-${timestamp}.${extension}`;
}

// Export singleton instance
let exportServiceInstance: BrowserExportService | null = null;

export function getExportService(): BrowserExportService {
  if (!exportServiceInstance) {
    exportServiceInstance = new BrowserExportService();
  }
  return exportServiceInstance;
}

// Reset for testing
export function resetExportService(): void {
  exportServiceInstance = null;
}
