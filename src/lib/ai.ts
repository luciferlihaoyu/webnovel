import { pb } from './pb'

export const ANTI_AI_RULES = `写作规则（必须遵守）：
- 禁用词：不禁、不仅仅、不仅...而且、值得注意的是、需要强调的是、需要指出的是、总而言之、综上所述、可以说、毋庸置疑、毫无疑问、事实上、实际上、本质上、归根结底、从某种意义上
- 禁用句式：禁止三段式结尾排比、破折号过度使用、否定式排比
- 对话比例：文字中对话占比不低于30%
- 句式多样性：避免连续3句以上用相同句式开头
- 文风：口语化、简洁、有画面感，不要抒情散文体`

export async function getAIConfig() {
  const configs = await pb.collection('ai_configs').getFullList({ filter: 'isDefault=true' })
  const config = configs[0] || (await pb.collection('ai_configs').getFullList())[0]
  if (!config) throw new Error('请先在设置中配置 AI')
  return config
}

export async function aiChat(prompt: string, temperature = 0.8): Promise<string> {
  const config = await getAIConfig()
  const resp = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature }),
  })
  const data = await resp.json()
  return data.choices?.[0]?.message?.content || '生成失败'
}
