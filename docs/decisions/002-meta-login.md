# ADR 002 — Escolha de login Meta

Status: proposto, não aprovado tecnicamente; depende de consulta oficial atual.

Contexto: conta profissional @odontowiener e clínica que utiliza anúncios. O MVP manual não precisa de credenciais Meta.

Alternativas a verificar:
- Instagram Login: integração centrada na conta profissional. Pode simplificar insights Instagram, mas não deve ser tratado como autorização para anúncios.
- Facebook Login: avaliar descoberta via Página e alinhamento com os ativos usados em anúncios. Exige verificar vínculos, permissões, elegibilidade e revisão na documentação vigente.

Recomendação provisória do implementador: avaliar primeiro Facebook Login pela futura Marketing API, implementando somente o fluxo escolhido. Não há decisão definitiva porque as páginas oficiais retornaram HTTP 429 nesta sessão e nenhum app/ativo foi inspecionado.

Consequência: nenhuma URL OAuth nem lista de métricas potencialmente desatualizada foi codificada como integração funcional. Retomar a fase 3 após revisão das fontes e configuração segura do aplicativo.
