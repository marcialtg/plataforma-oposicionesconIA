export async function generateContent(prompt, systemInstruction, apiKey, model, provider) {
  if (provider === 'google') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`
    const body = {
      contents: [{ role: 'user', parts: [{ text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      let text = ''
      try { text = await res.text() } catch (_) { text = '(no body)' }
      console.error('Gemini response not ok:', res.status, res.statusText, text.substring(0, 500))
      throw new Error(`Gemini error (${res.status}): ${text.substring(0, 200)}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://app.oposicionesconia.com',
      'X-Title': 'Oposita',
    },
    body: JSON.stringify({
      model: model || 'google/gemini-2.5-flash',
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
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
  const provider = env.AI_PROVIDER || 'openrouter'
  if (provider === 'google') return env.GOOGLE_API_KEY || ''
  return env.OPENROUTER_API_KEY || ''
}

export function getAIModel(env) {
  const provider = env.AI_PROVIDER || 'openrouter'
  if (provider === 'google') return env.GOOGLE_MODEL || 'gemini-2.5-flash'
  return env.OPENROUTER_MODEL || 'google/gemini-2.5-flash'
}

export function getAIProvider(env) {
  return env.AI_PROVIDER || 'openrouter'
}
