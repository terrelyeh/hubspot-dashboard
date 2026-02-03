import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { RegionConfig } from '@/types';

const REGIONS_DIR = path.join(process.cwd(), 'regions');

/**
 * Load a single region configuration from MD file
 */
export function loadRegionConfig(regionCode: string): RegionConfig {
  const filePath = path.join(REGIONS_DIR, `${regionCode}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Region file not found: ${regionCode}.md`);
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    ...data,
    content,
  } as RegionConfig;
}

/**
 * Load all active region configurations
 */
export function loadAllRegions(): RegionConfig[] {
  if (!fs.existsSync(REGIONS_DIR)) {
    throw new Error(`Regions directory not found: ${REGIONS_DIR}`);
  }

  const filenames = fs.readdirSync(REGIONS_DIR);

  return filenames
    .filter(filename => filename.endsWith('.md'))
    .map(filename => {
      const regionCode = filename.replace('.md', '');
      return loadRegionConfig(regionCode);
    })
    .filter(region => region.isActive);
}

/**
 * Get region configuration by code
 */
export function getRegion(code: string): RegionConfig | undefined {
  try {
    return loadRegionConfig(code);
  } catch {
    return undefined;
  }
}

/**
 * Get all region codes
 */
export function getRegionCodes(): string[] {
  return loadAllRegions().map(r => r.code);
}
