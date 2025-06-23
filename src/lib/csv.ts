"use client";

import type { SurveyResponse } from "./types";

/**
 * Converts an array of survey responses to a CSV string and triggers a download.
 */
export function exportToCsv(responses: SurveyResponse[]): void {
  if (responses.length === 0) return;

  const headers = [
    "text",
    "sentiment",
    "score",
    "magnitude",
    "detectedEmotions",
  ];
  
  const csvRows = [headers.join(",")];

  const escapeCsvCell = (cell: string) => {
    // If the cell contains a comma, a double quote, or a newline, enclose it in double quotes.
    if (/[",\n]/.test(cell)) {
      // Escape existing double quotes by doubling them.
      const escapedCell = cell.replace(/"/g, '""');
      return `"${escapedCell}"`;
    }
    return cell;
  };

  for (const response of responses) {
    const values = [
      escapeCsvCell(response.text),
      response.sentiment,
      response.score,
      response.magnitude,
      escapeCsvCell(response.detectedEmotions.join("; ")), // Join emotions with a semicolon
    ];
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `survey_insights_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses a CSV file and returns an array of texts from the first column.
 */
export function parseCsvToTexts(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        if (!csvText) {
          resolve([]);
          return;
        }
        
        const rows = csvText.split(/\r\n|\n/).filter(row => row.trim() !== '');
        if (rows.length === 0) {
          resolve([]);
          return;
        }

        // Heuristically detect and skip header
        const headerPattern = /text|sentiment|score|magnitude/i;
        const dataRows = headerPattern.test(rows[0]) ? rows.slice(1) : rows;

        const texts = dataRows.map(row => {
          if (!row.trim()) return '';

          // This regex handles quoted fields with commas and escaped quotes.
          // It extracts the content of the first column.
          const match = row.match(/^(?:"((?:[^"]|"")*)"|([^,]*))/);
          if (match) {
            // match[1] is for quoted content, match[2] for unquoted.
            const text = match[1] !== undefined 
              ? match[1].replace(/""/g, '"') 
              : (match[2] || '');
            return text.trim();
          }
          return '';
        }).filter(text => text); // Filter out any resulting empty strings

        resolve(texts);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file, 'UTF-8');
  });
}
