// Generated from cms.config.mjs — safe to commit and customize.
import { defineCollection, z } from "astro:content";
import { jsonContentLoader, buildCollectionSchema } from "@natilon/astro-cms";
import config from "../cms.config.mjs";

export const collections = Object.fromEntries(
  Object.entries(config.collections).map(([name, col]) => [
    name,
    defineCollection({
      loader: jsonContentLoader(name),
      schema: buildCollectionSchema(col, { z }),
    }),
  ])
);
