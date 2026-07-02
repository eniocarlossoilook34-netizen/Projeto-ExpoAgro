export const scenarioData = {
  0: {
    title: "ESTADO ATUAL: ANTES DO CERCAMENTO",
    subtitle: "CENÁRIO BASE DE MONITORAMENTO",
    kpis: [
      { label: "Terreno_Base", value: "34.2 Hectares" },
      { label: "Risco_Erosão", value: "MÉDIO/ALTO", color: "text-red-400" },
      { label: "Vazão_Estimada", value: "0.12 m³/s", color: "text-yellow-400" }
    ],
    bullets: [
      "Sem barreiras físicas.",
      "Fluxo de água não controlado.",
      "Pastejo extensivo e disperso.",
      "Vulnerabilidade a escoamento superficial."
    ]
  },
  1: {
    title: "ESTADO ATUAL: DEPOIS DO CERCAMENTO",
    subtitle: "GESTÃO INTEGRADA",
    kpis: [
      { label: "Efetividade_Manejo", value: "96%", color: "text-cyan-400" },
      { label: "Área_Recarga", value: "PROTEGIDA", color: "text-green-400" },
      { label: "Vazão_Controlada", value: "0.12 m³/s - ESTÁVEL", color: "text-cyan-400" }
    ],
    bullets: [
      "Cercas de manejo rotacionado implantadas.",
      "Fluxo de água segmentado e controlado.",
      "Pastejo intensivo por talhões.",
      "Proteção de áreas de recarga."
    ]
  }
};