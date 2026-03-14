# OMNI Book Series Schema Documentation

## Overview

This document explains the **Book Series Role Schema** used in the OMNI writing system.
The schema defines how narrative content is structured, organized, and exported.

The design supports:

* Fiction and nonfiction books
* Multi-book series
* Parts / Acts
* Chapters and scenes
* Paragraph and dialogue blocks
* Front matter and back matter
* Flexible export to DOCX, PDF, and EPUB

The schema works with OMNI’s **node-based architecture**, where each piece of content is stored as a node with a role and metadata.

---

# Core Concepts

The schema defines four main elements:

1. **roles** – defines the types of nodes that can exist in the system
2. **starter_nodes** – default nodes created when a new universe is created
3. **allowed_children** – defines hierarchical relationships between roles
4. **metadata_definitions** – defines metadata fields allowed for each role

---

# 1. Roles

The **roles** section defines the types of nodes used in the writing hierarchy.

Each role represents a structural component of a story.

---

## universe

**Label:** Universe
**Description:** The highest level container for all story-related content.

Purpose:

* Represents the entire fictional world.
* Contains collections such as books, characters, locations, and timelines.

Example:

```
Story Universe
```

---

## collection

**Label:** Series
**Description:** A collection of related items within the universe.

Purpose:

Collections organize different types of entities:

Examples:

* Book series
* Characters
* Locations
* Timeline events

Example tree:

```
Universe
 ├── Books
 ├── Characters
 ├── Locations
 └── Timeline
```

---

## major_unit

**Label:** Book
**Description:** A single book in a series.

Purpose:

Represents an individual book inside the book collection.

Example:

```
Series
 ├── Book 1
 ├── Book 2
 └── Book 3
```

---

## book_section

**Label:** Book Section
**Description:** Logical grouping of book material.

Purpose:

Divides the book into publishing sections:

Typical sections include:

* Front Matter
* Main Matter
* Back Matter

Example:

```
Book
 ├── Front Matter
 ├── Main Matter
 └── Back Matter
```

---

## book_material

**Label:** Book Material
**Description:** Standalone non-chapter book content.

Purpose:

Represents individual items commonly found in front or back matter.

Examples:

* Cover
* Preface
* Prologue
* Epilogue
* References
* About the Author

Example:

```
Front Matter
 ├── Cover
 ├── Preface
 └── Prologue
```

---

## structural_unit

**Label:** Part
**Description:** Major structural division inside a book.

Purpose:

Used for large books divided into sections.

Examples:

```
Part I
Part II
Act I
Act II
```

Example:

```
Main Matter
 ├── Part I
 └── Part II
```

---

## atomic_unit

**Label:** Chapter
**Description:** A chapter inside a book.

Purpose:

Chapters are the main narrative units.

Example:

```
Part I
 ├── Chapter 1
 ├── Chapter 2
```

Chapters may exist:

* directly under a book
* inside a part

---

## scene

**Label:** Scene
**Description:** A scene within a chapter.

Purpose:

Scenes are smaller narrative units used for writing and analysis.

Example:

```
Chapter 3
 ├── Scene 1
 └── Scene 2
```

Scenes help with:

* pacing
* POV tracking
* AI analysis

---

## content_block

**Label:** Content Block
**Description:** The smallest narrative unit.

Purpose:

Represents the actual text elements such as:

* paragraphs
* dialogue
* narration
* description
* notes

Example:

```
Scene
 ├── Paragraph
 ├── Dialogue
 └── Narration
```

---

# 2. Starter Nodes

Starter nodes define the **initial structure created when a new universe is created**.

Example:

```
Story Universe
 ├── Books
 ├── Characters
 ├── Locations
 └── Timeline
```

These nodes ensure that users start with a consistent structure.

---

# 3. Allowed Children

The **allowed_children** section defines the hierarchical rules for node relationships.

This prevents invalid structures.

Example rules:

| Parent          | Allowed Children             |
| --------------- | ---------------------------- |
| universe        | collection                   |
| collection      | major_unit                   |
| major_unit      | book_section, part, chapter  |
| book_section    | book_material, part, chapter |
| structural_unit | chapter                      |
| atomic_unit     | scene                        |
| scene           | content_block                |

