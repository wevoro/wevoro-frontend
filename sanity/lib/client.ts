import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';
import { apiVersion, dataset, projectId } from '../env';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Disable CDN to get fresh content - CDN caches for ~60 seconds
  useCdn: false,
});

const builder = imageUrlBuilder(client);
export const urlFor = (source: any) => builder.image(source).url();
