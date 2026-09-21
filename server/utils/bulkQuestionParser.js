/**
 * Utility to parse and validate bulk raw text containing MCQs.
 * Example format:
 * Question 1: What is recruitment?
 * A. Option A
 * B. Option B
 * C. Option C
 * D. Option D
 * Answer: B
 */

function parseBulkQuestions(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  // Normalize line endings
  const text = rawText.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  // Split by Question pattern or blank lines preceding "Question", "Q1:", or numbers
  // Strategy: match blocks that start with (Question X|Q X|\d+[\.:])
  const blockRegex = /(?:^|\n+)(?=(?:Question\s*\d*[:\.\s]|Q\d*[:\.\s]|\d+[\.:]))/gi;
  let rawBlocks = text.split(blockRegex).map(b => b.trim()).filter(Boolean);

  // Fallback: If split by regex yields only 1 block or nothing matching "Question", try double line break split
  if (rawBlocks.length <= 1 && !/(?:Question|Q\d+)/i.test(text)) {
    rawBlocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  }

  const results = [];

  rawBlocks.forEach((block, index) => {
    const qNum = index + 1;
    const errors = [];

    // Parse question text: before option A
    let questionText = '';
    let optionA = '';
    let optionB = '';
    let optionC = '';
    let optionD = '';
    let correctAnswer = '';

    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

    let currentSection = 'question';
    let difficulty = 'Medium';
    let explanation = '';

    for (let line of lines) {
      if (/^A[\.\:]\s*/i.test(line)) {
        currentSection = 'optionA';
        optionA = line.replace(/^A[\.\:]\s*/i, '').trim();
      } else if (/^B[\.\:]\s*/i.test(line)) {
        currentSection = 'optionB';
        optionB = line.replace(/^B[\.\:]\s*/i, '').trim();
      } else if (/^C[\.\:]\s*/i.test(line)) {
        currentSection = 'optionC';
        optionC = line.replace(/^C[\.\:]\s*/i, '').trim();
      } else if (/^D[\.\:]\s*/i.test(line)) {
        currentSection = 'optionD';
        optionD = line.replace(/^D[\.\:]\s*/i, '').trim();
      } else if (/^(?:Answer|Ans|Correct Answer)[\.\:]\s*/i.test(line)) {
        currentSection = 'answer';
        const match = line.match(/(?:Answer|Ans|Correct Answer)[\.\:]\s*([A-Da-d])/i);
        if (match) {
          correctAnswer = match[1].toUpperCase();
        } else {
          const val = line.replace(/^(?:Answer|Ans|Correct Answer)[\.\:]\s*/i, '').trim().toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(val)) {
            correctAnswer = val;
          }
        }
      } else if (/^(?:Difficulty|Level)[\.\:]\s*/i.test(line)) {
        currentSection = 'difficulty';
        const diffVal = line.replace(/^(?:Difficulty|Level)[\.\:]\s*/i, '').trim();
        if (/easy/i.test(diffVal)) difficulty = 'Easy';
        else if (/hard/i.test(diffVal)) difficulty = 'Hard';
        else difficulty = 'Medium';
      } else if (/^(?:Explanation|Rationale|Reason)[\.\:]\s*/i.test(line)) {
        currentSection = 'explanation';
        explanation = line.replace(/^(?:Explanation|Rationale|Reason)[\.\:]\s*/i, '').trim();
      } else {
        // Append text to current section
        if (currentSection === 'question') {
          if (questionText) questionText += ' ' + line;
          else questionText = line;
        } else if (currentSection === 'optionA') {
          optionA += ' ' + line;
        } else if (currentSection === 'optionB') {
          optionB += ' ' + line;
        } else if (currentSection === 'optionC') {
          optionC += ' ' + line;
        } else if (currentSection === 'optionD') {
          optionD += ' ' + line;
        } else if (currentSection === 'explanation') {
          explanation += ' ' + line;
        }
      }
    }

    // Clean up Question title prefix like "Question 1:", "1.", "Q1:"
    questionText = questionText.replace(/^(?:Question\s*\d*[:\.\s]*|Q\d*[:\.\s]*|\d+[\.:]\s*)/i, '').trim();

    // Validation
    if (!questionText) {
      errors.push('Missing question text');
    }
    if (!optionA) {
      errors.push('Missing Option A');
    }
    if (!optionB) {
      errors.push('Missing Option B');
    }
    if (!optionC) {
      errors.push('Missing Option C');
    }
    if (!optionD) {
      errors.push('Missing Option D');
    }
    if (!correctAnswer || !['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      errors.push('Missing or invalid correct answer (must be A, B, C, or D)');
    }

    results.push({
      questionNumber: qNum,
      question: questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      difficulty,
      explanation,
      isValid: errors.length === 0,
      errors
    });
  });

  return results;
}

module.exports = {
  parseBulkQuestions
};
