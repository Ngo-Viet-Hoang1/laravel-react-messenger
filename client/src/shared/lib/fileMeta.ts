export type FileIconKind =
  | 'video'
  | 'audio'
  | 'image'
  | 'pdf'
  | 'word'
  | 'spreadsheet'
  | 'archive'
  | 'code'
  | 'file';

export interface FileMeta {
  extension: string;
  category: string;
  iconKind: FileIconKind;
  badgeClass: string;
  textClass: string;
}

export function getFileMeta(fileName: string, contentType = ''): FileMeta {
  const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
  const type = contentType.toLowerCase();

  if (type.startsWith('image/')) {
    return {
      extension: ext,
      category: 'Image',
      iconKind: 'image',
      badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      textClass: 'text-blue-500',
    };
  }

  if (type.startsWith('video/')) {
    return {
      extension: ext,
      category: 'Video',
      iconKind: 'video',
      badgeClass: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      textClass: 'text-purple-500',
    };
  }

  if (type.startsWith('audio/')) {
    return {
      extension: ext,
      category: 'Audio',
      iconKind: 'audio',
      badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      textClass: 'text-amber-500',
    };
  }

  if (type.includes('pdf') || ext === 'PDF') {
    return {
      extension: 'PDF',
      category: 'PDF Document',
      iconKind: 'pdf',
      badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      textClass: 'text-rose-500',
    };
  }

  if (
    type.includes('word') ||
    type.includes('officedocument.wordprocessingml') ||
    ['DOC', 'DOCX'].includes(ext)
  ) {
    return {
      extension: ext,
      category: 'Word Document',
      iconKind: 'word',
      badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      textClass: 'text-blue-500',
    };
  }

  if (
    type.includes('spreadsheet') ||
    type.includes('excel') ||
    ['XLS', 'XLSX', 'CSV'].includes(ext)
  ) {
    return {
      extension: ext,
      category: 'Spreadsheet',
      iconKind: 'spreadsheet',
      badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      textClass: 'text-emerald-500',
    };
  }

  if (
    ['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext) ||
    type.includes('zip') ||
    type.includes('compressed')
  ) {
    return {
      extension: ext,
      category: 'Archive',
      iconKind: 'archive',
      badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      textClass: 'text-amber-500',
    };
  }

  if (
    ['JS', 'TS', 'TSX', 'JSX', 'PY', 'JSON', 'HTML', 'CSS', 'CS', 'PHP', 'GO', 'RS', 'SQL', 'SH', 'CPP', 'C', 'JAVA', 'YML', 'YAML'].includes(ext)
  ) {
    return {
      extension: ext,
      category: 'Source Code',
      iconKind: 'code',
      badgeClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      textClass: 'text-cyan-500',
    };
  }

  return {
    extension: ext,
    category: 'File',
    iconKind: 'file',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    textClass: 'text-muted-foreground',
  };
}

