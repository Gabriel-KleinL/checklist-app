const db = require('../config/database');

/**
 * GET /b_config_itens.php
 */
async function getItens(req, res) {
  try {
    const acao = req.query.acao || 'todos';
    const tipo = req.query.tipo; // 'simples' ou 'completo'
    const tipoVeiculoId = req.query.tipo_veiculo_id ? parseInt(req.query.tipo_veiculo_id) : null;
    const apenasHabilitados = req.query.apenas_habilitados === 'true';

    switch (acao) {
      case 'por_tipo_veiculo':
        if (!tipoVeiculoId) {
          return res.status(400).json({ erro: 'tipo_veiculo_id não informado' });
        }

        let sql = `SELECT DISTINCT ci.* 
                   FROM checklist_config_itens ci
                   LEFT JOIN checklist_config_itens_tipos_veiculo citv ON ci.id = citv.config_item_id
                   WHERE (ci.tipo_veiculo_id = ? 
                          OR (ci.tipo_veiculo_id IS NULL AND citv.tipo_veiculo_id = ?))`;
        const params = [tipoVeiculoId, tipoVeiculoId];

        if (tipo) {
          sql += ' AND ci.tipo_checklist = ?';
          params.push(tipo);
        }

        if (apenasHabilitados) {
          sql += ' AND ci.habilitado = 1';
        }

        sql += ' ORDER BY ci.categoria ASC, ci.nome_item ASC';

        const itens = await db.query(sql, params);
        res.json(itens);
        break;

      case 'todos':
      default:
        let sqlTodos = 'SELECT * FROM checklist_config_itens WHERE 1=1';
        const paramsTodos = [];

        if (tipo) {
          sqlTodos += ' AND tipo_checklist = ?';
          paramsTodos.push(tipo);
        }

        if (apenasHabilitados) {
          sqlTodos += ' AND habilitado = 1';
        }

        sqlTodos += ' ORDER BY categoria ASC, nome_item ASC';

        const todos = await db.query(sqlTodos, paramsTodos);
        res.json(todos);
        break;
    }
  } catch (error) {
    console.error('Erro em config.getItens:', error);
    res.status(500).json({
      erro: 'Erro ao buscar itens de configuração',
      detalhes: error.message
    });
  }
}

/**
 * GET /b_checklist_completo_config_itens.php
 */
async function getItensCompleto(req, res) {
  try {
    const acao = req.query.acao || 'todos';
    const tipoVeiculoId = req.query.tipo_veiculo_id ? parseInt(req.query.tipo_veiculo_id) : null;
    const apenasHabilitados = req.query.apenas_habilitados === 'true';

    switch (acao) {
      case 'por_tipo_veiculo':
        if (!tipoVeiculoId) {
          return res.status(400).json({ erro: 'tipo_veiculo_id não informado' });
        }

        let sql = `SELECT DISTINCT ci.* 
                   FROM checklist_config_itens_completo ci
                   LEFT JOIN checklist_config_itens_completo_tipos_veiculo citv ON ci.id = citv.config_item_id
                   WHERE (ci.tipo_veiculo_id = ? 
                          OR (ci.tipo_veiculo_id IS NULL AND citv.tipo_veiculo_id = ?))`;
        const params = [tipoVeiculoId, tipoVeiculoId];

        if (apenasHabilitados) {
          sql += ' AND ci.habilitado = 1';
        }

        sql += ' ORDER BY ci.categoria ASC, ci.nome_item ASC';

        const itens = await db.query(sql, params);
        res.json(itens);
        break;

      case 'todos':
      default:
        let sqlTodos = 'SELECT * FROM checklist_config_itens_completo WHERE 1=1';
        const paramsTodos = [];

        if (apenasHabilitados) {
          sqlTodos += ' AND habilitado = 1';
        }

        sqlTodos += ' ORDER BY categoria ASC, nome_item ASC';

        const todos = await db.query(sqlTodos, paramsTodos);
        res.json(todos);
        break;
    }
  } catch (error) {
    console.error('Erro em config.getItensCompleto:', error);
    res.status(500).json({
      erro: 'Erro ao buscar itens de configuração completo',
      detalhes: error.message
    });
  }
}

module.exports = {
  getItens,
  getItensCompleto
};