Example valid tree:

```
Book
 ├── Front Matter
 │    └── Preface
 │
 ├── Part I
 │    └── Chapter
 │         └── Scene
 │              └── Paragraph
```

---

# 4. Metadata Definitions

Metadata fields provide additional structured information for nodes.

---

## collection metadata

Used for describing a series.

Fields:

| Field   | Description         |
| ------- | ------------------- |
| genre   | genre of the series |
| themes  | thematic tags       |
| logline | short summary       |

Example:

```
Fantasy
Coming-of-age
Redemption
```

---

## major_unit metadata

Metadata for books.

Fields:

| Field       | Description         |
| ----------- | ------------------- |
| isbn        | book ISBN           |
| word_count  | total word count    |
| book_number | order in the series |

Example:

```
Book 2 of a trilogy
```

---

## book_section metadata

Defines the type of book section.

Possible values:

```
front_matter
main_matter
back_matter
```

Example:

```
Front Matter
Main Matter
Back Matter
```

---

## book_material metadata

Defines the type of material.

Possible values include:

```
cover
title_page
copyright
dedication
preface
foreword
prologue
epilogue
afterword
acknowledgements
about_author
appendix
references
glossary
```

Example:

```
Preface
```

---

## structural_unit metadata

Metadata for parts.

Fields:

| Field       | Description    |
| ----------- | -------------- |
| part_number | numeric order  |
| subtitle    | optional title |

Example:

```
Part I: The Beginning
```

---

## atomic_unit metadata

Metadata for chapters.

Fields:

| Field      | Description              |
| ---------- | ------------------------ |
| pov        | point-of-view character  |
| scene_type | narrative classification |
| word_count | word count               |

Example:

```
POV: Arya
```

---

## scene metadata

Metadata describing scene context.

Fields:

| Field              | Description                 |
| ------------------ | --------------------------- |
| location           | where the scene takes place |
| time_of_day        | morning, evening, etc       |
| characters_present | characters appearing        |
| summary            | scene summary               |

Example:

```
Location: Winterfell
```

---

## content_block metadata

Defines block-level narrative types.

Possible values:

```
paragraph
dialogue
narration
description
note
```

Additional fields:

| Field   | Description        |
| ------- | ------------------ |
| speaker | character speaking |
| emotion | emotional tone     |

Example:

```
Dialogue
Speaker: Jon
```

---

# Compile Behavior

Many roles support **compile_behavior**.

This controls how nodes appear when exporting.

Possible values:

| Behavior      | Meaning              |
| ------------- | -------------------- |
| include       | normal export        |
| exclude       | omit from export     |
| heading       | render as heading    |
| page_break    | start new page       |
| section_break | new document section |

Example:

```
Part I
→ page_break
```

---

# Example Full Book Structure

```
Universe
 └── Series
      └── Book
           ├── Front Matter
           │    ├── Cover
           │    ├── Preface
           │    └── Prologue
           │
           ├── Main Matter
           │    ├── Part I
           │    │    └── Chapter 1
           │    │         └── Scene
           │    │              ├── Paragraph
           │    │              └── Dialogue
           │    │
           │    └── Chapter 2
           │
           └── Back Matter
                ├── Epilogue
                ├── References
                └── About the Author
```

---

# Benefits of This Schema

This structure enables OMNI to support:

* Professional book writing
* Structured storytelling
* AI scene analysis
* Character detection
* Timeline extraction
* Clean export pipelines
* Multi-format publishing

Supported outputs include:

* DOCX
* PDF
* EPUB
* HTML

---

# Summary

The OMNI Book Series Schema provides a flexible, scalable structure for managing narrative content.

It models books the same way professional publishing systems do, while remaining compatible with OMNI's node-based architecture.

The hierarchy enables both **creative writing workflows** and **structured data analysis**, making it suitable for:

* novel writing
* academic publishing
* nonfiction books
* AI-assisted storytelling
