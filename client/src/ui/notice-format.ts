import { tr } from '../../../shared/i18n';

/**
 * Traduz textos de avisos vindos do servidor.
 * Caso o servidor tenha gerado o aviso no idioma padrão (PT-BR) antes da sincronização de locale,
 * os padrões conhecidos são reconhecidos e traduzidos para o idioma do cliente via tr().
 */
export function formatNoticeText(text: string): string {
  let m: RegExpMatchArray | null;

  // 👋 {0} chegou em {1}{2}
  if ((m = text.match(/^👋 (.+?) chegou em (.+?)( \([^)]+\))?$/))) {
    return tr('👋 {0} chegou em {1}{2}', [m[1], m[2], m[3] || '']);
  }
  // ⏳ {0} está esperando o shell em {1}{2}
  if ((m = text.match(/^⏳ (.+?) está esperando o shell em (.+?)(: .+)?$/))) {
    return tr('⏳ {0} está esperando o shell em {1}{2}', [m[1], m[2], m[3] || '']);
  }
  // ✋ {0} precisa de você em {1}: {2}
  if ((m = text.match(/^✋ (.+?) precisa de você em (.+?): (.+)$/))) {
    return tr('✋ {0} precisa de você em {1}: {2}', [m[1], m[2], m[3]]);
  }
  // ✅ {0} concluiu em {1}
  if ((m = text.match(/^✅ (.+?) concluiu em (.+)$/))) {
    return tr('✅ {0} concluiu em {1}', [m[1], m[2]]);
  }
  // 🚪 {0} encerrou a sessão
  if ((m = text.match(/^🚪 (.+?) encerrou a sessão$/))) {
    return tr('🚪 {0} encerrou a sessão', [m[1]]);
  }
  // 📦 {0} entregou {1} para {2}
  if ((m = text.match(/^📦 (.+?) entregou (.+?) para (.+)$/))) {
    return tr('📦 {0} entregou {1} para {2}', [m[1], m[2], m[3]]);
  }
  // 🏗️ Nova sala: {0}
  if ((m = text.match(/^🏗️ Nova sala: (.+)$/))) {
    return tr('🏗️ Nova sala: {0}', [m[1]]);
  }
  // ✅ {0}: shell terminou em {1} — {2}
  if ((m = text.match(/^✅ (.+?): shell terminou em (.+?) — (.+)$/))) {
    return tr('✅ {0}: shell terminou em {1} — {2}', [m[1], m[2], m[3]]);
  }
  // ❌ {0}: shell falhou em {1} — {2}
  if ((m = text.match(/^❌ (.+?): shell falhou em (.+?) — (.+)$/))) {
    return tr('❌ {0}: shell falhou em {1} — {2}', [m[1], m[2], m[3]]);
  }
  // ❓ {0} tem uma pergunta em {1}: {2}
  if ((m = text.match(/^❓ (.+?) tem uma pergunta em (.+?): (.+)$/))) {
    return tr('❓ {0} tem uma pergunta em {1}: {2}', [m[1], m[2], m[3]]);
  }
  // 🔐 {0} pede permissão em {1}: {2}
  if ((m = text.match(/^🔐 (.+?) pede permissão em (.+?): (.+)$/))) {
    return tr('🔐 {0} pede permissão em {1}: {2}', [m[1], m[2], m[3]]);
  }
  // ✏️ {0} mudou de visual em {1}
  if ((m = text.match(/^✏️ (.+?) mudou de visual em (.+)$/))) {
    return tr('✏️ {0} mudou de visual em {1}', [m[1], m[2]]);
  }
  // ✏️ {0} agora é {1} em {2}
  if ((m = text.match(/^✏️ (.+?) agora é (.+?) em (.+)$/))) {
    return tr('✏️ {0} agora é {1} em {2}', [m[1], m[2], m[3]]);
  }
  // GitHub: 🎉 {0} abriu {1} em {2}
  if ((m = text.match(/^🎉 (.+?) abriu (.+?) em (.+)$/))) {
    return tr('🎉 {0} abriu {1} em {2}', [m[1], m[2], m[3]]);
  }
  // GitHub: 🎉 {0} mergeou {1} em {2}
  if ((m = text.match(/^🎉 (.+?) mergeou (.+?) em (.+)$/))) {
    return tr('🎉 {0} mergeou {1} em {2}', [m[1], m[2], m[3]]);
  }
  // GitHub: 🎉 {0} publicou {1} em {2}
  if ((m = text.match(/^🎉 (.+?) publicou (.+?) em (.+)$/))) {
    return tr('🎉 {0} publicou {1} em {2}', [m[1], m[2], m[3]]);
  }
  // GitHub: 🚀 {0} enviou commits {1}em {2}
  if ((m = text.match(/^🚀 (.+?) enviou commits (para .+? )?em (.+)$/))) {
    return tr('🚀 {0} enviou commits {1}em {2}', [m[1], m[2] || '', m[3]]);
  }
  // GitHub: 🚨 CI falhou em {0}{1}
  if ((m = text.match(/^🚨 CI falhou em (.+?)( \([^)]+\))?$/))) {
    return tr('🚨 CI falhou em {0}{1}', [m[1], m[2] || '']);
  }
  // GitHub: ✅ CI passou em {0}{1}
  if ((m = text.match(/^✅ CI passou em (.+?)( \([^)]+\))?$/))) {
    return tr('✅ CI passou em {0}{1}', [m[1], m[2] || '']);
  }

  return tr(text);
}
