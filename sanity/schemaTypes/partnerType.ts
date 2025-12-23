import { HomeIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const partnerType = defineType({
  name: "partner",
  title: "Partner",
  type: "document",
  icon: HomeIcon,

  fields: [
    defineField({
      name: "pageTitle",
      title: "Page Title",
      type: "string",
      initialValue: "Partner Contents",
      readOnly: true,
    }),
    defineField({
      name: "section1",
      title: "Section 1",
      type: "object",
      fields: [
        defineField({
          name: "titleLight",
          title: "Title Light",
          type: "string",
        }),
        defineField({
          name: "titleBold",
          title: "Title Bold",
          type: "string",
        }),
        defineField({
          name: "description",
          title: "Description",
          type: "text",
        }),
        defineField({
          name: "buttonText",
          title: "Button Text",
          type: "string",
        }),
        defineField({
          name: "appStoreLink",
          title: "App Store Link",
          type: "url",
        }),
        defineField({
          name: "googlePlayLink",
          title: "Google Play Link",
          type: "url",
        }),
      ],
    }),
    defineField({
      name: "section2",
      title: "Section 2",
      type: "object",
      fields: [
        defineField({
          name: "titleLight",
          title: "Title Light",
          type: "string",
        }),
        defineField({
          name: "titleBold",
          title: "Title Bold",
          type: "string",
        }),
        defineField({
          name: "features",
          title: "Features",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Title",
                  type: "string",
                }),
                defineField({
                  name: "description",
                  title: "Description",
                  type: "text",
                }),
              ],
            },
          ],
        }),
      ],
    }),

    defineField({
      name: "section3",
      title: "Section 3",
      type: "object",
      fields: [
        defineField({
          name: "titleBold",
          title: "Title Bold",
          type: "string",
        }),
        defineField({
          name: "titleLight",
          title: "Title Light",
          type: "string",
        }),

        defineField({
          name: "description",
          title: "Description",
          type: "string",
        }),

        defineField({
          name: "subtitle",
          title: "Subtitle",
          type: "string",
        }),
        defineField({
          name: "subDescription",
          title: "Sub Description",
          type: "string",
        }),

        defineField({
          name: "partnerCategories",
          title: "Partner Categories",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Title",
                  type: "string",
                }),
                defineField({
                  name: "description",
                  title: "Description",
                  type: "string",
                }),
              ],
            },
          ],
        }),
        defineField({
          name: "buttonText",
          title: "Button Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "section4",
      title: "Section 4",
      type: "object",
      fields: [
        defineField({
          name: "titleLight",
          title: "Title Light",
          type: "string",
        }),
        defineField({
          name: "titleBold",
          title: "Title Bold",
          type: "string",
        }),
        defineField({
          name: "horizzonFeatures",
          title: "Wevoro Features",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Title",
                  type: "string",
                }),
                defineField({
                  name: "description",
                  title: "Description",
                  type: "string",
                }),
              ],
            },
          ],
        }),
      ],
    }),

    defineField({
      name: 'solution',
      title: 'Section 5',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
        }),
        defineField({
          name: 'description',
          title: 'Description',
          type: 'text',
        }),
        defineField({
          name: 'comparisonBoxes',
          title: 'Comparisons',
          type: 'array',
          validation: (Rule) => Rule.max(2),
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'type',
                  title: 'Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Problem', value: 'problem' },
                      { title: 'Solution', value: 'solution' },
                    ],
                  },
                }),
                defineField({
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                }),
                defineField({
                  name: 'hasBadge',
                  title: 'Display as Badge',
                  type: 'boolean',
                  initialValue: false,
                }),
                defineField({
                  name: 'items',
                  title: 'Items',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'title',
                          title: 'Title',
                          type: 'string',
                        }),
                        defineField({
                          name: 'description',
                          title: 'Description',
                          type: 'text',
                        }),
                      ],
                      preview: {
                        select: {
                          title: 'title',
                          subtitle: 'description',
                        },
                      },
                    },
                  ],
                }),
              ],
              preview: {
                select: {
                  title: 'title',
                  subtitle: 'type',
                },
              },
            },
          ],
        }),
        defineField({
          name: 'footerText',
          title: 'Footer Text',
          type: 'text',
        }),
      ],
    }),


    defineField({
      name: "section5",
      title: "Section 6",
      type: "object",
      fields: [
        defineField({
          name: "titleLight",
          title: "Title Light",
          type: "string",
        }),
        defineField({
          name: "titleBold",
          title: "Title Bold",
          type: "string",
        }),

        defineField({
          name: "steps",
          title: "Steps",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "step",
                  title: "Title",
                  type: "string",
                }),
                defineField({
                  name: "description",
                  title: "Description",
                  type: "text",
                }),
              ],
            },
          ],
        }),
      ],
    }),

    defineField({
      name: "section6",
      title: "Section 7",
      type: "object",
      fields: [
        defineField({
          name: "title",
          title: "Title",
          type: "string",
        }),

        defineField({
          name: "description",
          title: "Description",
          type: "string",
        }),
        defineField({
          name: 'buttons',
          title: 'Buttons',
          type: 'array',
          validation: (Rule) => Rule.max(2),
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'text',
                  title: 'Button Text',
                  type: 'string',
                }),
                defineField({
                  name: 'href',
                  title: 'Button Link',
                  type: 'string',
                }),
              ],
              preview: {
                select: {
                  title: 'text',
                  subtitle: 'href',
                },
              },
            },
          ],
        }),
        defineField({
          name: "appStoreLink",
          title: "App Store Link",
          type: "url",
        }),
        defineField({
          name: "googlePlayLink",
          title: "Google Play Link",
          type: "url",
        }),
      ],
    }),
  
    defineField({
      name: "section8",
      title: "Section 8",
      type: "object",
      fields: [
        defineField({
          name: "titleLight",
          title: "Title Light",
          type: "string",
        }),
        defineField({
          name: "titleBold",
          title: "Title Bold",
          type: "string",
        }),

        defineField({
          name: "faqs",
          title: "FAQs",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "question",
                  title: "Question",
                  type: "string",
                }),
                defineField({
                  name: "answer",
                  title: "Answer",
                  type: "text",
                }),
              ],
            },
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "pageTitle",
    },
  },
});
