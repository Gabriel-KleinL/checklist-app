const db = require('../config/database');

/**
 * GET /api/config/pneu-posicoes
 */
async function get(req, res) {
  try {
    const acao = req.query.acao || 'todos';
    const tipoVeiculoId = req.query.tipo_veiculo_id ? parseInt(req.query.tipo_veiculo_id) : null;
    const apenasHabilitados = req.query.apenas_habilitados === 'true';

    switch (acao) {
      case 'por_tipo_veiculo':
        if (!tipoVeiculoId) {
          return res.status(400).json({ erro: 'tipo_veiculo_id não informado' });
        }

        let sql = `SELECT DISTINCT pp.*
                   FROM checklist_config_pneu_posicoes pp
                   LEFT JOIN checklist_config_pneu_posicoes_tipos_veiculo pptv ON pp.id = pptv.posicao_id
                   WHERE pptv.tipo_veiculo_id = ?`;
        const params = [tipoVeiculoId];

        if (apenasHabilitados) {
          sql += ' AND pp.habilitado = 1';
        }

        sql += ' ORDER BY pp.ordem ASC, pp.nome ASC';

        const posicoes = await db.query(sql, params);
        res.json(posicoes);
        break;

      case 'todos':
      default:
        let sqlTodos = `SELECT pp.*,
                        GROUP_CONCAT(DISTINCT pptv.tipo_veiculo_id) as tipos_veiculo_associados
                        FROM checklist_config_pneu_posicoes pp
                        LEFT JOIN checklist_config_pneu_posicoes_tipos_veiculo pptv ON pp.id = pptv.posicao_id
                        WHERE 1=1`;
        const paramsTodos = [];

        if (apenasHabilitados) {
          sqlTodos += ' AND pp.habilitado = 1';
        }

        sqlTodos += ' GROUP BY pp.id ORDER BY pp.ordem ASC, pp.nome ASC';

        const todos = await db.query(sqlTodos, paramsTodos);
        res.json(todos);
        break;
    }
  } catch (error) {
    console.error('Erro em config-pneu-posicoes.get:', error);
    res.status(500).json({
      erro: 'Erro ao buscar posições de pneu',
      detalhes: error.message
    });
  }
}

/**
 * POST /api/config/pneu-posicoes
 */
async function set(req, res) {
  try {
    const acao = req.body.acao || req.body.action;

    if (acao === 'adicionar_posicao' || acao === 'add') {
      const { nome, tipo_regra = 'geral', habilitado = true, ordem = 0, usuario_id = null, tipos_veiculo_associados = [] } = req.body;

      if (!nome) {
        return res.status(400).json({ erro: 'Campo obrigatório: nome' });
      }

      const pool = db.getPool();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [result] = await connection.query(
          `INSERT INTO checklist_config_pneu_posicoes (nome, tipo_regra, habilitado, ordem, usuario_id)
           VALUES (?, ?, ?, ?, ?)`,
          [nome, tipo_regra, habilitado ? 1 : 0, ordem, usuario_id || null]
        );

        const posicaoId = result.insertId;

        if (Array.isArray(tipos_veiculo_associados) && tipos_veiculo_associados.length > 0) {
          for (const tipoId of tipos_veiculo_associados) {
            await connection.query(
              `INSERT INTO checklist_config_pneu_posicoes_tipos_veiculo (posicao_id, tipo_veiculo_id)
               VALUES (?, ?)`,
              [posicaoId, tipoId]
            );
          }
        }

        await connection.commit();
        res.json({
          sucesso: true,
          mensagem: 'Posição de pneu adicionada com sucesso',
          id: posicaoId
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } else if (acao === 'atualizar_posicao' || acao === 'update') {
      const { id, nome, habilitado, ordem } = req.body;

      if (!id) {
        return res.status(400).json({ erro: 'ID da posição não informado' });
      }

      const updates = [];
      const params = [];

      if (nome !== undefined) {
        updates.push('nome = ?');
        params.push(nome);
      }

      if (habilitado !== undefined) {
        updates.push('habilitado = ?');
        params.push(habilitado ? 1 : 0);
      }

      if (ordem !== undefined) {
        updates.push('ordem = ?');
        params.push(ordem);
      }

      if (updates.length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
      }

      params.push(id);

      await db.query(
        `UPDATE checklist_config_pneu_posicoes SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      res.json({ sucesso: true, mensagem: 'Posição atualizada com sucesso' });

    } else if (acao === 'atualizar_associacoes') {
      const { id, tipos_veiculo_associados = [] } = req.body;

      if (!id) {
        return res.status(400).json({ erro: 'ID da posição não informado' });
      }

      const pool = db.getPool();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Remove associações existentes
        await connection.query(
          `DELETE FROM checklist_config_pneu_posicoes_tipos_veiculo WHERE posicao_id = ?`,
          [id]
        );

        // Cria novas associações
        if (Array.isArray(tipos_veiculo_associados) && tipos_veiculo_associados.length > 0) {
          for (const tipoId of tipos_veiculo_associados) {
            await connection.query(
              `INSERT INTO checklist_config_pneu_posicoes_tipos_veiculo (posicao_id, tipo_veiculo_id)
               VALUES (?, ?)`,
              [id, tipoId]
            );
          }
        }

        await connection.commit();
        res.json({ sucesso: true, mensagem: 'Associações atualizadas com sucesso' });
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
    console.error('Erro em config-pneu-posicoes.set:', error);
    res.status(500).json({
      erro: 'Erro ao processar requisição de posição de pneu',
      detalhes: error.message
    });
  }
}

module.exports = { get, set };
