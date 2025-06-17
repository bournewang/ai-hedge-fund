import i18n from '@/i18n/config';
import * as agentsEn from './agents-en';
import * as agentsZh from './agents-zh';

// Re-export the interface and types
export type { AgentItem } from './agents-en';

// Function to get the current language data
function getCurrentLanguageData() {
  const currentLanguage = i18n.language;
  return currentLanguage === 'zh' ? agentsZh : agentsEn;
}

// Export reactive getters that respond to language changes
export function getInvestmentStyles() {
  return getCurrentLanguageData().investmentStyles;
}

export function getAgents() {
  return getCurrentLanguageData().agents;
}

export function getAgentByKey(key: string) {
  return getCurrentLanguageData().agents.find(agent => agent.key === key);
}

export function getAgentsByCategory(category: string) {
  return getCurrentLanguageData().agents.filter(agent => agent.category === category);
}

// Default exports for backward compatibility - use English as default for typing
export const investmentStyles = agentsEn.investmentStyles;
export const agents = agentsEn.agents;