const db = require('../config/database');
const veicularRoutes = require('./veicular');
const checklistRoutes = require('./checklist');

/**
 * Detecta o tipo de checklist baseado nos dados
 */
function detectarTipoChecklist(dados) {
  // Se o tipo está explícito, usa ele
  if (dados.tipo) {
    return dados.tipo;
  }

  // Detecta por estrutura: checklist completo tem parte1, parte2, etc
  if (dados.parte1 || dados.parte2 || dados.parte1_interna || dados.inspecaoInicial) {
    return 'completo';
  }

  // Detecta por estrutura: checklist simples tem itens_inspecao e itens_pneus
  if (dados.itens_inspecao || dados.itens_pneus) {
    return 'simples';
  }

  // Padrão: simples
  return 'simples';
}

/**
 * GET /b_checklist_get.php (unificado)
 */
async function getUnified(req, res) {
  try {
    const tipo = req.query.tipo || 'simples';

    // Validar tipo
    if (!['simples', 'completo'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo inválido. Use: simples ou completo' });
    }

    if (tipo === 'simples') {
      // Redireciona para veicular.get
      return veicularRoutes.get(req, res);
    } else {
      // Redireciona para checklist.getCompleto
      return checklistRoutes.getCompleto(req, res);
    }
  } catch (error) {
    console.error('Erro em checklist.getUnified:', error);
    res.status(500).json({
      erro: 'Erro ao buscar checklist',
      detalhes: error.message
    });
  }
}

/**
 * POST /b_checklist_set.php (unificado)
 */
async function setUnified(req, res) {
  try {
    const dados = req.body;
    
    if (!dados) {
      return res.status(400).json({ erro: 'Dados inválidos' });
    }

    // Detecta o tipo de checklist
    const tipo = detectarTipoChecklist(dados);

    if (tipo === 'simples') {
      // Redireciona para veicular.set
      return veicularRoutes.set(req, res);
    } else {
      // Redireciona para checklist.setCompleto
      return checklistRoutes.setCompleto(req, res);
    }
  } catch (error) {
    console.error('Erro em checklist.setUnified:', error);
    res.status(500).json({
      erro: 'Erro ao salvar checklist',
      detalhes: error.message
    });
  }
}

module.exports = {
  getUnified,
  setUnified,
  detectarTipoChecklist
};
