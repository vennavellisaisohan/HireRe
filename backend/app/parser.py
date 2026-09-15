"""Parse resumes and job descriptions from PDF, DOCX, or plain text."""

from __future__ import annotations

import io
import re
from pathlib import Path

from docx import Document
from pypdf import PdfReader


def parse_text(content: str) -> str:
    text = content.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return parse_text("\n".join(pages))


def parse_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return parse_text("\n".join(paragraphs))


def parse_file(filename: str, file_bytes: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        return parse_pdf(file_bytes)
    if suffix in {".docx", ".doc"}:
        return parse_docx(file_bytes)
    if suffix in {".txt", ".md", ""}:
        return parse_text(file_bytes.decode("utf-8", errors="replace"))
    raise ValueError(f"Unsupported file type: {suffix or 'unknown'}")
