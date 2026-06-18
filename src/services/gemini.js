const GEMINI_API_KEY_STORAGE_KEY = 'mediguardian_gemini_api_key';
const GEMINI_MODEL_STORAGE_KEY = 'mediguardian_gemini_model_name';

export function getGeminiApiKey() {
  const key = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
  return key.trim();
}

export function hasGeminiApiKey() {
  return !!getGeminiApiKey();
}

export function getGeminiModel() {
  let model = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY) || 'models/gemini-1.5-flash';
  if (!model.startsWith('models/')) {
    model = `models/${model}`;
  }
  return model;
}

async function fetchGeminiWithFallback(bodyPayload, customModel = null) {
  const apiKey = getGeminiApiKey();
  const primaryModel = customModel || getGeminiModel();
  
  // Try v1 stable first, then v1beta. Fall back to pro and next-gen flash.
  const attempts = [
    { model: primaryModel, version: 'v1' },
    { model: primaryModel, version: 'v1beta' },
    { model: 'models/gemini-1.5-pro', version: 'v1' },
    { model: 'models/gemini-1.5-pro', version: 'v1beta' },
    { model: 'models/gemini-2.5-flash', version: 'v1' }
  ];
  
  let primaryModelError = null;
  let lastError = null;

  for (let i = 0; i < attempts.length; i++) {
    const { model: activeModel, version } = attempts[i];
    const url = `https://generativelanguage.googleapis.com/${version}/${activeModel}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const message = errData?.error?.message || `API call failed with status: ${response.status}`;
        
        const isRateLimitOrHighDemand = 
          response.status === 429 || 
          response.status === 503 ||
          message.toLowerCase().includes('rate limit') ||
          message.toLowerCase().includes('exhausted') ||
          message.toLowerCase().includes('high demand') ||
          message.toLowerCase().includes('temporary');

        const isNotFoundOrSupported = 
          response.status === 404 || 
          response.status === 400 || 
          message.toLowerCase().includes('not found') || 
          message.toLowerCase().includes('not supported') ||
          message.toLowerCase().includes('unsupported');

        const errorToThrow = new Error(message);

        // Record the primary model's error (which is the user's actual target model)
        if (activeModel === primaryModel && !primaryModelError) {
          primaryModelError = errorToThrow;
        }

        if ((isRateLimitOrHighDemand || isNotFoundOrSupported) && i < attempts.length - 1) {
          console.warn(`Model ${activeModel} (${version}) failed: ${message}. Retrying fallback...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        throw errorToThrow;
      }
      return await response.json();
    } catch (err) {
      lastError = err;
      if (activeModel === primaryModel && !primaryModelError) {
        primaryModelError = err;
      }

      const message = err.message || '';
      const isRateLimitOrHighDemand = 
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('exhausted') ||
        message.toLowerCase().includes('high demand') ||
        message.toLowerCase().includes('temporary') ||
        message.toLowerCase().includes('429') ||
        message.toLowerCase().includes('503');

      const isNotFoundOrSupported = 
        message.toLowerCase().includes('not found') || 
        message.toLowerCase().includes('not supported') ||
        message.toLowerCase().includes('unsupported') ||
        message.toLowerCase().includes('404') || 
        message.toLowerCase().includes('400');

      if ((isRateLimitOrHighDemand || isNotFoundOrSupported) && i < attempts.length - 1) {
        console.warn(`Model ${activeModel} (${version}) caught error: ${message}. Retrying fallback...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      throw err;
    }
  }
  throw primaryModelError || lastError || new Error("All Gemini models are currently busy or unsupported. Please try again later.");
}

export async function askGeminiChat(messageHistory, patientContext) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please add your key in Settings.");
  }

  const model = getGeminiModel();

  const medications = patientContext?.medications || (Array.isArray(patientContext) ? patientContext : []);
  const patientInfo = patientContext?.patientInfo || {};
  const vitalsLog = patientContext?.vitalsLog || [];
  const verificationHistory = patientContext?.verificationHistory || [];

  // System instruction to guide the clinical chatbot behavior
  const systemInstruction = 
    `You are MediGuardian AI, a professional, friendly, and clinical virtual medication assistant. ` +
    `You provide personalized answers based on the medicines prescribed to the logged-in patient. ` +
    `Here is the patient's health profile, active prescriptions, and medicine packaging scans context:\n\n` +
    `Patient Name: ${patientInfo.name || 'Unknown'}\n` +
    `Age: ${patientInfo.age || 'N/A'} years\n` +
    `Attending Doctor: ${patientInfo.doctor || 'Unknown'}\n` +
    `Blood Type: ${patientInfo.bloodType || 'N/A'}\n` +
    `Height/Weight: ${patientInfo.height || 'N/A'} cm / ${patientInfo.weight || 'N/A'} kg\n` +
    `Prescribed Medications:\n${JSON.stringify(medications, null, 2)}\n\n` +
    `Recent Vitals Log Summary:\n${JSON.stringify(vitalsLog, null, 2)}\n\n` +
    `Recent Medicine Packaging Verification Scans History:\n${JSON.stringify(verificationHistory, null, 2)}\n\n` +
    `CRITICAL GUIDELINES:\n` +
    `1. ANSWER ONLY questions related directly to the patient's prescribed medications and general medication/wellness guidance (e.g., dosage instructions, administration details, side effects, missed doses, safety precautions). If the user asks a question completely unrelated to health/medicine or their prescriptions, politely decline and state that you can only assist with their prescribed medication details and general medication guidance.\n` +
    `2. PERSONALIZATION: Automatically identify which of the patient's prescribed medications is being discussed and customize your answer using their actual dosage, frequency, scheduling, doctor's guidelines, and safety warnings. E.g., if asked 'What is this medicine used for?' and Metformin is their prescribed drug, clearly answer for Metformin and include their actual prescription schedule.\n` +
    `3. PATIENT SAFETY RULES:\n` +
    `   - NEVER diagnose diseases under any circumstances.\n` +
    `   - NEVER prescribe new medications.\n` +
    `   - NEVER change the patient's dosage instructions.\n` +
    `   - ALWAYS explicitly recommend consulting their physician (specifically Dr. Sarah Jenkins or their prescribing doctor) for serious symptoms, side effects, or clinical decisions.\n` +
    `   - Keep responses clear, reassuring, structured, and easy to read (using bullet points and bold text where appropriate), which is especially helpful for elderly patients.\n` +
    `4. DISCLAIMER: Always clearly state that this information is for educational purposes and does not replace professional medical advice.\n` +
    `5. MEDICINE SCAN VERIFICATION DETAILS: You have access to the patient's scanned medicine packaging history. If the patient asks about the safety, dosage compliance, or validity of their scanned drugs (e.g., 'Is the last medicine I scanned safe to take?'), review their 'Recent Medicine Packaging Verification Scans History' to provide exact matches, warning details, and explain what matching checks failed (like wrong medicine, dosage mismatch, or expired dates).`;

  // Map messages to Gemini's format: { role: "user" | "model", parts: [{ text: "..." }] }
  const contents = messageHistory.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    }
  };

  const data = await fetchGeminiWithFallback(payload, model);
  const candidate = data.candidates?.[0];
  if (!candidate || !candidate.content?.parts?.[0]?.text) {
    throw new Error("Invalid response format received from Gemini API.");
  }

  return candidate.content.parts[0].text;
}

