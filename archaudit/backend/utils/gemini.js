const { GoogleGenAI } = require('@google/genai');

const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

let currentKeyIndex = 0;

async function analyzeStructure(structureJson, framework = "Generic Software Project") {
  if (apiKeys.length === 0) {
    throw new Error('Gemini API keys are not configured.');
  }

  const prompt = `You are a senior software architect specializing in ${framework}.

Analyze the following project folder structure against the strict, official best practices for ${framework}.
Provide:
1. Code organization feedback
2. Scalability issues
3. Naming convention issues
4. Missing best practice folders/files
5. Suggested improved structure
6. A "Fix-It-For-Me" bash script that the user can run to automatically create missing folders and move files to match the improved structure. Use standard bash commands (mkdir -p, mv). Make sure the script is safe to run.

Return response in JSON format with:
- score (1-10)
- issues (array of strings)
- suggestions (array of strings)
- improved_structure (object representing the new suggested tree)
- migration_script (string containing the raw bash script)

Project Structure:
${JSON.stringify(structureJson, null, 2)}`;

  let lastError;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[currentKeyIndex];
    const ai = new GoogleGenAI({ apiKey: key });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
    
    let text = response.text;
    // In case the response is wrapped in markdown formatting like ```json ... ```
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    }
    
    return JSON.parse(text);
    } catch (error) {
      console.warn(`[Gemini API] Request failed with key index ${currentKeyIndex}. Moving to next key. Error:`, error.message);
      lastError = error;
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    }
  }

  console.error('All Gemini API keys exhausted or failed.');
  throw new Error('Failed to analyze structure with Gemini. Quota limit or other error occurred on all keys.');
}

const isGeminiConfigured = apiKeys.length > 0;

module.exports = { analyzeStructure, isGeminiConfigured };
