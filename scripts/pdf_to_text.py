"""
PDF to clean Markdown converter optimized for LLM consumption.

Extracts text from PDFs, cleans common artifacts (headers, footers, page numbers,
broken lines), and outputs structured Markdown files.

Usage:
    python pdf_to_text.py                  # Convert all PDFs in current directory
    python pdf_to_text.py file.pdf         # Convert a single PDF
    python pdf_to_text.py --output-dir out # Specify output directory
"""

import re
import sys
from collections import Counter
from pathlib import Path

import pymupdf


def extract_pages(pdf_path: str) -> list[dict]:
    """Extract text from each page with metadata."""
    doc = pymupdf.open(pdf_path)
    pages = []
    for page_num, page in enumerate(doc, start=1):
        blocks = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, block_type)
        text_blocks = []
        for b in blocks:
            if b[6] == 0:  # text block (not image)
                text_blocks.append({
                    "text": b[4].strip(),
                    "y0": b[1],
                    "y1": b[3],
                    "x0": b[0],
                    "x1": b[2],
                })
        pages.append({
            "page_num": page_num,
            "blocks": text_blocks,
            "width": page.rect.width,
            "height": page.rect.height,
        })
    doc.close()
    return pages


def detect_headers_footers(pages: list[dict], threshold: int = 3) -> tuple[set, set]:
    """Detect repeated headers/footers that appear on many pages."""
    if len(pages) < 5:
        return set(), set()

    top_texts = Counter()
    bottom_texts = Counter()

    for p in pages:
        if not p["blocks"]:
            continue
        height = p["height"]
        # Top 12% of page
        top_blocks = [b["text"] for b in p["blocks"] if b["y0"] < height * 0.12]
        # Bottom 12% of page
        bottom_blocks = [b["text"] for b in p["blocks"] if b["y1"] > height * 0.88]

        for t in top_blocks:
            # Normalize: remove page numbers from the text for matching
            normalized = re.sub(r'\b\d{1,4}\b', '', t).strip()
            if len(normalized) > 2:
                top_texts[normalized] += 1
        for t in bottom_blocks:
            normalized = re.sub(r'\b\d{1,4}\b', '', t).strip()
            if len(normalized) > 2:
                bottom_texts[normalized] += 1

    min_appearances = max(threshold, len(pages) // 4)
    headers = {t for t, count in top_texts.items() if count >= min_appearances}
    footers = {t for t, count in bottom_texts.items() if count >= min_appearances}

    return headers, footers


def is_header_footer(text: str, headers: set, footers: set) -> bool:
    """Check if a text block matches a known header/footer pattern."""
    normalized = re.sub(r'\b\d{1,4}\b', '', text).strip()
    if normalized in headers or normalized in footers:
        return True
    # Standalone page numbers
    if re.fullmatch(r'\d{1,4}', text.strip()):
        return True
    return False


def clean_block_text(text: str) -> str:
    """Clean a single text block."""
    # Fix broken hyphenation at line ends (e.g., "pro-\ngramming" -> "programming")
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    # Join lines that are clearly part of the same paragraph
    # (line doesn't end with sentence-ending punctuation)
    lines = text.split('\n')
    merged = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            merged.append('')
            continue
        if merged and merged[-1] and not merged[-1].endswith(('.', ':', '!', '?', ';')):
            # Previous line didn't end a sentence, merge
            last = merged[-1]
            # But don't merge if current line looks like a heading or list item
            if not re.match(r'^[\u2022\-\*\d+\.\)]', line) and not line.isupper():
                merged[-1] = last + ' ' + line
                continue
        merged.append(line)

    text = '\n'.join(merged)
    # Collapse multiple spaces
    text = re.sub(r' {2,}', ' ', text)
    # Remove null/control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    return text.strip()


def looks_like_heading(text: str, block: dict, page_width: float) -> int | None:
    """Heuristic to detect if a block looks like a heading. Returns heading level or None."""
    text = text.strip()
    if not text or len(text) > 200:
        return None
    if '\n' in text and len(text.split('\n')) > 3:
        return None

    # Chapter patterns: "Chapter 1", "CHAPTER 1", "Part I"
    if re.match(r'^(chapter|part)\s+[\divxlc]+', text, re.IGNORECASE):
        return 1

    # Numbered sections: "1.2.3 Title"
    m = re.match(r'^(\d+(?:\.\d+)*)\s+\S', text)
    if m:
        depth = m.group(1).count('.') + 1
        return min(depth, 4)

    # ALL CAPS short text (likely heading)
    if text.isupper() and len(text) < 80 and not text.startswith('•'):
        return 2

    return None


def process_pdf(pdf_path: str, output_dir: str | None = None) -> str:
    """Convert a PDF to clean Markdown optimized for LLMs."""
    pdf_path = Path(pdf_path)
    print(f"Processing: {pdf_path.name}")

    # Extract
    pages = extract_pages(str(pdf_path))
    if not pages:
        print(f"  WARNING: No pages extracted from {pdf_path.name}")
        return ""

    # Detect repeated headers/footers
    headers, footers = detect_headers_footers(pages)
    if headers or footers:
        print(f"  Detected {len(headers)} header patterns, {len(footers)} footer patterns to remove")

    # Get document metadata
    doc = pymupdf.open(str(pdf_path))
    metadata = doc.metadata
    doc.close()

    # Build output
    parts = []

    # Document header with metadata
    title = metadata.get("title", "") or pdf_path.stem.replace('_', ' ')
    parts.append(f"# {title}\n")

    meta_lines = []
    if metadata.get("author"):
        meta_lines.append(f"**Author:** {metadata['author']}")
    if metadata.get("subject"):
        meta_lines.append(f"**Subject:** {metadata['subject']}")
    meta_lines.append(f"**Source file:** {pdf_path.name}")
    meta_lines.append(f"**Total pages:** {len(pages)}")
    parts.append('\n'.join(meta_lines))
    parts.append('\n---\n')

    prev_was_empty = False

    for page in pages:
        page_blocks = []
        for block in page["blocks"]:
            raw_text = block["text"]

            # Skip headers/footers
            if is_header_footer(raw_text, headers, footers):
                continue

            # Skip very short noise (standalone dots, dashes, etc.)
            if len(raw_text.strip()) <= 1 and not raw_text.strip().isalnum():
                continue

            cleaned = clean_block_text(raw_text)
            if not cleaned:
                continue

            # Check if it looks like a heading
            heading_level = looks_like_heading(cleaned, block, page["width"])
            if heading_level:
                # Remove numbering prefix for cleaner headings (optional)
                heading_text = cleaned
                page_blocks.append(f"\n{'#' * (heading_level + 1)} {heading_text}\n")
            else:
                page_blocks.append(cleaned)

        if page_blocks:
            page_text = '\n\n'.join(page_blocks)
            if page_text.strip():
                parts.append(page_text)
                prev_was_empty = False
            elif not prev_was_empty:
                prev_was_empty = True

    full_text = '\n\n'.join(parts)

    # Final cleanup passes
    # Remove excessive blank lines
    full_text = re.sub(r'\n{4,}', '\n\n\n', full_text)
    # Remove trailing whitespace on lines
    full_text = re.sub(r' +\n', '\n', full_text)

    # Write output
    if output_dir:
        out_dir = Path(output_dir)
    else:
        out_dir = pdf_path.parent / "converted_text"

    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / (pdf_path.stem + ".md")

    out_file.write_text(full_text, encoding='utf-8')
    size_kb = out_file.stat().st_size / 1024
    print(f"  -> {out_file.name} ({size_kb:.0f} KB)")
    return str(out_file)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Convert PDFs to clean Markdown for LLMs")
    parser.add_argument("files", nargs="*", help="PDF files to convert (default: all in current dir)")
    parser.add_argument("--output-dir", "-o", help="Output directory (default: ./converted_text)")
    args = parser.parse_args()

    if args.files:
        pdf_files = [Path(f) for f in args.files]
    else:
        pdf_files = sorted(Path(".").glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found.")
        sys.exit(1)

    print(f"Found {len(pdf_files)} PDF(s) to convert\n")

    results = []
    for pdf in pdf_files:
        try:
            out = process_pdf(str(pdf), args.output_dir)
            if out:
                results.append(out)
        except Exception as e:
            print(f"  ERROR processing {pdf.name}: {e}")

    print(f"\nDone! Converted {len(results)}/{len(pdf_files)} files.")
    if results:
        out_dir = Path(results[0]).parent
        print(f"Output directory: {out_dir}")


if __name__ == "__main__":
    main()
