/// <reference path="../pb_data/types.d.ts" />

migrate((db) => {
  // Works collection
  const works = new Collection({
    name: "works",
    type: "base",
    schema: [
      { name: "title", type: "text", required: true, options: { min: 1, max: 200 } },
      { name: "genres", type: "text", options: { max: 200 } },
      { name: "totalWords", type: "number" },
      { name: "progress", type: "number" },
      { name: "cover", type: "text", options: { max: 500 } },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  db.save(works);

  // Volumes collection
  const volumes = new Collection({
    name: "volumes",
    type: "base",
    schema: [
      { name: "work", type: "relation", required: true, options: { collectionId: works.id, maxSelect: 1 } },
      { name: "title", type: "text", required: true, options: { max: 200 } },
      { name: "sortOrder", type: "number" },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  db.save(volumes);

  // Chapters collection
  const chapters = new Collection({
    name: "chapters",
    type: "base",
    schema: [
      { name: "work", type: "relation", required: true, options: { collectionId: works.id, maxSelect: 1 } },
      { name: "volume", type: "relation", options: { collectionId: volumes.id, maxSelect: 1 } },
      { name: "title", type: "text", options: { max: 200 } },
      { name: "content", type: "text" },
      { name: "wordCount", type: "number" },
      { name: "chapterNumber", type: "number" },
      { name: "sortOrder", type: "number" },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  db.save(chapters);

  // Characters collection
  const characters = new Collection({
    name: "characters",
    type: "base",
    schema: [
      { name: "work", type: "relation", required: true, options: { collectionId: works.id, maxSelect: 1 } },
      { name: "name", type: "text", required: true, options: { max: 100 } },
      { name: "gender", type: "text", options: { max: 10 } },
      { name: "age", type: "number" },
      { name: "identity", type: "text", options: { max: 200 } },
      { name: "faction", type: "text", options: { max: 100 } },
      { name: "personality", type: "text" },
      { name: "role", type: "text", options: { max: 20 } },
      { name: "ability", type: "text" },
      { name: "appearance", type: "text" },
      { name: "background", type: "text" },
      { name: "motivation", type: "text" },
      { name: "arc", type: "text" },
      { name: "debutChapter", type: "text", options: { max: 100 } },
      { name: "status", type: "text", options: { max: 20 } },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  db.save(characters);

  // World nodes collection
  const worldNodes = new Collection({
    name: "world_nodes",
    type: "base",
    schema: [
      { name: "work", type: "relation", required: true, options: { collectionId: works.id, maxSelect: 1 } },
      { name: "parent", type: "relation", options: { collectionId: "self", maxSelect: 1 } },
      { name: "name", type: "text", required: true, options: { max: 200 } },
      { name: "category", type: "text", options: { max: 50 } },
      { name: "status", type: "text", options: { max: 50 } },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  db.save(worldNodes);

  // AI configs collection
  const aiConfigs = new Collection({
    name: "ai_configs",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true, options: { max: 100 } },
      { name: "baseUrl", type: "text", required: true, options: { max: 500 } },
      { name: "apiKey", type: "text", required: true, options: { max: 500 } },
      { name: "model", type: "text", required: true, options: { max: 200 } },
      { name: "isDefault", type: "bool" },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });
  db.save(aiConfigs);
}, (db) => {
  // Rollback
  const collections = ["ai_configs", "world_nodes", "characters", "chapters", "volumes", "works"];
  for (const name of collections) {
    const c = db.findCollectionByNameOrId(name);
    if (c) db.delete(c);
  }
});
