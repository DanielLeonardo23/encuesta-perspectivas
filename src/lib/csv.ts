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
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

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
 * Parses a single-column CSV file and returns an array of texts.
 */
export function parseCsvToTexts(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          resolve([]);
          return;
        }
        // Simple parser: split by new line, assumes first column is the text.
        // This is a basic implementation and does not handle complex CSV with escaped quotes.
        const rows = text.split(/\r\n|\n/);
        
        // Remove header if it exists and filter out empty lines.
        const dataRows = rows.slice(1).filter(row => row.trim() !== '');

        // If after removing header there are no rows, maybe there was no header
        const texts = (dataRows.length > 0 ? dataRows : rows.filter(row => row.trim() !== '')).map(row => {
          // Get content of the first column
           const firstCol = row.split(',')[0];
           // Remove quotes if they exist
           return firstCol.replace(/^"|"$/g, '').trim();
        });

        resolve(texts);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file);
  });
}
