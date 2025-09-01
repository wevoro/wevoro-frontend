import { HomeIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';

export const environmentType = defineType({
  name: 'environment',
  title: 'Environment',
  type: 'document',
  icon: HomeIcon,

  fields: [
    defineField({
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Environment Contents',
      readOnly: true,
    }),

    defineField({
      name: 'environmentType',
      title: 'Environment',
      type: 'string',
      options: {
        list: [
          { title: 'Production', value: 'production' },
          { title: 'Development', value: 'development' },
          { title: 'Production Waitlist', value: 'waitlist' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: {
      title: 'pageTitle',
    },
  },
});
