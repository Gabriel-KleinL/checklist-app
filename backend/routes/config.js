const db = require('../config/database');

/**
 * GET /b_config_itens.php
 */
async function getItens(req, res) {
  try {
    const acao = req.query.acao || 'todos';
    const tipo = req.query.tipo; // 'simples' ou 'completo'
    const categoria = req.query.categoria; // 'MOTOR', 'ELETRICO', 'LIMPEZA', 'FERRAMENTA', 'PNEU'
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

        if (categoria) {
          sql += ' AND ci.categoria = ?';
          params.push(categoria);
        }

        if (apenasHabilitados) {
          sql += ' AND ci.habilitado = 1';
        }

        sql += ' ORDER BY ci.categoria ASC, ci.ordem ASC, ci.nome_item ASC';

        const itens = await db.query(sql, params);
        res.json(itens);
        break;

      case 'arvore_heranca':
        // Busca todos os itens com suas associações de tipos de veículo
        let sqlArvore = `
          SELECT 
            ci.*,
            GROUP_CONCAT(DISTINCT citv.tipo_veiculo_id) as tipos_veiculo_associados,
            tv.nome as tipo_veiculo_nome,
            tv.icone as tipo_veiculo_icone
          FROM checklist_config_itens ci
          LEFT JOIN checklist_config_itens_tipos_veiculo citv ON ci.id = citv.config_item_id
          LEFT JOIN checklist_tipos_veiculo tv ON ci.tipo_veiculo_id = tv.id
          WHERE 1=1
        `;
        const paramsArvore = [];
        
        if (tipo) {
          sqlArvore += ' AND ci.tipo_checklist = ?';
          paramsArvore.push(tipo);
        }
        
        if (apenasHabilitados) {
          sqlArvore += ' AND ci.habilitado = 1';
        }
        
        sqlArvore += ` GROUP BY ci.id
          ORDER BY 
            CASE WHEN ci.tipo_veiculo_id IS NULL THEN 0 ELSE 1 END,
            ci.categoria ASC,
            ci.ordem ASC,
            ci.nome_item ASC`;
        
        const itensArvore = await db.query(sqlArvore, paramsArvore);
        
        // Busca nomes dos tipos de veículo associados
        const tiposVeiculo = await db.query('SELECT id, nome, icone FROM checklist_tipos_veiculo WHERE ativo = 1');
        const tiposMap = {};
        tiposVeiculo.forEach(tv => {
          tiposMap[tv.id] = { nome: tv.nome, icone: tv.icone };
        });
        
        // Formata os resultados
        const itensFormatados = itensArvore.map(item => {
          const tiposAssociados = item.tipos_veiculo_associados 
            ? item.tipos_veiculo_associados.split(',').map(id => parseInt(id)).filter(id => tiposMap[id])
            : [];
          
          return {
            ...item,
            tipos_veiculo_associados: tiposAssociados,
            tipos_veiculo_info: tiposAssociados.map(id => tiposMap[id]),
            tipo_veiculo_info: item.tipo_veiculo_id && tiposMap[item.tipo_veiculo_id]
              ? tiposMap[item.tipo_veiculo_id]
              : null
          };
        });
        
        res.json(itensFormatados);
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

/**
 * POST /b_config_itens.php
 */
async function setItens(req, res) {
  try {
    const acao = req.body.acao || req.body.action;
    
    if (acao === 'adicionar_item' || acao === 'add') {
      const { categoria, nome_item, habilitado = true, tem_foto = false, obrigatorio = false, tipo_resposta = 'conforme_nao_conforme', opcoes_resposta = null, tipo_veiculo_id = null, tipos_veiculo_associados = [], usuario_id = null, tipo_checklist = 'simplificado' } = req.body;

      if (!categoria || !nome_item) {
        return res.status(400).json({
          erro: 'Campos obrigatórios: categoria e nome_item'
        });
      }

      const pool = db.getPool();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Insere o item
        const opcoesJson = opcoes_resposta ? JSON.stringify(opcoes_resposta) : null;
        const [result] = await connection.query(
          `INSERT INTO checklist_config_itens
           (categoria, nome_item, habilitado, tem_foto, obrigatorio, tipo_resposta, opcoes_resposta, tipo_veiculo_id, usuario_id, tipo_checklist)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [categoria, nome_item, habilitado ? 1 : 0, tem_foto ? 1 : 0, obrigatorio ? 1 : 0, tipo_resposta, opcoesJson, tipo_veiculo_id || null, usuario_id || null, tipo_checklist]
        );

        const itemId = result.insertId;

        // Se for item geral (tipo_veiculo_id é null) e tiver tipos associados, cria as associações
        if (!tipo_veiculo_id && Array.isArray(tipos_veiculo_associados) && tipos_veiculo_associados.length > 0) {
          for (const tipoId of tipos_veiculo_associados) {
            await connection.query(
              `INSERT INTO checklist_config_itens_tipos_veiculo (config_item_id, tipo_veiculo_id) 
               VALUES (?, ?)`,
              [itemId, tipoId]
            );
          }
        }

        await connection.commit();

        res.json({
          sucesso: true,
          mensagem: 'Item adicionado com sucesso',
          id: itemId
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else if (acao === 'atualizar_item' || acao === 'update') {
      const { id, habilitado, nome_item, tem_foto, obrigatorio, tipo_resposta, opcoes_resposta } = req.body;

      if (!id) {
        return res.status(400).json({ erro: 'ID do item não informado' });
      }

      const updates = [];
      const params = [];

      if (habilitado !== undefined) {
        updates.push('habilitado = ?');
        params.push(habilitado ? 1 : 0);
      }

      if (nome_item) {
        updates.push('nome_item = ?');
        params.push(nome_item);
      }

      if (tem_foto !== undefined) {
        updates.push('tem_foto = ?');
        params.push(tem_foto ? 1 : 0);
      }

      if (obrigatorio !== undefined) {
        updates.push('obrigatorio = ?');
        params.push(obrigatorio ? 1 : 0);
      }

      if (tipo_resposta !== undefined) {
        updates.push('tipo_resposta = ?');
        params.push(tipo_resposta);
      }

      if (opcoes_resposta !== undefined) {
        updates.push('opcoes_resposta = ?');
        params.push(opcoes_resposta ? JSON.stringify(opcoes_resposta) : null);
      }

      if (updates.length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
      }

      params.push(id);

      await db.query(
        `UPDATE checklist_config_itens SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      res.json({ sucesso: true, mensagem: 'Item atualizado com sucesso' });
    } else if (acao === 'mover_item') {
      const { id, categoria } = req.body;

      if (!id || !categoria) {
        return res.status(400).json({ erro: 'ID e categoria são obrigatórios' });
      }

      await db.query(
        `UPDATE checklist_config_itens SET categoria = ? WHERE id = ?`,
        [categoria, id]
      );

      res.json({ sucesso: true, mensagem: 'Item movido com sucesso' });
    } else if (acao === 'atualizar_tipo_veiculo') {
      const { id, tipo_veiculo_id } = req.body;

      if (!id) {
        return res.status(400).json({ erro: 'ID do item não informado' });
      }

      const pool = db.getPool();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Atualiza o tipo_veiculo_id do item
        await connection.query(
          `UPDATE checklist_config_itens SET tipo_veiculo_id = ? WHERE id = ?`,
          [tipo_veiculo_id || null, id]
        );

        // Se tipo_veiculo_id for null (tornar geral), remove todas as associações
        if (!tipo_veiculo_id) {
          await connection.query(
            `DELETE FROM checklist_config_itens_tipos_veiculo WHERE config_item_id = ?`,
            [id]
          );
        }

        await connection.commit();
        res.json({ sucesso: true, mensagem: 'Tipo de veículo atualizado com sucesso' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else {
      res.status(400).json({ erro: 'Ação não reconhecida' });
    }
  } catch (error) {
    console.error('Erro em config.setItens:', error);
    res.status(500).json({
      erro: 'Erro ao processar requisição',
      detalhes: error.message
    });
  }
}

module.exports = {
  getItens,
  getItensCompleto,
  setItens
};
