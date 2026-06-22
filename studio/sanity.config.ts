import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

const projectId =
    (import.meta as { env?: Record<string, string> }).env
        ?.SANITY_STUDIO_PROJECT_ID ?? "obk9nkvw";

const dataset =
    (import.meta as { env?: Record<string, string> }).env
        ?.SANITY_STUDIO_DATASET ?? "production";

export default defineConfig({
    name: "vlcm-studio",
    title: "VL Capital Management — Studio",
    basePath: "/studio",

    projectId,
    dataset,

    plugins: [
        structureTool({
            structure: (S) =>
                S.list()
                    .title("Content")
                    .items([
                        S.listItem()
                            .title("Blog Posts")
                            .icon(() => "📝")
                            .child(
                                S.documentTypeList("post")
                                    .title("Blog Posts")
                                    .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
                            ),
                        S.divider(),
                        S.listItem()
                            .title("Categories")
                            .icon(() => "🗂️")
                            .child(
                                S.documentTypeList("category")
                                    .title("Categories")
                                    .defaultOrdering([{ field: "title", direction: "asc" }])
                            ),
                        S.listItem()
                            .title("Authors")
                            .icon(() => "👤")
                            .child(
                                S.documentTypeList("author")
                                    .title("Authors")
                                    .defaultOrdering([{ field: "name", direction: "asc" }])
                            ),
                    ]),
        }),
        visionTool(),
    ],

    schema: {
        types: schemaTypes,
    },
});
