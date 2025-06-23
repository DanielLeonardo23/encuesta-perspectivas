# Survey Insights

An AI-powered application to analyze sentiment from survey responses and generate insightful reports.

## Features

- **Survey Input**: Enter survey responses directly into the app.
- **CSV Import**: Upload survey responses from a CSV file.
- **Sentiment Analysis**: Each response is analyzed for sentiment (positive, negative, neutral), emotional strength, and specific detected emotions using GenAI.
- **Report Generation**: Generate a comprehensive summary report that includes key metrics and suggested improvements based on the overall sentiment of the responses.
- **Data Export**: Export all analyzed data to a CSV file for offline analysis or record-keeping.
- **Data Visualization**: View analysis results for each response and summary metrics in a clean, modern interface.

## Getting Started

To get started, simply run the development server:

```bash
npm run dev
```

Then open [http://localhost:9002](http://localhost:9002) in your browser.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Genkit](https://firebase.google.com/docs/genkit)
- [Gemini API](https://ai.google.dev/)
