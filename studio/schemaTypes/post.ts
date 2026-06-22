import { defineField, defineType } from "sanity";

export default defineType({
    name: "post",
    title: "Blog Post",
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
            description: "Short summary shown on the blog overview and in SEO.",
            type: "text",
            rows: 3,
            validation: (rule) => rule.required().min(20).max(240),
        }),
        defineField({
            name: "coverImage",
            title: "Cover Image",
            type: "image",
            options: { hotspot: true },
            fields: [
                defineField({
                    name: "alt",
                    title: "Alt text",
                    type: "string",
                    validation: (rule) => rule.required(),
                }),
            ],
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "author",
            title: "Author",
            type: "reference",
            to: [{ type: "author" }],
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "category",
            title: "Category",
            type: "reference",
            to: [{ type: "category" }],
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
            name: "publishedAt",
            title: "Published at",
            type: "datetime",
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "body",
            title: "Body",
            type: "array",
            of: [
                {
                    type: "block",
                    styles: [
                        { title: "Normal", value: "normal" },
                        { title: "H2", value: "h2" },
                        { title: "H3", value: "h3" },
                        { title: "H4", value: "h4" },
                        { title: "Quote", value: "blockquote" },
                    ],
                    lists: [
                        { title: "Bullet", value: "bullet" },
                        { title: "Numbered", value: "number" },
                    ],
                    marks: {
                        decorators: [
                            { title: "Bold", value: "strong" },
                            { title: "Italic", value: "em" },
                            { title: "Code", value: "code" },
                        ],
                        annotations: [
                            {
                                title: "Link",
                                name: "link",
                                type: "object",
                                fields: [
                                    {
                                        title: "URL",
                                        name: "href",
                                        type: "url",
                                        validation: (rule) =>
                                            rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }),
                                    },
                                    {
                                        title: "Open in new tab",
                                        name: "blank",
                                        type: "boolean",
                                        initialValue: false,
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "seoTitle",
            title: "SEO Title",
            description: "Defaults to the post title if left empty. Max 70 characters.",
            type: "string",
            validation: (rule) => rule.max(70),
        }),
        defineField({
            name: "seoDescription",
            title: "SEO Description",
            description: "Defaults to the excerpt if left empty. Max 160 characters.",
            type: "text",
            rows: 2,
            validation: (rule) => rule.max(160),
        }),
    ],
    preview: {
        select: {
            title: "title",
            author: "author.name",
            category: "category.title",
            media: "coverImage",
        },
        prepare({ title, author, category, media }) {
            return {
                title,
                subtitle: [category, author].filter(Boolean).join(" · "),
                media,
            };
        },
    },
    orderings: [
        {
            title: "Published (newest first)",
            name: "publishedAtDesc",
            by: [{ field: "publishedAt", direction: "desc" }],
        },
    ],
});
