# Integração oficial Meta — pendente

Este MVP não implementa OAuth, coleta oficial, sincronização ou Marketing API. Não existe botão que simule sucesso. Nenhum segredo foi fornecido. O dashboard e a importação funcionam sem Meta.

Em 26/10/2026 houve tentativa de consulta das páginas oficiais abaixo, que retornaram HTTP 429 na ferramenta de navegação. A escolha do fluxo e o registro final de métricas/permissões NÃO estão validados contra a documentação vigente. Portanto a integração permanece explicitamente planejada.

- https://developers.facebook.com/docs/instagram-platform/
- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/
- https://developers.facebook.com/docs/instagram-platform/insights/
- https://developers.facebook.com/docs/marketing-api/
- https://developers.facebook.com/docs/marketing-api/insights/

## Próxima implementação

1. Consultar novamente as referências oficiais e registrar versão, data e permissões efetivamente necessárias. Comparar Instagram Login (foco na conta Instagram) e Facebook Login (contexto de Página e futura integração de anúncios). Ver ADR 002, ainda provisório. Não assumir que acesso a Instagram autoriza anúncios.
2. Criar app Meta, configurar conta profissional, produto e redirect URI. Confirmar elegibilidade e acesso de teste/revisão na configuração efetivamente disponível. Usar HTTPS em produção.
3. Ler META_APP_ID, META_APP_SECRET e META_REDIRECT_URI apenas do servidor (.env.local). Não passar segredos ao navegador ou pedir senha do Instagram.
4. Implementar state OAuth imprevisível com cookie HttpOnly/Secure/SameSite e expiração; validar callback e conta autorizada. Guardar tokens com criptografia autenticada e chave fora do banco. TOKEN_ENCRYPTION_KEY é apenas uma reserva de configuração nesta versão.
5. Implementar cliente HTTP com validação Zod, paginação, métricas/formatos/períodos confirmados em InstagramMetricsRegistry, normalização que distingue ausência e zero, retries com backoff e erros seguros. Testar falhas e expiração com mocks de transporte explícitos.
6. Só registrar `connected` e `lastVerifiedAt` depois de consulta oficial bem-sucedida. Persistir contas, mídias, snapshots e SyncJobs, sem descartar capturas anteriores.
7. Adicionar lock por conta, idempotência, botão de sync e endpoint cron autenticado com CRON_SECRET. Definir frequência e janela de Stories a partir dos limites oficiais verificados. Cron deve rodar na hospedagem, sem depender do navegador.
8. Marketing API separada, leitura apenas, contas de anúncio autorizadas, permissões conferidas e resultados de conversa conforme definição real da API. Nenhuma alteração de campanha.

Os nomes de permissões do briefing são hipóteses a confirmar; esta versão não os solicita. Não há endpoint cron ou callback de OAuth parcialmente funcional que aceite tokens sem validação.
