import path from 'path';

export const SEGMENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export class SegmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SegmentValidationError';
  }
}

export const normalizeSegmentId = (rawId: string): string => {
  if (typeof rawId !== 'string') {
    throw new SegmentValidationError('Invalid segment id');
  }

  const trimmed = rawId.trim();
  if (!trimmed) {
    throw new SegmentValidationError('Invalid segment id');
  }

  const idWithoutExt = trimmed.endsWith('.json') ? trimmed.slice(0, -5) : trimmed;

  if (!SEGMENT_ID_PATTERN.test(idWithoutExt)) {
    throw new SegmentValidationError('Invalid segment id');
  }

  return idWithoutExt;
};

export interface ResolvedSegmentPath {
  id: string;
  filePath: string;
}

export const resolveSegmentPath = (baseDir: string, rawId: string): ResolvedSegmentPath => {
  const normalizedId = normalizeSegmentId(rawId);
  const base = path.resolve(baseDir);
  const target = path.resolve(base, `${normalizedId}.json`);
  const baseWithSep = base.endsWith(path.sep) ? base : `${base}${path.sep}`;

  if (!target.startsWith(baseWithSep)) {
    throw new SegmentValidationError('Invalid segment path');
  }

  return { id: normalizedId, filePath: target };
};
