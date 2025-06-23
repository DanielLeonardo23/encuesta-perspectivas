# Survey Insights

Una aplicación potenciada por IA para analizar el sentimiento de respuestas de encuestas y generar informes con información útil.

## Características

- **Entrada de Encuestas**: Ingresa respuestas de encuestas directamente en la app.
- **Importación CSV**: Sube respuestas de encuestas desde un archivo CSV.
- **Análisis de Sentimiento**: Cada respuesta es analizada para detectar el sentimiento (positivo, negativo, neutral), la intensidad emocional y emociones específicas usando GenAI.
- **Generación de Informes**: Genera un informe resumen completo que incluye métricas clave y sugerencias de mejora basadas en el sentimiento general de las respuestas.
- **Exportación de Datos**: Exporta todos los datos analizados a un archivo CSV para análisis offline o para archivo.
- **Visualización de Datos**: Visualiza los resultados del análisis por respuesta y las métricas resumidas en una interfaz moderna y limpia.

## Primeros Pasos

Para comenzar, simplemente ejecuta el servidor de desarrollo:
npm run dev
```bash

Then open [http://localhost:9002](http://localhost:9002) in your browser.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Genkit](https://firebase.google.com/docs/genkit)
- [Gemini API](https://ai.google.dev/)
