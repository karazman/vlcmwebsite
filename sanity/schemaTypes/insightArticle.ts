import { defineField, defineType } from "sanity";

export default defineType({
    name: "insightArticle",
    title: "Insight Article",
    type: "document",
    fields: [
        defineField({
            name: "title",
            title: "Title",
            type: "string",
            validation: (rule) => rule.required().min(8).max(120),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            options: { source: "title", maxLength: 96 },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "excerpt",
            title: "Excerpt",
            type: "text",
            rows: 3,
            validation: (rule) => rule.required().min(20).max(240),
        }),
        defineField({
            name: "coverImage",
            title: "Cover image",
            type: "image",
            options: { hotspot: true },
            fields: [
                defineField({
                    name: "alt",
                    title: "Alt text",
                    type: "string",
                    validation: (rule) => rule.required().min(4).max(120),
                }),
            ],
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "author",
            title: "Author",
            type: "string",
            initialValue: "VL Capital Underwriting",
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "publishedAt",
            title: "Published at",
            type: "datetime",
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "category",
            title: "Category",
            type: "string",
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "tags",
            title: "Tags",
            type: "array",
            of: [{ type: "string" }],
            options: { layout: "tags" },
        }),
        defineField({
            name: "body",
            title: "Body",
            type: "array",
            of: [{ type: "block" }],
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "seoTitle",
            title: "SEO title",
            type: "string",
            validation: (rule) => rule.max(70),
        }),
        defineField({
            name: "seoDescription",
            title: "SEO description",
            type: "text",
            rows: 2,
            validation: (rule) => rule.max(160),
        }),
    ],
    preview: {
        select: {
            title: "title",
            subtitle: "category",
            media: "coverImage",
        },
    },
});
