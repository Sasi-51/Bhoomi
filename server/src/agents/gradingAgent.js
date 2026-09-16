// Trust agent (grading half) - quality grading.
// In production this score comes from a TFLite/TinyML model running on the
// farmer's phone against the produce photo (works offline, no data leaves the
// device). This module exposes the exact same interface - three 0-100 inputs
// in, a grade out - so swapping the mock scorer for a real model is a one-line
// change in routes/listings.js, nothing else in the app needs to know.

function gradeProduce({ sizeScore, colorScore, defectScore }) {
  const composite = sizeScore * 0.3 + colorScore * 0.35 + (100 - defectScore) * 0.35;
  let grade;
  if (composite >= 85) grade = 'A';
  else if (composite >= 70) grade = 'B+';
  else if (composite >= 55) grade = 'B';
  else grade = 'C';

  return { grade, gradeScore: Number(composite.toFixed(1)) };
}

module.exports = { gradeProduce };
