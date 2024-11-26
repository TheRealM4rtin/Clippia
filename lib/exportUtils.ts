import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { nanoid } from 'nanoid';
import DOMPurify from 'isomorphic-dompurify';

interface ImageData {
  src: string;
  alt: string;
  filename: string;
  isBase64: boolean;
}

export const extractImagesFromMarkdown = (content: string): ImageData[] => {
  const images: ImageData[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const imgElements = doc.getElementsByTagName('img');

  Array.from(imgElements).forEach(img => {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    const isBase64 = src.startsWith('data:image');
    
    if (isBase64) {
      const extension = src.split(';')[0].split('/')[1];
      const filename = `image-${nanoid(6)}.${extension}`;
      images.push({ src, alt, filename, isBase64 });
    } else if (src.startsWith('http') || src.startsWith('https')) {
      const extension = src.split('.').pop()?.split(/[#?]/)[0] || 'png';
      const filename = `image-${nanoid(6)}.${extension}`;
      images.push({ src, alt, filename, isBase64 });
    }
  });

  return images;
};

export const replaceImagesInContent = (content: string, images: ImageData[]): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const imgElements = doc.getElementsByTagName('img');

  Array.from(imgElements).forEach(img => {
    const src = img.getAttribute('src') || '';
    const matchingImage = images.find(image => image.src === src);
    
    if (matchingImage) {
      const imagePath = matchingImage.isBase64 ? `./images/${matchingImage.filename}` : matchingImage.src;
      const markdownImage = document.createTextNode(`![${matchingImage.alt}](${imagePath})`);
      img.parentNode?.replaceChild(markdownImage, img);
    }
  });

  return doc.body.innerHTML;
};

export const cleanupHtml = (html: string): string => {
  // Sanitize HTML first
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'li', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt']
  });

  return cleanHtml
    .replace(/\n+/g, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
    .replace(/data-[^=]*="[^"]*"/g, '')
    .replace(/draggable="[^"]*"/g, '')
    .replace(/spellcheck="[^"]*"/g, '');
};

export const convertHtmlToMarkdown = (html: string): string => {
  const cleanHtml = cleanupHtml(html);
  
  let markdown = cleanHtml
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match: string, content: string) => {
      return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, item: string) => {
        const depth = (item.match(/<ul/g) || []).length;
        const indent = '  '.repeat(depth);
        return `${indent}- ${item.replace(/<ul[\s\S]*<\/ul>/gi, '\n')}\n`;
      });
    })
    
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
      return '\n```\n' + code.trim() + '\n```\n';
    })
    
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  markdown = markdown
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .split('\n').map(line => line.trimRight()).join('\n');

  return markdown;
};

export const exportToMarkdown = async (
  title: string,
  content: string,
  includeImages: boolean = true
): Promise<void> => {
  try {
    const images = extractImagesFromMarkdown(content);
    let markdownContent = convertHtmlToMarkdown(content);
    markdownContent = replaceImagesInContent(markdownContent, images);

    if (images.some(img => img.isBase64) && includeImages) {
      // Create zip if there are base64 images
      const zip = new JSZip();
      zip.file(`${title}.md`, markdownContent);

      const imgFolder = zip.folder('images');
      if (imgFolder) {
        for (const { src, filename, isBase64 } of images) {
          if (isBase64) {
            const base64Data = src.split(',')[1];
            const binaryData = atob(base64Data);
            const uint8Array = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
              uint8Array[i] = binaryData.charCodeAt(i);
            }
            imgFolder.file(filename, uint8Array);
          }
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${title}.zip`);
    } else {
      // Save markdown file directly if no base64 images
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, `${title}.md`);
    }
  } catch (error) {
    console.error('Error during export:', error);
    throw new Error('Failed to export markdown file');
  }
}; 