export async function parsePrescriptionDocument(fileBase64, mimeType) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please add your key in Settings.");
  }

  const model = getGeminiModel();

  const promptText = 
    "You are a clinical prescription parser OCR scanner. Analyze the provided prescription document (image or PDF). " +
    "Extract all relevant fields and return them strictly in the following JSON schema format. " +
    "Ensure the response is a single valid JSON object with no markdown wrapping, no backticks, and no extra text outside the JSON. " +
    "JSON Schema: \n" +
    "{\n" +
    "  \"clinic\": \"Name of the clinic or hospital (e.g. City Medical General Clinic)\",\n" +
    "  \"doctor\": \"Name of the doctor (e.g. Dr. Sarah Jenkins)\",\n" +
    "  \"date\": \"Date of prescription (e.g. MM/DD/YYYY or Today's date)\",\n" +
    "  \"medications\": [\n" +
    "    {\n" +
    "      \"name\": \"Name of the medication (e.g. Metformin)\",\n" +
    "      \"dose\": \"Dosage (e.g. 500mg, 10mg)\",\n" +
    "      \"frequency\": \"Frequency of dosage (e.g. Daily, Twice Daily)\",\n" +
    "      \"time\": \"Scheduled period, MUST be one of: Morning, Afternoon, Evening, Bedtime\",\n" +
    "      \"instructions\": \"Brief warning instructions or guidelines\",\n" +
    "      \"refills\": 3,\n" +
    "      \"doctor\": \"Name of the doctor\"\n" +
    "    }\n" +
    "  ]\n" +
    "}";

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const data = await fetchGeminiWithFallback(payload, model);
  const candidate = data.candidates?.[0];
  const responseText = candidate?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error("Could not extract text from prescription document.");
  }

  try {
    return JSON.parse(responseText.trim());
  } catch (err) {
    console.error("Failed to parse JSON response from Gemini:", responseText);
    throw new Error("Prescription parsing succeeded but output format was not valid JSON. Please try again.");
  }
}

export async function parseMedicinePackaging(fileBase64, mimeType) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please add your key in Settings.");
  }

  const model = getGeminiModel();

  const promptText = 
    "You are a clinical medicine package scanner OCR tool. Analyze the provided image of a medicine strip, box, bottle, or packaging label. " +
    "Extract all relevant information and return it strictly in the following JSON schema format. " +
    "Ensure the response is a single valid JSON object with no markdown wrapping, no backticks, and no extra text outside the JSON. " +
    "If any field is missing or unreadable, return null for it.\n" +
    "JSON Schema: \n" +
    "{\n" +
    "  \"name\": \"Name of the medication (e.g. Metformin, Paracetamol, Lisinopril)\",\n" +
    "  \"brand\": \"Brand or manufacturing name (e.g. Glucophage, Tylenol)\",\n" +
    "  \"strength\": \"Dosage strength (e.g. 500mg, 10mg, 250mcg)\",\n" +
    "  \"batchNumber\": \"Batch number (e.g. B12345)\",\n" +
    "  \"mfgDate\": \"Manufacturing date (e.g. MM/YYYY or Month YYYY)\",\n" +
    "  \"expiryDate\": \"Expiry date, normalized to standard date format like YYYY-MM-DD or Month YYYY (e.g. 2027-12-31 or March 2027)\"\n" +
    "}";

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const data = await fetchGeminiWithFallback(payload, model);
  const candidate = data.candidates?.[0];
  const responseText = candidate?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error("Could not extract text from medicine packaging.");
  }

  try {
    return JSON.parse(responseText.trim());
  } catch (err) {
    console.error("Failed to parse JSON response from Gemini:", responseText);
    throw new Error("Medicine packaging parsing succeeded but output format was not valid JSON. Please try again.");
  }
}
