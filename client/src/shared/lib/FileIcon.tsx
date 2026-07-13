import * as React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileVideo,
  FileAudio,
  ImageIcon,
  File,
} from 'lucide-react';
import type { FileIconKind } from './fileMeta';

export interface FileIconProps {
  iconKind: FileIconKind;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({
  iconKind,
  className = 'h-5 w-5',
}) => {
  switch (iconKind) {
    case 'video':
      return <FileVideo className={className} />;
    case 'audio':
      return <FileAudio className={className} />;
    case 'pdf':
    case 'word':
      return <FileText className={className} />;
    case 'spreadsheet':
      return <FileSpreadsheet className={className} />;
    case 'archive':
      return <FileArchive className={className} />;
    case 'code':
      return <FileCode className={className} />;
    case 'image':
      return <ImageIcon className={className} />;
    default:
      return <File className={className} />;
  }
};

