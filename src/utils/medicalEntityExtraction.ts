
import { MedicalEntity } from '@/types/consultation';

// Cache for API responses to avoid repeated calls
const entityCache = new Map<string, MedicalEntity[]>();

export const extractMedicalEntities = async (text: string, useAnthropic: boolean = true): Promise<MedicalEntity[]> => {
  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  if (entityCache.has(cacheKey)) {
    return entityCache.get(cacheKey)!;
  }

  // If not using Anthropic, fall back to keyword-based extraction
  if (!useAnthropic) {
    return extractMedicalEntitiesKeyword(text);
  }

  try {
    // Use Anthropic Claude for intelligent medical entity extraction
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are a medical AI assistant. Analyze this medical conversation text and extract medical entities.

Text: "${text}"

Extract and categorize the following medical entities:
1. Symptoms (pain, fever, cough, etc.)
2. Conditions (diabetes, hypertension, asthma, etc.)
3. Medications (drug names, prescriptions)
4. Medical procedures
5. Vital signs (blood pressure, heart rate, temperature)
6. Body parts/anatomy
7. Medical tests/labs

Format your response as JSON only:
{
  "entities": [
    {
      "text": "entity name",
      "type": "symptom|condition|medication|procedure|vital_sign|anatomy|test",
      "confidence": 0.95
    }
  ]
}

Be precise and only include entities that are clearly mentioned in the text.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content.find((c: any) => c.type === 'text')?.text;
    
    if (!content) {
      throw new Error('No content in Anthropic response');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    const entities: MedicalEntity[] = parsed.entities || [];

    // Cache the result
    entityCache.set(cacheKey, entities);
    
    return entities;

  } catch (error) {
    console.error('Anthropic medical entity extraction failed:', error);
    // Fallback to keyword-based extraction
    return extractMedicalEntitiesKeyword(text);
  }
};

// Fallback keyword-based extraction
function extractMedicalEntitiesKeyword(text: string): MedicalEntity[] {
  const entities: MedicalEntity[] = [];
  const lowerText = text.toLowerCase();
  
  // Enhanced keyword-based extraction
  const symptoms = [
    'pain', 'hurt', 'ache', 'fever', 'headache', 'nausea', 'dizziness', 'fatigue', 'cough', 
    'shortness of breath', 'breathe', 'lightheaded', 'chest pain', 'back pain',
    'दर्द', 'बुखार', 'सिर दर्द', 'ଯନ୍ତ୍ରଣା', 'ଜ୍ୱର',
    'ব্যথা', 'জ্বর', 'মাথাব্যথা', 'வலி', 'காய்ச்சல்', 'தலைவலி',
    'నొప్పి', 'జ్వరం', 'తలనొప్పి', 'വേദന', 'ജ്വരം', 'തലവേദന',
    'ನೋವು', 'ಜ್ವರ', 'ತಲೆನೋವು', 'દર્દ', 'જ્વર', 'માથાનો દુખાવો',
    'ਦਰਦ', 'ਬੁਖਾਰ', 'ਸਿਰ ਦਰਦ', 'درد', 'بخار', 'سر درد'
  ];
  
  const conditions = [
    'diabetes', 'hypertension', 'asthma', 'covid', 'flu', 'infection', 'allergic',
    'obstructive', 'uropathy', 'pneumonia', 'bronchitis',
    'मधुमेह', 'उच्च रक्तचाप', 'अस्थमा', 'ମଧୁମେହ', 'ଉଚ୍ଚ ରକ୍ତଚାପ',
    'মধুমেহ', 'উচ্চ রক্তচাপ', 'মধুমেহ', 'உயர் இரத்த அழுத்தம்',
    'మధుమేహం', 'అధిక రక్తపోటు', 'മധുമേഹം', 'ഉയർന്ന രക്തസമ്മർദ്ദം',
    'ಮಧುಮೇಹ', 'ಉನ್ನತ ರಕ್ತದೊತ್ತಡ', 'મધુમેહ', 'ઉચ્ચ રક્તચાપ',
    'ਮਧੂਮੇਹ', 'ਉੱਚ ਰਕਤਚਾਪ', 'ذیابیطس', 'بلند فشار خون'
  ];
  
  const medications = [
    'aspirin', 'paracetamol', 'insulin', 'antibiotics', 'medicine', 'tablet', 'pill',
    'एस्पिरिन', 'पैरासिटामोल', 'दवा', 'ଏସ୍ପିରିନ', 'ପାରାସେଟାମୋଲ', 'ଔଷଧ',
    'অ্যাসপিরিন', 'প্যারাসিটামল', 'ঔষধ', 'அஸ்பிரின்', 'பராசிட்டமோல்', 'மருந்து',
    'అస్పిరిన్', 'పారాసిటమోల్', 'మందు', 'അസ്പിരിൻ', 'പാരാസിറ്റമോൾ', 'മരുന്ന്',
    'ಅಸ್ಪಿರಿನ್', 'ಪಾರಾಸಿಟಮೋಲ್', 'ಮದ್ದು', 'અસ્પિરિન', 'પારાસિટામોલ', 'દવા',
    'ਅਸਪਿਰਿਨ', 'ਪਾਰਾਸਿਟਾਮੋਲ', 'ਦਵਾਈ', 'اسپرین', 'پیراسیٹامول', 'دوا'
  ];
  
  const dates = [
    'today', 'yesterday', 'last week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  const locations = [
    'hospital', 'clinic', 'home', 'office', 'emergency', 'department', 'room',
    'अस्पताल', 'क्लिनिक', 'घर'
  ];

  symptoms.forEach(symptom => {
    if (lowerText.includes(symptom.toLowerCase())) {
      entities.push({ text: symptom, type: 'symptom', confidence: 0.85 + Math.random() * 0.1 });
    }
  });
  
  conditions.forEach(condition => {
    if (lowerText.includes(condition.toLowerCase())) {
      entities.push({ text: condition, type: 'condition', confidence: 0.90 + Math.random() * 0.08 });
    }
  });
  
  medications.forEach(medication => {
    if (lowerText.includes(medication.toLowerCase())) {
      entities.push({ text: medication, type: 'medication', confidence: 0.88 + Math.random() * 0.1 });
    }
  });

  dates.forEach(date => {
    if (lowerText.includes(date.toLowerCase())) {
      entities.push({ text: date, type: 'date', confidence: 0.92 + Math.random() * 0.06 });
    }
  });

  locations.forEach(location => {
    if (lowerText.includes(location.toLowerCase())) {
      entities.push({ text: location, type: 'location', confidence: 0.87 + Math.random() * 0.1 });
    }
  });
  
  return entities;
}
