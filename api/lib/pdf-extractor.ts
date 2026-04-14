/**
 * PDF Xassida Extractor
 *
 * Extracts Arabic xassida content from PDF files.
 * Identifies: author, introductory text (basmalah, dedications), and verses.
 */

// pdf-parse ships as CJS; dynamic import works with tsx + ESM
async function loadPdfParse() {
  const mod = await import('pdf-parse');
  return (mod as any).default ?? mod;
}

// ── Arabic text utilities ───────────────────────────────────────────────────

/** Check if a string contains Arabic characters */
function isArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/** Check if a line is mostly Arabic (>60% Arabic chars) */
function isMostlyArabic(line: string): boolean {
  const chars = line.replace(/\s/g, '');
  if (chars.length === 0) return false;
  const arabicChars = (chars.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  return arabicChars / chars.length > 0.6;
}

/** Remove common Arabic diacritics for comparison */
function stripDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

/** Clean up extracted text line */
function cleanLine(line: string): string {
  return line
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    // Remove page numbers
    .replace(/^\d+\s*$/, '')
    // Remove common OCR artifacts
    .replace(/[|_~`]/g, '');
}

// ── Known patterns ──────────────────────────────────────────────────────────

const BASMALAH_PATTERNS = [
  'بسم الله الرحمن الرحيم',
  'بسم الله الرّحمن الرّحيم',
  'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
  'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
];

const AUTHOR_KEYWORDS = [
  'للشيخ', 'لسيدنا', 'للإمام', 'تأليف', 'نظم', 'للعالم', 'للعلامة',
  'قصيدة', 'ديوان', 'كتاب', 'رسالة',
];

const INTRO_PATTERNS = [
  'الحمد لله', 'صلى الله عليه وسلم', 'أما بعد', 'وبعد',
  'اللهم صل', 'رب العالمين', 'الصلاة والسلام',
];

/** Common Tidiane/Senegalese sheikh names for author detection */
const KNOWN_AUTHORS = [
  'الحاج مالك سي', 'مالك سي', 'الحاج مالك',
  'أحمد بمبا', 'أحمدو بمبا', 'الشيخ أحمد بمبا',
  'إبراهيم انياس', 'الشيخ إبراهيم انياس',
  'الشيخ التجاني', 'أحمد التجاني',
  'عبد الله انياس',
];

// ── Extraction types ────────────────────────────────────────────────────────

export interface ExtractedVerse {
  verse_number: number;
  chapter_number: number;
  text_arabic: string;
  transcription?: string;
}

export interface ExtractedMetadata {
  detected_author: string | null;
  detected_title: string | null;
  introduction: string | null;
  total_pages: number;
  total_lines: number;
  raw_text: string;
}

export interface ExtractionResult {
  verses: ExtractedVerse[];
  metadata: ExtractedMetadata;
}

// ── Main extraction logic ───────────────────────────────────────────────────

/**
 * Extract xassida content from a PDF buffer.
 * Returns structured verses and detected metadata.
 */
export async function extractFromPdf(buffer: Buffer): Promise<ExtractionResult> {
  const pdfParse = await loadPdfParse();
  const parsed = await pdfParse(buffer);

  const rawText: string = parsed.text || '';
  const totalPages: number = parsed.numpages || 1;

  // Split into lines and clean
  const rawLines = rawText.split(/\n/);
  const lines = rawLines
    .map(cleanLine)
    .filter((line) => line.length > 0);

  // ── Step 1: Detect author ──────────────────────────────────
  let detectedAuthor: string | null = null;

  // Check first 15 lines for author patterns
  const headerLines = lines.slice(0, Math.min(15, lines.length));
  for (const line of headerLines) {
    // Check known author names
    for (const name of KNOWN_AUTHORS) {
      if (stripDiacritics(line).includes(stripDiacritics(name))) {
        detectedAuthor = name;
        break;
      }
    }
    if (detectedAuthor) break;

    // Check author keyword patterns (e.g., "تأليف الشيخ ...")
    for (const keyword of AUTHOR_KEYWORDS) {
      if (line.includes(keyword)) {
        // The author name is typically after the keyword
        const idx = line.indexOf(keyword);
        const afterKeyword = line.substring(idx + keyword.length).trim();
        if (afterKeyword.length > 2 && isArabic(afterKeyword)) {
          detectedAuthor = afterKeyword;
        } else {
          detectedAuthor = line; // Use the whole line as context
        }
        break;
      }
    }
    if (detectedAuthor) break;
  }

  // ── Step 2: Detect title ───────────────────────────────────
  let detectedTitle: string | null = null;

  // Title is typically the first prominent Arabic line that's not basmalah
  for (const line of headerLines) {
    const stripped = stripDiacritics(line);
    const isBasmalah = BASMALAH_PATTERNS.some((b) => stripped.includes(stripDiacritics(b)));
    if (isBasmalah) continue;

    // Skip author attribution lines
    const isAuthorLine = AUTHOR_KEYWORDS.some((k) => line.includes(k));
    if (isAuthorLine) continue;

    // Skip page numbers
    if (/^\d+$/.test(line.trim())) continue;

    // A title is a short, prominent Arabic line
    if (isMostlyArabic(line) && line.length > 3 && line.length < 120) {
      detectedTitle = line;
      break;
    }
  }

  // ── Step 3: Identify introduction vs. verses ───────────────
  let introLines: string[] = [];
  let verseStartIndex = 0;

  // Find where the introduction ends and verses begin.
  // Strategy:
  //  - Basmalah and the lines immediately following it (dedications, praise) are intro
  //  - Verses start when we see a pattern of multiple short-to-medium Arabic lines
  //    with similar structure (the rhythm of poetry)

  let foundBasmalah = false;
  let afterBasmalahCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = stripDiacritics(line);

    // Detect basmalah
    if (!foundBasmalah && BASMALAH_PATTERNS.some((b) => stripped.includes(stripDiacritics(b)))) {
      foundBasmalah = true;
      introLines.push(line);
      afterBasmalahCount = 0;
      continue;
    }

    // After basmalah, the next few lines (up to ~5) are often intro
    if (foundBasmalah && afterBasmalahCount < 5) {
      const isIntroPattern = INTRO_PATTERNS.some((p) => stripped.includes(stripDiacritics(p)));
      const isAuthorLine = AUTHOR_KEYWORDS.some((k) => line.includes(k));

      if (isIntroPattern || isAuthorLine || !isMostlyArabic(line)) {
        introLines.push(line);
        afterBasmalahCount++;
        continue;
      }
    }

    // Check if we've reached a verse-like section:
    // Consecutive Arabic lines of moderate length
    if (isMostlyArabic(line) && line.length > 5) {
      // Look ahead - if the next 3+ lines are also Arabic, we've likely hit verses
      let consecutiveArabic = 0;
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (isMostlyArabic(lines[j]) && lines[j].length > 5) {
          consecutiveArabic++;
        }
      }
      if (consecutiveArabic >= 3) {
        verseStartIndex = i;
        break;
      }
    }

    // If we haven't found verses yet, this is still intro
    if (i < 20) {
      introLines.push(line);
    }
  }

  // If no clear verse section was found, treat everything after line 5 as verses
  if (verseStartIndex === 0 && lines.length > 5) {
    verseStartIndex = Math.min(5, lines.length);
    introLines = lines.slice(0, verseStartIndex);
  } else if (verseStartIndex === 0) {
    verseStartIndex = 0;
  }

  // ── Step 4: Parse verses ───────────────────────────────────
  const verseLines = lines.slice(verseStartIndex);
  const verses: ExtractedVerse[] = [];
  let currentChapter = 1;
  let verseNumber = 1;

  // Detect chapter markers (بابٌ, فصل, الباب الأول, etc.)
  const CHAPTER_MARKERS = ['باب', 'فصل', 'الباب', 'الفصل', 'القسم'];

  for (let i = 0; i < verseLines.length; i++) {
    const line = verseLines[i];

    // Skip empty or very short lines
    if (line.length < 3) continue;

    // Skip page numbers
    if (/^\d+$/.test(line.trim())) continue;

    // Check for chapter markers
    const isChapterMarker = CHAPTER_MARKERS.some((m) => {
      const stripped = stripDiacritics(line);
      return stripped.startsWith(stripDiacritics(m)) && line.length < 60;
    });

    if (isChapterMarker) {
      if (verses.length > 0) {
        currentChapter++;
        verseNumber = 1;
      }
      continue;
    }

    // Skip non-Arabic lines (page headers, footers, numbers)
    if (!isMostlyArabic(line)) continue;

    // Check if line has a verse number prefix (e.g., "١. " or "1. " or "(1)")
    const numberedMatch = line.match(/^[\(\[]?\s*(\d+|[٠-٩]+)\s*[\.\)\]:\-]\s*/);
    if (numberedMatch) {
      const textAfter = line.substring(numberedMatch[0].length).trim();
      if (textAfter.length > 3) {
        verses.push({
          verse_number: verseNumber,
          chapter_number: currentChapter,
          text_arabic: textAfter,
        });
        verseNumber++;
        continue;
      }
    }

    // Arabic poetry often has two hemistichs per line, separated by spaces or ★ or *
    // Or each hemistich on its own line. We'll treat each meaningful Arabic line as a verse.
    // For couplet detection: if line has a clear midpoint with extra spacing
    const hemistichs = splitHemistichs(line);

    if (hemistichs.length === 2) {
      // Two hemistichs = one verse (bayt)
      verses.push({
        verse_number: verseNumber,
        chapter_number: currentChapter,
        text_arabic: `${hemistichs[0]}  ★  ${hemistichs[1]}`,
      });
      verseNumber++;
    } else if (hemistichs.length === 1 && hemistichs[0].length > 5) {
      // Check if next line might be the second hemistich of a couplet
      const nextLine = i + 1 < verseLines.length ? verseLines[i + 1] : null;

      if (nextLine && isMostlyArabic(nextLine) && nextLine.length > 5 &&
          Math.abs(nextLine.length - line.length) < line.length * 0.5) {
        // Likely a couplet split across two lines
        verses.push({
          verse_number: verseNumber,
          chapter_number: currentChapter,
          text_arabic: `${hemistichs[0]}  ★  ${cleanLine(nextLine)}`,
        });
        verseNumber++;
        i++; // Skip next line
      } else {
        // Single line verse
        verses.push({
          verse_number: verseNumber,
          chapter_number: currentChapter,
          text_arabic: hemistichs[0],
        });
        verseNumber++;
      }
    }
  }

  // ── Build result ───────────────────────────────────────────
  const introduction = introLines.length > 0 ? introLines.join('\n') : null;

  return {
    verses,
    metadata: {
      detected_author: detectedAuthor,
      detected_title: detectedTitle,
      introduction,
      total_pages: totalPages,
      total_lines: lines.length,
      raw_text: rawText,
    },
  };
}

/**
 * Split an Arabic poetry line into hemistichs.
 * Arabic poetry (بيت) has two halves (صدر و عجز) often separated by
 * extra whitespace, a star ★, asterisk *, or a tab.
 */
function splitHemistichs(line: string): string[] {
  // Try common separators
  for (const sep of ['★', '✶', '✦', '*', '۞', '﴿', '﴾', '\t']) {
    if (line.includes(sep)) {
      const parts = line.split(sep).map((p) => p.trim()).filter((p) => p.length > 2);
      if (parts.length === 2) return parts;
    }
  }

  // Try splitting by large whitespace gap (3+ spaces in the middle)
  const midGapMatch = line.match(/^(.{8,}?)\s{3,}(.{8,})$/);
  if (midGapMatch) {
    return [midGapMatch[1].trim(), midGapMatch[2].trim()];
  }

  // No split found — return as single unit
  return [line.trim()].filter((l) => l.length > 0);
}
