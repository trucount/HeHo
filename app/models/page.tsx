import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const aiModels = [
  // Free Tier - Tier 1
  {
    name: "Meta: Llama 3.3 70B Instruct",
    id: "meta-llama/llama-3.3-70b-instruct:free",
    provider: "Meta",
    contextSize: "131,072",
    bestFor: "General purpose, long context",
  },
  {
    name: "Google: Gemini 2.0 Flash Experimental",
    id: "google/gemini-2.0-flash-exp:free",
    provider: "Google",
    contextSize: "1,048,576",
    bestFor: "Long-context reasoning",
  },
  {
    name: "Mistral: Mistral Small 3.1 24B",
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    provider: "Mistral",
    contextSize: "128,000",
    bestFor: "Fast, efficient",
  },
  {
    name: "Google: Gemma 3 12B",
    id: "google/gemma-3-12b-it:free",
    provider: "Google",
    contextSize: "32,768",
    bestFor: "Lightweight, fast",
  },
  {
    name: "Meta: Llama 3.1 405B Instruct",
    id: "meta-llama/llama-3.1-405b-instruct:free",
    provider: "Meta",
    contextSize: "131,072",
    bestFor: "Complex reasoning",
  },
  {
    name: "Nous: Hermes 3 405B Instruct",
    id: "nousresearch/hermes-3-llama-3.1-405b:free",
    provider: "Nous",
    contextSize: "131,072",
    bestFor: "Instruction following",
  },
  {
    name: "Google: Gemma 3 27B",
    id: "google/gemma-3-27b-it:free",
    provider: "Google",
    contextSize: "131,072",
    bestFor: "Balanced performance",
  },
  {
    name: "Google: Gemma 3 4B",
    id: "google/gemma-3-4b-it:free",
    provider: "Google",
    contextSize: "32,768",
    bestFor: "Quick responses",
  },
  {
    name: "Qwen: Qwen2.5-VL 7B Instruct",
    id: "qwen/qwen-2.5-vl-7b-instruct:free",
    provider: "Qwen",
    contextSize: "32,768",
    bestFor: "Vision tasks",
  },
  {
    name: "Qwen: Qwen3 4B",
    id: "qwen/qwen3-4b:free",
    provider: "Qwen",
    contextSize: "40,960",
    bestFor: "Compact model",
  },

  // Free Tier - Tier 2
  {
    name: "Mistral: Mistral 7B Instruct",
    id: "mistralai/mistral-7b-instruct:free",
    provider: "Mistral",
    contextSize: "32,768",
    bestFor: "Fast responses",
  },
  {
    name: "Qwen: Qwen3 Coder 480B",
    id: "qwen/qwen3-coder:free",
    provider: "Qwen",
    contextSize: "262,000",
    bestFor: "Code generation",
  },
  {
    name: "Z.AI: GLM 4.5 Air",
    id: "z-ai/glm-4.5-air:free",
    provider: "Z.AI",
    contextSize: "131,072",
    bestFor: "Chinese/English",
  },
  {
    name: "MoonshotAI: Kimi K2 0711",
    id: "moonshotai/kimi-k2:free",
    provider: "MoonshotAI",
    contextSize: "32,768",
    bestFor: "Knowledge base",
  },
  {
    name: "DeepSeek: R1 0528",
    id: "deepseek/deepseek-r1-0528:free",
    provider: "DeepSeek",
    contextSize: "163,840",
    bestFor: "Reasoning tasks",
  },
  {
    name: "TNG: DeepSeek R1T Chimera",
    id: "tngtech/deepseek-r1t-chimera:free",
    provider: "TNG",
    contextSize: "163,840",
    bestFor: "Advanced reasoning",
  },
  {
    name: "TNG: DeepSeek R1T2 Chimera",
    id: "tngtech/deepseek-r1t2-chimera:free",
    provider: "TNG",
    contextSize: "163,840",
    bestFor: "Latest R1T2",
  },
  {
    name: "Venice: Uncensored Dolphin Mistral",
    id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    provider: "Venice",
    contextSize: "32,768",
    bestFor: "Uncensored responses",
  },
  {
    name: "Google: Gemma 3n 2B",
    id: "google/gemma-3n-e2b-it:free",
    provider: "Google",
    contextSize: "8,192",
    bestFor: "Ultra-lightweight",
  },
  {
    name: "Google: Gemma 3n 4B",
    id: "google/gemma-3n-e4b-it:free",
    provider: "Google",
    contextSize: "8,192",
    bestFor: "Minimal footprint",
  },

  // Advanced Free Models
  {
    name: "AllenAI: Olmo 3.1 32B Think",
    id: "allenai/olmo-3.1-32b-think:free",
    provider: "AllenAI",
    contextSize: "65,536",
    bestFor: "Thinking model",
  },
  {
    name: "AllenAI: Olmo 3 32B Think",
    id: "allenai/olmo-3-32b-think:free",
    provider: "AllenAI",
    contextSize: "65,536",
    bestFor: "Reasoning",
  },
  {
    name: "Xiaomi: MiMo-V2-Flash",
    id: "xiaomi/mimo-v2-flash:free",
    provider: "Xiaomi",
    contextSize: "262,144",
    bestFor: "Multimodal",
  },
  {
    name: "NVIDIA: Nemotron 3 Nano 30B",
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    provider: "NVIDIA",
    contextSize: "256,000",
    bestFor: "Efficient reasoning",
  },
  {
    name: "Mistral: Devstral 2512",
    id: "mistralai/devstral-2512:free",
    provider: "Mistral",
    contextSize: "262,144",
    bestFor: "Developer tasks",
  },
  {
    name: "Nex AGI: DeepSeek V3.1 Nex N1",
    id: "nex-agi/deepseek-v3.1-nex-n1:free",
    provider: "Nex AGI",
    contextSize: "131,072",
    bestFor: "Latest model",
  },
  {
    name: "Arcee AI: Trinity Mini",
    id: "arcee-ai/trinity-mini:free",
    provider: "Arcee AI",
    contextSize: "131,072",
    bestFor: "Compact",
  },
  {
    name: "Kwaipilot: KAT-Coder-Pro V1",
    id: "kwaipilot/kat-coder-pro:free",
    provider: "Kwaipilot",
    contextSize: "256,000",
    bestFor: "Code generation",
  },
  {
    name: "NVIDIA: Nemotron Nano 12B V2 VL",
    id: "nvidia/nemotron-nano-12b-v2-vl:free",
    provider: "NVIDIA",
    contextSize: "128,000",
    bestFor: "Vision+Language",
  },
  {
    name: "Alibaba: Tongyi DeepResearch 30B",
    id: "alibaba/tongyi-deepresearch-30b-a3b:free",
    provider: "Alibaba",
    contextSize: "131,072",
    bestFor: "Research tasks",
  },
  {
    name: "NVIDIA: Nemotron Nano 9B V2",
    id: "nvidia/nemotron-nano-9b-v2:free",
    provider: "NVIDIA",
    contextSize: "128,000",
    bestFor: "Lightweight",
  },
  {
    name: "OpenAI: GPT-OSS 120B",
    id: "openai/gpt-oss-120b:free",
    provider: "OpenAI",
    contextSize: "131,072",
    bestFor: "General purpose",
  },
  {
    name: "OpenAI: GPT-OSS 20B",
    id: "openai/gpt-oss-20b:free",
    provider: "OpenAI",
    contextSize: "131,072",
    bestFor: "Compact",
  },
]

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-5xl font-bold text-foreground mb-6 text-center">35+ Free AI Models</h1>
          <p className="text-lg text-muted-foreground text-center mb-4">
            Powered by OpenRouter - All completely free, all available right now
          </p>
          <p className="text-sm text-muted-foreground text-center mb-16">
            Switch between models anytime in your chatbot settings. No cost, no limits.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiModels.map((model) => (
              <Card
                key={model.id}
                className="p-4 border-border/50 bg-card/50 hover:border-white/30 hover:bg-card/80 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-sm">{model.name}</h3>
                    <p className="text-xs text-muted-foreground">{model.provider}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Free
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{model.bestFor}</p>
                <p className="text-xs text-muted-foreground">Context: {model.contextSize}</p>
              </Card>
            ))}
          </div>

          <div className="mt-16 p-8 bg-white/5 border border-white/20 rounded-lg">
            <h2 className="text-2xl font-bold text-foreground mb-4">Recommendations</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                • <strong className="text-foreground">Llama 3.3 70B</strong> - Best general-purpose choice
              </li>
              <li>
                • <strong className="text-foreground">Gemini 2.0 Flash</strong> - Fastest responses, handles long
                context
              </li>
              <li>
                • <strong className="text-foreground">Mistral Small 3.1</strong> - Efficient, quick responses
              </li>
              <li>
                • <strong className="text-foreground">Qwen3 Coder</strong> - Best for code generation tasks
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
