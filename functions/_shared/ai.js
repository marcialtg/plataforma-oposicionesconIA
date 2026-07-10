export async function generateContent(prompt, systemInstruction, apiKey, model) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://app.oposicionesconia.com',
      'X-Title': 'Oposita',
    },
    body: JSON.stringify({
      model: model || 'google/gemini-2.0-flash-001',
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: 8192,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    let text = ''
    try { text = await res.text() } catch (_) { text = '(no body)' }
    console.error('OpenRouter response not ok:', res.status, res.statusText, text.substring(0, 500))
    throw new Error(`OpenRouter error (${res.status}): ${text.substring(0, 200)}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

export function getAIKey(env) {
  return env.OPENROUTER_API_KEY || ''
}

export function getAIModel(env) {
  return env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001'
}
