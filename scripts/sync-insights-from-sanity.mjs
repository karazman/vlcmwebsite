import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "content", "insights");

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION || "2025-01-01";
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN;

if (!projectId || !dataset) {
    console.log("[sanity-sync] Skipped: SANITY_PROJECT_ID and SANITY_DATASET are not set.");
    process.exit(0);
}

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
});

const query = `*[_type == "insightArticle" && defined(slug.current) && !(_id in path("drafts.**"))] | order(publishedAt desc) {
  title,
  "slug": slug.current,
  excerpt,
  "coverImage": coverImage.asset->url,
  "coverImageAlt": coverImage.alt,
  author,
  publishedAt,
  category,
  tags,
  body
  ,seoTitle
  ,seoDescription
}`;

function sanitizeSlug(input) {
    return String(input || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function q(value) {
    return `"${String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')}"`;
}

function formatDate(value) {
    if (!value) {
        return new Date().toISOString().slice(0, 10);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return new Date().toISOString().slice(0, 10);
    }

    return parsed.toISOString().slice(0, 10);
}

function yamlArray(value) {
    if (!Array.isArray(value) || value.length === 0) {
        return "[]";
    }

    return `[${value.map((item) => q(item)).join(", ")}]`;
}

function escapeMarkdown(text) {
    return String(text || "").replace(/([*_`[\]<>])/g, "\\$1");
}

function applyMarks(text, marks, markDefs) {
    let out = escapeMarkdown(text);
    for (const mark of marks || []) {
        if (mark === "strong") {
            out = `**${out}**`;
            continue;
        }

        if (mark === "em") {
            out = `*${out}*`;
            continue;
        }

        if (mark === "code") {
            out = `\`${String(text || "").replace(/`/g, "\\`")}\``;
            continue;
        }

        const def = (markDefs || []).find((item) => item?._key === mark);
        if (def?.href) {
            out = `[${out}](${def.href})`;
        }
    }

    return out;
}

function blockStylePrefix(style) {
    if (style === "h1") return "# ";
    if (style === "h2") return "## ";
    if (style === "h3") return "### ";
    if (style === "h4") return "#### ";
    if (style === "blockquote") return "> ";
    return "";
}

function toBodyMarkdown(body) {
    if (!Array.isArray(body)) {
        return "";
    }

    const lines = [];
    let currentListType = "";
    let currentListLevel = 0;
    let listIndex = 1;

    for (const block of body) {
        if (!block || block._type !== "block") {
            continue;
        }

        const listType = block.listItem || "";
        const level = Number(block.level || 1);
        const isList = Boolean(listType);

        if (!isList && currentListType) {
            lines.push("");
            currentListType = "";
            currentListLevel = 0;
            listIndex = 1;
        }

        const text = (block.children || [])
            .map((child) => {
                if (child?._type !== "span") {
                    return "";
                }
                return applyMarks(child.text || "", child.marks || [], block.markDefs || []);
            })
            .join("")
            .trim();

        if (!text) {
            continue;
        }

        if (isList) {
            const indent = "  ".repeat(Math.max(level - 1, 0));
            if (currentListType !== listType || currentListLevel !== level) {
                listIndex = 1;
            }

            if (listType === "number") {
                lines.push(`${indent}${listIndex}. ${text}`);
                listIndex += 1;
            } else {
                lines.push(`${indent}- ${text}`);
            }

            currentListType = listType;
            currentListLevel = level;
            continue;
        }

        const prefix = blockStylePrefix(block.style || "normal");
        lines.push(`${prefix}${text}`);
        lines.push("");
    }

    while (lines.length > 0 && lines[lines.length - 1] === "") {
        lines.pop();
    }

    return lines.join("\n");
}

function hasSanitySource(content) {
    return /^---[\s\S]*?^source:\s*"sanity"\s*$/m.test(content);
}

async function pruneStaleSanityFiles(keepSlugs) {
    const entries = await readdir(outputDir, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".md")) {
            continue;
        }

        const slug = entry.name.replace(/\.md$/, "");
        if (keepSlugs.has(slug)) {
            continue;
        }

        const fullPath = path.join(outputDir, entry.name);
        const content = await readFile(fullPath, "utf8");
        if (hasSanitySource(content)) {
            await unlink(fullPath);
        }
    }
}

async function run() {
    await mkdir(outputDir, { recursive: true });

    const items = await client.fetch(query);
    if (!Array.isArray(items) || items.length === 0) {
        console.log("[sanity-sync] No published insightArticle documents found.");
        return;
    }

    let written = 0;
    const writtenSlugs = new Set();

    for (const item of items) {
        const slug = sanitizeSlug(item.slug);
        if (!slug) {
            continue;
        }

        const body = toBodyMarkdown(item.body);
        const excerpt = item.excerpt || "";
        const markdown = `---\ntitle: ${q(item.title || slug)}\nslug: ${q(slug)}\ndate: ${formatDate(item.publishedAt)}\npublishedAt: ${q(item.publishedAt || "")}\nauthor: ${q(item.author || "VL Capital Underwriting")}\ncategory: ${q(item.category || "General")}\ntags: ${yamlArray(item.tags)}\nexcerpt: ${q(excerpt)}\nsummary: ${q(excerpt)}\nlead: ${q(excerpt)}\ncoverImage: ${q(item.coverImage || "")}\ncoverImageAlt: ${q(item.coverImageAlt || item.title || "Insight cover image")}\nseoTitle: ${q(item.seoTitle || item.title || slug)}\nseoDescription: ${q(item.seoDescription || excerpt)}\nsource: "sanity"\ndraft: false\n---\n\n${body}\n`;

        const target = path.join(outputDir, `${slug}.md`);
        await writeFile(target, markdown, "utf8");
        written += 1;
        writtenSlugs.add(slug);
    }

    await pruneStaleSanityFiles(writtenSlugs);

    console.log(`[sanity-sync] Wrote ${written} insight article(s) to content/insights.`);
}

run().catch((error) => {
    console.error("[sanity-sync] Failed:", error);
    process.exitCode = 1;
});
